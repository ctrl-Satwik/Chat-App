import React, { useMemo, useState } from 'react';
import UserProfile from './UserProfile';
import ConversationItem from './ConversationItem';
import Logo from '../common/Logo';
import IconButton from '../common/IconButton';
import Button from '../common/Button';
import { ConversationSkeleton } from '../common/Skeletons';
import { useChatContext } from '../../context/ChatContext';
import { useAuth } from '../../hooks/useAuth';
import { conversationBucket } from '../../utils/formatDate';
import { Plus, Search, X, MessageSquarePlus, PenSquare } from 'lucide-react';

const BUCKET_ORDER = ['Today', 'Yesterday', 'This week', 'Earlier'];

const Sidebar = ({ isOpenOnMobile, isPrimaryView, canCloseMobile, onCloseMobile, onNewChat }) => {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    selectConversation,
    onlineUserIds,
    unreadCounts,
    typingState,
    loadingConversations,
  } = useChatContext();
  const [filter, setFilter] = useState('');

  const handleSelectConv = (conv) => {
    selectConversation(conv);
    if (onCloseMobile) onCloseMobile();
  };

  const getRecipient = (conv) => conv.participants.find((p) => p._id !== user?._id) || {};

  // Filter by name, then group into Today / Yesterday / This week / Earlier
  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const visible = conversations
      .filter((conv) => !q || (getRecipient(conv).fullName || '').toLowerCase().includes(q))
      .slice()
      .sort((a, b) => new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt));

    const byBucket = {};
    visible.forEach((conv) => {
      const bucket = conversationBucket(conv.lastMessageAt || conv.updatedAt);
      (byBucket[bucket] = byBucket[bucket] || []).push(conv);
    });
    return BUCKET_ORDER.filter((b) => byBucket[b]).map((b) => ({ label: b, items: byBucket[b] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, filter, user?._id]);

  const isFiltering = filter.trim().length > 0;
  const hasResults = groups.length > 0;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col h-full w-full sm:w-[340px] md:w-[300px] lg:w-[320px] xl:w-[340px] 2xl:w-[360px] md:relative md:translate-x-0 pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] bg-ink-900 border-r border-line max-md:transition-transform max-md:duration-200 max-md:ease-out ${
        isPrimaryView ? 'sm:relative' : ''
      } ${isOpenOnMobile ? 'translate-x-0' : '-translate-x-full'}`}
      aria-label="Conversations"
    >
      {/* Header */}
      <div className="h-16 short:h-14 flex-shrink-0 flex items-center justify-between gap-2 px-4 border-b border-line">
        <Logo withText />
        <div className="flex items-center gap-0.5">
          <IconButton icon={PenSquare} label="New chat" onClick={onNewChat} tooltipSide="bottom" tooltipAlign={canCloseMobile ? undefined : 'end'} />
          {canCloseMobile && (
            <IconButton
              icon={X}
              label="Close"
              onClick={onCloseMobile}
              className="md:hidden"
              tooltipSide="bottom"
              tooltipAlign="end"
            />
          )}
        </div>
      </div>

      {/* Search + new chat */}
      <div className="px-3 pt-3 pb-2 space-y-2 flex-shrink-0">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle group-focus-within:text-fg-muted transition-colors pointer-events-none" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search chats"
            aria-label="Search chats"
            className="w-full h-9 touch:h-10 pl-9 pr-8 text-base sm:text-[13px] bg-ink-750 border border-line rounded-lg text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent-300/45 focus:ring-4 focus:ring-accent-400/10 transition-[border-color,box-shadow] duration-150"
          />
          {filter && (
            <button
              onClick={() => setFilter('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-fg-subtle hover:text-fg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={onNewChat}
          className="short:hidden w-full h-9 touch:h-10 flex items-center gap-2 px-3 rounded-lg text-[13px] font-medium text-fg-muted border border-dashed border-line-strong hover:border-accent-400/40 hover:text-fg hover:bg-white/[0.03] transition-colors duration-150"
        >
          <Plus className="w-4 h-4" />
          New conversation
        </button>
      </div>

      {/* Conversation list */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden pb-3">
        {loadingConversations && conversations.length === 0 ? (
          <ConversationSkeleton />
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center text-center px-6 pt-12 animate-fade-in">
            <div className="w-11 h-11 rounded-xl bg-ink-800 border border-line flex items-center justify-center text-fg-muted">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <h4 className="mt-4 text-sm font-semibold text-fg">No conversations yet</h4>
            <p className="mt-1 text-[13px] text-fg-subtle max-w-[220px]">
              Find someone by name or email to start chatting.
            </p>
            <Button size="sm" variant="secondary" icon={Plus} onClick={onNewChat} className="mt-4">
              New chat
            </Button>
          </div>
        ) : !hasResults && isFiltering ? (
          <div className="px-6 pt-10 text-center animate-fade-in">
            <p className="text-[13px] text-fg-muted">No chats match “{filter}”</p>
            <button
              onClick={onNewChat}
              className="mt-2 text-[13px] font-medium text-accent-300 hover:text-accent-400 transition-colors"
            >
              Find a person instead
            </button>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="pt-2">
              <h5 className="px-5 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-subtle select-none">
                {group.label}
              </h5>
              <div className="px-2 space-y-px">
                {group.items.map((conv) => {
                  const recipient = getRecipient(conv);
                  const isOnline = recipient._id ? onlineUserIds.includes(recipient._id) : false;
                  const isTyping = Object.keys(typingState[conv._id] || {}).length > 0;

                  return (
                    <ConversationItem
                      key={conv._id}
                      conversation={conv}
                      isActive={activeConversation?._id === conv._id}
                      onClick={() => handleSelectConv(conv)}
                      isOnline={isOnline}
                      isTyping={isTyping}
                      unreadCount={unreadCounts[conv._id] || 0}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </nav>

      {/* Current user */}
      <UserProfile />
    </aside>
  );
};

export default Sidebar;
