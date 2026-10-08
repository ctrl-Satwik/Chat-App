import React from 'react';
import Avatar from '../common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { formatConversationTime } from '../../utils/formatDate';
import { Image, Video, Check, CheckCheck, Ban } from 'lucide-react';
import TypingDots from '../chat/TypingDots';

const ConversationItem = ({ conversation, isActive, onClick, isOnline, isTyping = false, unreadCount = 0 }) => {
  const { user } = useAuth();

  const recipient = conversation.participants.find((p) => p._id !== user._id) || {};
  const lastMsg = conversation.lastMessage;
  const hasUnread = unreadCount > 0 && !isActive;

  const renderStatusIcon = () => {
    if (!lastMsg) return null;
    const isMe = lastMsg.sender?._id === user._id || lastMsg.sender === user._id;
    if (!isMe || lastMsg.isDeletedForEveryone) return null;

    if (lastMsg.status === 'seen') {
      return <CheckCheck className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />;
    }
    if (lastMsg.status === 'delivered') {
      return <CheckCheck className="w-3.5 h-3.5 text-fg-subtle flex-shrink-0" />;
    }
    return <Check className="w-3.5 h-3.5 text-fg-subtle flex-shrink-0" />;
  };

  const renderLastMessagePreview = () => {
    if (isTyping) {
      return (
        <span className="flex items-center gap-1.5 text-accent-300">
          typing <TypingDots className="text-accent-300" />
        </span>
      );
    }

    if (!lastMsg) return <span className="text-fg-subtle">No messages yet</span>;

    const isMe = lastMsg.sender?._id === user._id || lastMsg.sender === user._id;
    const prefix = isMe ? 'You: ' : '';

    if (lastMsg.isDeletedForEveryone) {
      return (
        <span className="flex items-center gap-1 italic text-fg-subtle min-w-0">
          <Ban className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{isMe ? 'You deleted this message' : 'This message was deleted'}</span>
        </span>
      );
    }

    if (lastMsg.messageType === 'image' || lastMsg.messageType === 'video') {
      const MediaIcon = lastMsg.messageType === 'image' ? Image : Video;
      return (
        <span className="flex items-center gap-1 min-w-0">
          {renderStatusIcon()}
          <span className="flex-shrink-0">{prefix}</span>
          <MediaIcon className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{lastMsg.text || (lastMsg.messageType === 'image' ? 'Photo' : 'Video')}</span>
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 min-w-0">
        {renderStatusIcon()}
        <span className="truncate">
          {prefix}
          {lastMsg.text}
        </span>
      </span>
    );
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'true' : undefined}
      className={`group relative w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left transition-colors duration-150 ${
        isActive ? 'bg-white/[0.07]' : 'hover:bg-white/[0.035] active:bg-white/[0.05]'
      }`}
    >
      {/* Active indicator */}
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-accent-400 transition-all duration-200 ${
          isActive ? 'h-6 opacity-100' : 'h-0 opacity-0'
        }`}
      />

      <Avatar
        src={recipient.profilePhoto}
        name={recipient.fullName}
        size="md"
        isOnline={isOnline}
        showStatus={isOnline}
        ringClassName="border-ink-900"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <h4
            className={`text-sm truncate ${
              hasUnread ? 'font-semibold text-fg' : isActive ? 'font-medium text-fg' : 'font-medium text-fg/90'
            }`}
          >
            {recipient.fullName || 'User'}
          </h4>
          {conversation.lastMessageAt && lastMsg && (
            <span
              className={`text-[11px] flex-shrink-0 tabular-nums ${
                hasUnread ? 'text-accent-300 font-medium' : 'text-fg-subtle'
              }`}
            >
              {formatConversationTime(conversation.lastMessageAt)}
            </span>
          )}
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-2">
          <div className={`text-[13px] truncate flex-1 min-w-0 ${hasUnread ? 'text-fg/80' : 'text-fg-subtle'}`}>
            {renderLastMessagePreview()}
          </div>

          {hasUnread && (
            <span
              key={unreadCount}
              className="min-w-[20px] h-5 px-1.5 rounded-full bg-accent-400 text-white text-[11px] font-semibold flex items-center justify-center flex-shrink-0 tabular-nums animate-pop"
              aria-label={`${unreadCount} unread`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default ConversationItem;
