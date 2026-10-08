import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { messageService } from '../services/messageService';
import { userService } from '../services/userService';
import { SOCKET_URL } from '../utils/constants';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [typingState, setTypingState] = useState({}); // { conversationId: { userId: name } }
  const [unreadCounts, setUnreadCounts] = useState({}); // { conversationId: count }
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);

  const processedUnreadMsgsRef = useRef(new Set());
  const activeConvRef = useRef(activeConversation);
  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);

  // Connect Socket.IO when user is authenticated
  useEffect(() => {
    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    newSocket.on('user:online', ({ userId, onlineUsers }) => {
      if (onlineUsers) {
        setOnlineUserIds(onlineUsers);
      }
    });

    newSocket.on('user:offline', ({ userId, onlineUsers }) => {
      if (onlineUsers) {
        setOnlineUserIds(onlineUsers);
      }
    });

    // Initial unread counts from socket
    newSocket.on('unread:counts', (counts) => {
      if (counts) {
        setUnreadCounts(counts);
      }
    });

    newSocket.on('message:receive', (newMessage) => {
      const currentConv = activeConvRef.current;
      const senderId = newMessage.sender?._id || newMessage.sender;
      const isFromOther = user && senderId !== user._id;
      const isCurrentActive = currentConv && currentConv._id === newMessage.conversationId;

      // If message is for another conversation and from someone else, increment unread
      if (isFromOther && !isCurrentActive) {
        if (newMessage._id && !processedUnreadMsgsRef.current.has(newMessage._id)) {
          processedUnreadMsgsRef.current.add(newMessage._id);
          setUnreadCounts((prev) => ({
            ...prev,
            [newMessage.conversationId]: (prev[newMessage.conversationId] || 0) + 1,
          }));
        }

        // Acknowledge delivery
        newSocket.emit('message:delivered', {
          messageId: newMessage._id,
          conversationId: newMessage.conversationId,
          senderId,
        });
      }

      // If user is currently viewing this conversation, mark delivered and seen immediately
      if (isFromOther && isCurrentActive) {
        newSocket.emit('message:delivered', {
          messageId: newMessage._id,
          conversationId: newMessage.conversationId,
          senderId,
        });

        newSocket.emit('conversation:seen', {
          conversationId: newMessage.conversationId,
          senderId,
        });

        messageService.markConversationSeen(newMessage.conversationId).catch((err) => {
          console.error('Failed to mark incoming active message seen:', err);
        });
      }

      // Update active conversation message stream
      if (isCurrentActive) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
      }

      // Update conversations list (latest message preview and timestamp)
      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv._id === newMessage.conversationId) {
            return {
              ...conv,
              lastMessage: newMessage,
              lastMessageAt: newMessage.createdAt,
              updatedAt: newMessage.createdAt,
            };
          }
          return conv;
        }).sort((a, b) => new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt));
      });
    });

    // Handle real-time status updates (sent -> delivered)
    newSocket.on('message:statusUpdated', ({ conversationId, messageIds, status, deliveredAt, seenAt }) => {
      const idSet = new Set(Array.isArray(messageIds) ? messageIds : [messageIds]);

      setMessages((prev) =>
        prev.map((msg) => {
          if (idSet.has(msg._id)) {
            // Never revert status from seen to delivered
            if (msg.status === 'seen' && status !== 'seen') return msg;
            return {
              ...msg,
              status,
              deliveredAt: deliveredAt || msg.deliveredAt,
              seenAt: seenAt || msg.seenAt,
            };
          }
          return msg;
        })
      );

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv._id === conversationId && conv.lastMessage && idSet.has(conv.lastMessage._id)) {
            if (conv.lastMessage.status === 'seen' && status !== 'seen') return conv;
            return {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                status,
                deliveredAt: deliveredAt || conv.lastMessage.deliveredAt,
                seenAt: seenAt || conv.lastMessage.seenAt,
              },
            };
          }
          return conv;
        })
      );
    });

    // Handle real-time seen event for an entire conversation
    newSocket.on('messages:seen', ({ conversationId, readerId, messageIds, seenAt }) => {
      const idSet = messageIds ? new Set(messageIds) : null;
      const seenTime = seenAt || new Date();

      setMessages((prev) =>
        prev.map((msg) => {
          // If this message belongs to the conversation and was sent by current user, or is in messageIds
          const isSentByMe = user && (msg.sender?._id === user._id || msg.sender === user._id);
          if (isSentByMe || (idSet && idSet.has(msg._id))) {
            return {
              ...msg,
              status: 'seen',
              seenAt: seenTime,
            };
          }
          return msg;
        })
      );

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv._id === conversationId && conv.lastMessage) {
            const isLastMsgSentByMe = user && (conv.lastMessage.sender?._id === user._id || conv.lastMessage.sender === user._id);
            if (isLastMsgSentByMe || (idSet && idSet.has(conv.lastMessage._id))) {
              return {
                ...conv,
                lastMessage: {
                  ...conv.lastMessage,
                  status: 'seen',
                  seenAt: seenTime,
                },
              };
            }
          }
          return conv;
        })
      );
    });

    newSocket.on('typing:start', ({ conversationId, senderId, senderName }) => {
      setTypingState((prev) => ({
        ...prev,
        [conversationId]: {
          ...(prev[conversationId] || {}),
          [senderId]: senderName || 'Someone',
        },
      }));
    });

    newSocket.on('typing:stop', ({ conversationId, senderId }) => {
      setTypingState((prev) => {
        const convTyping = { ...(prev[conversationId] || {}) };
        delete convTyping[senderId];
        return {
          ...prev,
          [conversationId]: convTyping,
        };
      });
    });

    newSocket.on('message:delete', ({ messageId, conversationId }) => {
      if (processedUnreadMsgsRef.current.has(messageId)) {
        processedUnreadMsgsRef.current.delete(messageId);
        setUnreadCounts((prev) => {
          const currentCount = prev[conversationId] || 0;
          if (currentCount <= 1) {
            const updated = { ...prev };
            delete updated[conversationId];
            return updated;
          }
          return {
            ...prev,
            [conversationId]: currentCount - 1,
          };
        });
      }

      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      fetchConversations();
    });

    newSocket.on('message:update', (updatedMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
      );
      fetchConversations();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  // Load conversations list and unread counts
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConversations(true);
    try {
      const [convData, unreadData] = await Promise.all([
        messageService.getConversations(),
        messageService.getUnreadCounts().catch(() => ({})),
      ]);
      setConversations(convData);
      if (unreadData) {
        setUnreadCounts(unreadData);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Select active conversation and load messages
  const selectConversation = async (conv) => {
    setActiveConversation(conv);
    if (!conv) {
      setMessages([]);
      return;
    }

    // Clear unread count for selected conversation
    setUnreadCounts((prev) => {
      const updated = { ...prev };
      delete updated[conv._id];
      return updated;
    });

    const recipient = conv.participants?.find((p) => p._id !== user?._id);

    // Notify socket and mark seen on server
    if (socket) {
      socket.emit('conversation:join', conv._id);
      socket.emit('conversation:seen', {
        conversationId: conv._id,
        senderId: recipient?._id,
      });
    }

    messageService.markConversationSeen(conv._id).catch((err) => {
      console.error('Error marking conversation seen:', err);
    });

    setLoadingMessages(true);
    try {
      const data = await messageService.getMessages(conv._id);
      setMessages(data);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Start or open conversation with target user
  const startConversationWithUser = async (targetUser) => {
    try {
      const conv = await messageService.accessConversation(targetUser._id);
      
      // Update conversations list if new
      setConversations((prev) => {
        if (prev.some((c) => c._id === conv._id)) return prev;
        return [conv, ...prev];
      });

      await selectConversation(conv);
      return conv;
    } catch (err) {
      console.error('Error starting conversation:', err);
      throw err;
    }
  };

  // Search users
  const handleSearchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const results = await userService.searchUsers(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Send text message
  const sendMessageText = async (text) => {
    if (!activeConversation || !text.trim() || !user) return;

    const recipient = activeConversation.participants.find(
      (p) => p._id !== user._id
    );

    if (!recipient) return;

    const payload = {
      conversationId: activeConversation._id,
      receiverId: recipient._id,
      text: text.trim(),
    };

    if (socket && socket.connected) {
      // Send real-time via Socket.IO
      socket.emit('message:send', payload, (res) => {
        if (res.error) {
          console.error('Socket message send error:', res.error);
        }
      });
    } else {
      // Fallback via HTTP REST API
      try {
        const newMsg = await messageService.sendMessage(payload);
        setMessages((prev) => [...prev, newMsg]);
      } catch (err) {
        console.error('HTTP message send error:', err);
      }
    }
  };

  // Send media message (image / video)
  const sendMediaMessage = async (file, text = '', onProgress) => {
    if (!activeConversation || !file || !user) return;

    const recipient = activeConversation.participants.find(
      (p) => p._id !== user._id
    );

    if (!recipient) return;

    const formData = new FormData();
    formData.append('conversationId', activeConversation._id);
    formData.append('receiverId', recipient._id);
    formData.append('text', text);
    formData.append('file', file);

    const newMsg = await messageService.uploadMedia(formData, onProgress);
    
    // Append locally if not already present from socket event
    setMessages((prev) => {
      if (prev.some((m) => m._id === newMsg._id)) return prev;
      return [...prev, newMsg];
    });

    return newMsg;
  };

  // Typing indicator
  const emitTyping = (isTyping) => {
    if (!socket || !activeConversation || !user) return;

    const recipient = activeConversation.participants.find(
      (p) => p._id !== user._id
    );

    if (isTyping) {
      socket.emit('typing:start', {
        conversationId: activeConversation._id,
        receiverId: recipient?._id,
      });
    } else {
      socket.emit('typing:stop', {
        conversationId: activeConversation._id,
        receiverId: recipient?._id,
      });
    }
  };

  // Delete message — scope: 'me' (hide for current user) or 'everyone' (sender only)
  const deleteMessage = async (messageId, scope = 'me') => {
    try {
      const res = await messageService.deleteMessage(messageId, scope);
      if (scope === 'everyone' && res.message) {
        setMessages((prev) => prev.map((m) => (m._id === messageId ? res.message : m)));
      } else {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      }
      if (editingMessage?._id === messageId) {
        setEditingMessage(null);
      }
      fetchConversations();
    } catch (err) {
      console.error('Error deleting message:', err);
      throw err;
    }
  };

  // Edit message
  const editMessage = async (messageId, text) => {
    try {
      const updated = await messageService.updateMessage(messageId, text);
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? updated : m))
      );
      fetchConversations();
      return updated;
    } catch (err) {
      console.error('Error editing message:', err);
      throw err;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        socket,
        conversations,
        activeConversation,
        messages,
        loadingMessages,
        loadingConversations,
        onlineUserIds,
        typingState,
        unreadCounts,
        searchResults,
        isSearching,
        editingMessage,
        setEditingMessage,
        selectConversation,
        startConversationWithUser,
        searchUsers: handleSearchUsers,
        sendMessageText,
        sendMediaMessage,
        deleteMessage,
        editMessage,
        emitTyping,
        fetchConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => useContext(ChatContext);
