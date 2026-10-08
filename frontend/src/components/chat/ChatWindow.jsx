import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingDots from './TypingDots';
import { useChatContext } from '../../context/ChatContext';
import { useAuth } from '../../hooks/useAuth';
import { MessageSquare, ArrowDown, Plus } from 'lucide-react';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import { MessageSkeleton } from '../common/Skeletons';
import { formatDayLabel, isSameDay } from '../../utils/formatDate';

// Consecutive messages from the same sender within this window are grouped
const GROUP_GAP_MS = 5 * 60 * 1000;

const senderIdOf = (msg) => msg.sender?._id || msg.sender;

const ChatWindow = ({ onOpenMobileSidebar, onNewChat }) => {
  const { user } = useAuth();
  const { activeConversation, messages, loadingMessages, typingState, sendMessageText } = useChatContext();

  const scrollRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const prevLenRef = useRef(0);
  const [showJump, setShowJump] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const recipient = activeConversation?.participants.find((p) => p._id !== user?._id) || {};
  const convTyping = (activeConversation && typingState[activeConversation._id]) || {};
  const isTyping = Object.keys(convTyping).length > 0;

  const scrollToBottom = (behavior = 'smooth') => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    isAtBottomRef.current = atBottom;
    setShowJump(!atBottom);
    if (atBottom) setNewCount(0);
  };

  // Reset per-conversation UI state
  useEffect(() => {
    setNewCount(0);
    setShowJump(false);
    setIsSearchOpen(false);
    setSearchQuery('');
    isAtBottomRef.current = true;
  }, [activeConversation?._id]);

  // Jump to the latest message once history has loaded
  useLayoutEffect(() => {
    if (!loadingMessages) {
      scrollToBottom('auto');
      prevLenRef.current = messages.length;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMessages, activeConversation?._id]);

  // New messages: follow along if at the bottom (or if I sent it), otherwise show a "new messages" pill
  useEffect(() => {
    const prev = prevLenRef.current;
    prevLenRef.current = messages.length;
    if (loadingMessages || messages.length <= prev) return;

    const last = messages[messages.length - 1];
    const isMine = senderIdOf(last) === user?._id;
    if (isAtBottomRef.current || isMine) {
      requestAnimationFrame(() => scrollToBottom('smooth'));
    } else {
      setNewCount((c) => c + (messages.length - prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  useEffect(() => {
    if (isTyping && isAtBottomRef.current) requestAnimationFrame(() => scrollToBottom('smooth'));
  }, [isTyping]);

  const query = searchQuery.trim().toLowerCase();

  // Build the render list: day separators, unread divider and grouped messages
  const { items, matchCount } = useMemo(() => {
    const firstUnreadIndex = messages.findIndex(
      (m) => senderIdOf(m) !== user?._id && m.status !== 'seen'
    );

    const source = query
      ? messages.filter((m) => !m.isDeletedForEveryone && (m.text || '').toLowerCase().includes(query))
      : messages;

    const list = [];
    source.forEach((msg, i) => {
      const prev = source[i - 1];
      const next = source[i + 1];
      const isFirstUnread = !query && messages[firstUnreadIndex] === msg;

      if (!prev || !isSameDay(prev.createdAt, msg.createdAt)) {
        list.push({ type: 'day', key: `day-${msg.createdAt}`, label: formatDayLabel(msg.createdAt) });
      }
      if (isFirstUnread) {
        list.push({ type: 'unread', key: 'unread-divider' });
      }

      const continuesFrom = (a, b) =>
        a &&
        b &&
        senderIdOf(a) === senderIdOf(b) &&
        isSameDay(a.createdAt, b.createdAt) &&
        Math.abs(new Date(b.createdAt) - new Date(a.createdAt)) < GROUP_GAP_MS;

      const nextIsFirstUnread = !query && next && messages[firstUnreadIndex] === next;

      list.push({
        type: 'msg',
        key: msg._id || `${msg.createdAt}-${i}`,
        msg,
        isOutgoing: senderIdOf(msg) === user?._id,
        isFirst: !continuesFrom(prev, msg) || isFirstUnread,
        isLast: !continuesFrom(msg, next) || nextIsFirstUnread,
      });
    });

    return { items: list, matchCount: query ? source.length : 0 };
  }, [messages, user?._id, query]);

  if (!activeConversation) {
    return (
      <main className="flex-1 min-w-0 flex flex-col items-center justify-center p-6 text-center bg-ink-950 relative pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] md:pl-0">
        <div className="max-w-sm flex flex-col items-center animate-slide-up">
          <div className="w-14 h-14 rounded-2xl bg-ink-800 border border-line ring-8 ring-white/[0.02] flex items-center justify-center text-accent-300">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h2 className="mt-6 text-xl font-semibold tracking-tight text-fg">Welcome to ChatApp</h2>
          <p className="mt-2 text-sm text-fg-muted leading-relaxed">
            Select a conversation from the sidebar or start a new one.
          </p>
          <Button variant="primary" icon={Plus} onClick={onNewChat} className="mt-6">
            New chat
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-w-0 flex flex-col h-full bg-ink-950 overflow-hidden relative pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] md:pl-0">
      <ChatHeader
        conversation={activeConversation}
        onOpenMobileSidebar={onOpenMobileSidebar}
        isSearchOpen={isSearchOpen}
        onToggleSearch={() => {
          setIsSearchOpen((o) => !o);
          setSearchQuery('');
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        matchCount={matchCount}
      />

      {/* Message stream */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        // Media finishing loading grows the list; stay pinned to the bottom if we were there
        onLoadCapture={() => isAtBottomRef.current && scrollToBottom('auto')}
        className="flex-1 overflow-y-auto overflow-x-hidden"
      >
        {loadingMessages ? (
          <MessageSkeleton />
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 animate-fade-in">
            <Avatar src={recipient.profilePhoto} name={recipient.fullName} size="xl" />
            <h3 className="mt-4 text-base font-semibold text-fg">{recipient.fullName}</h3>
            <p className="mt-1 text-[13px] text-fg-subtle">This is the beginning of your conversation.</p>
            <Button variant="secondary" size="sm" className="mt-5" onClick={() => sendMessageText('Hello 👋')}>
              Say hello 👋
            </Button>
          </div>
        ) : query && matchCount === 0 ? (
          <div className="h-full flex items-center justify-center p-6 text-[13px] text-fg-muted animate-fade-in">
            No messages match “{searchQuery}”
          </div>
        ) : (
          <div className="mx-auto w-full max-w-4xl 3xl:max-w-6xl px-3 sm:px-6 pt-4 pb-3">
            {items.map((item) => {
              if (item.type === 'day') {
                return (
                  <div key={item.key} className="flex justify-center my-4 select-none">
                    <span className="px-2.5 py-1 rounded-full bg-ink-850 border border-line text-[11px] font-medium text-fg-muted">
                      {item.label}
                    </span>
                  </div>
                );
              }

              if (item.type === 'unread') {
                return (
                  <div key={item.key} className="flex items-center gap-3 my-4 select-none animate-fade-in">
                    <div className="flex-1 h-px bg-accent-500/30" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-accent-300">
                      New messages
                    </span>
                    <div className="flex-1 h-px bg-accent-500/30" />
                  </div>
                );
              }

              return (
                <MessageBubble
                  key={item.key}
                  message={item.msg}
                  isOutgoing={item.isOutgoing}
                  isFirst={item.isFirst}
                  isLast={item.isLast}
                  highlight={query}
                />
              );
            })}

            {/* Typing indicator */}
            {isTyping && !query && (
              <div className="flex items-end gap-2 mt-3 animate-slide-up" aria-live="polite">
                <Avatar src={recipient.profilePhoto} name={recipient.fullName} size="xs" className="mb-0.5" />
                <div className="px-3.5 py-3 rounded-bubble rounded-bl-md bg-ink-800 border border-line">
                  <TypingDots className="text-fg-muted" />
                  <span className="sr-only">{Object.values(convTyping).join(', ')} is typing</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Jump to latest / new messages pill, anchored just above the composer */}
      <div className="relative h-0 z-10">
        {showJump && !loadingMessages && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
            <button
              onClick={() => {
                scrollToBottom('smooth');
                setNewCount(0);
              }}
              className={`pointer-events-auto flex items-center gap-1.5 h-8 touch:h-9 rounded-full border shadow-pop text-xs font-medium transition-colors animate-scale-in ${
                newCount > 0
                  ? 'px-3 bg-accent-400 border-accent-300/30 text-white hover:bg-accent-500'
                  : 'w-8 touch:w-9 justify-center bg-ink-800 border-line text-fg-muted hover:text-fg'
              }`}
              aria-label={newCount > 0 ? `${newCount} new messages` : 'Jump to latest'}
            >
              <ArrowDown className="w-3.5 h-3.5" />
              {newCount > 0 && <span>{newCount} new</span>}
            </button>
          </div>
        )}
      </div>

      <MessageInput />
    </main>
  );
};

export default ChatWindow;
