const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const {
  markPendingMessagesDeliveredForUser,
  markMessageDelivered,
  markMessagesSeen,
  getUnreadCounts,
} = require('../services/messageStatusService');

// Map to store connected users: userId -> Set of socketIds
const onlineUsers = new Map();

const isUserOnline = (userId) => {
  if (!userId) return false;
  const uid = userId.toString();
  return onlineUsers.has(uid) && onlineUsers.get(uid).size > 0;
};

const initializeSocket = (io) => {
  // Middleware for Socket Authentication
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket authentication failed:', err.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`User connected: ${socket.user.fullName} (${socket.id})`);

    // Register online user socket
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Update online status in database
    await User.findByIdAndUpdate(userId, { isOnline: true });

    // Join personal user room for direct user-targeted socket events
    socket.join(userId);

    // Broadcast updated online users list
    const getOnlineUserIds = () => Array.from(onlineUsers.keys());
    io.emit('user:online', {
      userId,
      onlineUsers: getOnlineUserIds(),
    });

    // Send initial unread counts to the connected user
    getUnreadCounts(userId).then((unreadMap) => {
      socket.emit('unread:counts', unreadMap);
    });

    // Mark pending undelivered messages as delivered now that receiver is online
    markPendingMessagesDeliveredForUser(userId).then((deliveredMessages) => {
      if (deliveredMessages && deliveredMessages.length > 0) {
        // Group delivered messages by conversation & sender to notify each sender
        const senderMap = new Map();
        deliveredMessages.forEach((msg) => {
          const sId = msg.sender?._id?.toString() || msg.sender?.toString();
          const convId = msg.conversationId?.toString();
          const key = `${sId}_${convId}`;
          if (!senderMap.has(key)) {
            senderMap.set(key, { senderId: sId, conversationId: convId, messageIds: [] });
          }
          senderMap.get(key).messageIds.push(msg._id.toString());
        });

        const now = new Date();
        senderMap.forEach(({ senderId, conversationId, messageIds }) => {
          io.to(senderId).to(conversationId).emit('message:statusUpdated', {
            conversationId,
            messageIds,
            status: 'delivered',
            deliveredAt: now,
          });
        });
      }
    });

    // Handle joining conversation rooms
    socket.on('conversation:join', (conversationId) => {
      if (conversationId) {
        socket.join(conversationId);
        console.log(`Socket ${socket.id} joined conversation room: ${conversationId}`);
      }
    });

    // Handle leaving conversation rooms
    socket.on('conversation:leave', (conversationId) => {
      if (conversationId) {
        socket.leave(conversationId);
        console.log(`Socket ${socket.id} left conversation room: ${conversationId}`);
      }
    });

    // Handle typing start
    socket.on('typing:start', ({ conversationId, receiverId }) => {
      if (conversationId) {
        socket.to(conversationId).emit('typing:start', {
          conversationId,
          senderId: userId,
          senderName: socket.user.fullName,
        });
      } else if (receiverId) {
        io.to(receiverId).emit('typing:start', {
          conversationId,
          senderId: userId,
          senderName: socket.user.fullName,
        });
      }
    });

    // Handle typing stop
    socket.on('typing:stop', ({ conversationId, receiverId }) => {
      if (conversationId) {
        socket.to(conversationId).emit('typing:stop', {
          conversationId,
          senderId: userId,
        });
      } else if (receiverId) {
        io.to(receiverId).emit('typing:stop', {
          conversationId,
          senderId: userId,
        });
      }
    });

    // Handle real-time sending of messages
    socket.on('message:send', async (data, callback) => {
      try {
        const { conversationId, receiverId, text, messageType = 'text', mediaUrl = '' } = data;

        if (!conversationId || !receiverId) {
          if (callback) callback({ error: 'conversationId and receiverId are required' });
          return;
        }

        // Determine if receiver is currently online
        const receiverOnline = isUserOnline(receiverId);
        const status = receiverOnline ? 'delivered' : 'sent';
        const deliveredAt = receiverOnline ? new Date() : null;

        // Save message to MongoDB
        const message = await Message.create({
          conversationId,
          sender: userId,
          receiver: receiverId,
          text: text || '',
          messageType,
          mediaUrl,
          status,
          deliveredAt,
        });

        // Update last message in Conversation
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          lastMessageAt: new Date(),
        });

        // Populate message with sender and receiver details
        const fullMessage = await Message.findById(message._id)
          .populate('sender', 'fullName email profilePhoto')
          .populate('receiver', 'fullName email profilePhoto');

        // Emit message to conversation room and receiver's user room (Socket.IO deduplicates targets)
        io.to(conversationId).to(receiverId).emit('message:receive', fullMessage);

        if (callback) {
          callback({ status: 'ok', message: fullMessage });
        }
      } catch (err) {
        console.error('Error handling message:send:', err.message);
        if (callback) callback({ error: err.message });
      }
    });

    // Handle delivery receipt from client
    socket.on('message:delivered', async ({ messageId, conversationId, senderId }) => {
      try {
        if (!messageId) return;
        const updatedMessage = await markMessageDelivered(messageId, userId);
        if (updatedMessage && senderId) {
          io.to(senderId.toString()).to(conversationId?.toString()).emit('message:statusUpdated', {
            conversationId: conversationId?.toString() || updatedMessage.conversationId.toString(),
            messageIds: [messageId.toString()],
            status: 'delivered',
            deliveredAt: updatedMessage.deliveredAt,
          });
        }
      } catch (err) {
        console.error('Error handling message:delivered:', err);
      }
    });

    // Handle seen / read receipt for an entire conversation
    socket.on('conversation:seen', async ({ conversationId, senderId }) => {
      try {
        if (!conversationId) return;
        const result = await markMessagesSeen(conversationId, userId);
        if (result.modifiedCount > 0) {
          const eventPayload = {
            conversationId: conversationId.toString(),
            readerId: userId,
            messageIds: result.messageIds.map((id) => id.toString()),
            seenAt: result.seenAt,
          };

          if (senderId) {
            io.to(conversationId.toString()).to(senderId.toString()).emit('messages:seen', eventPayload);
          } else {
            io.to(conversationId.toString()).emit('messages:seen', eventPayload);
          }
        }
      } catch (err) {
        console.error('Error handling conversation:seen:', err);
      }
    });

    // Handle user disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.fullName} (${socket.id})`);

      if (onlineUsers.has(userId)) {
        const userSockets = onlineUsers.get(userId);
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          const lastSeen = new Date();
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });

          io.emit('user:offline', {
            userId,
            lastSeen,
            onlineUsers: Array.from(onlineUsers.keys()),
          });
        }
      }
    });
  });
};

module.exports = { initializeSocket, isUserOnline };

