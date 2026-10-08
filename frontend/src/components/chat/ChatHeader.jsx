import React, { useEffect, useRef, useState } from 'react';
import Avatar from '../common/Avatar';
import IconButton from '../common/IconButton';
import Dropdown from '../common/Dropdown';
import Modal from '../common/Modal';
import TypingDots from './TypingDots';
import { useAuth } from '../../hooks/useAuth';
import { useChatContext } from '../../context/ChatContext';
import { formatLastSeen } from '../../utils/formatDate';
import { ArrowLeft, Search, MoreVertical, Info, X, Mail } from 'lucide-react';

const ChatHeader = ({
  conversation,
  onOpenMobileSidebar,
  isSearchOpen,
  onToggleSearch,
  searchQuery,
  onSearchChange,
  matchCount,
}) => {
  const { user } = useAuth();
  const { onlineUserIds, typingState, selectConversation } = useChatContext();
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  if (!conversation) return null;

  const recipient = conversation.participants.find((p) => p._id !== user?._id) || {};
  const isOnline = onlineUserIds.includes(recipient._id);

  const convTyping = typingState[conversation._id] || {};
  const isTyping = Object.keys(convTyping).length > 0;

  const renderStatus = () => {
    if (isTyping) {
      return (
        <span className="flex items-center gap-1.5 text-accent-300">
          typing <TypingDots className="text-accent-300" />
        </span>
      );
    }
    if (isOnline) {
      return (
        <span className="flex items-center gap-1.5 text-fg-muted">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inset-0 rounded-full bg-success animate-soft-ping" />
            <span className="relative w-1.5 h-1.5 rounded-full bg-success" />
          </span>
          Online
        </span>
      );
    }
    return <span className="text-fg-subtle truncate">{formatLastSeen(recipient.lastSeen)}</span>;
  };

  return (
    <>
      <header className="flex-shrink-0 border-b border-line bg-ink-950/80 backdrop-blur-md z-20">
        <div className="h-16 short:h-14 flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
          <IconButton
            icon={ArrowLeft}
            label="Back to chats"
            onClick={onOpenMobileSidebar}
            className="md:hidden"
            tooltipSide="bottom"
            showTooltip={false}
          />

          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="flex items-center gap-3 min-w-0 px-1.5 py-1.5 -my-1 rounded-lg hover:bg-white/[0.04] transition-colors duration-150 text-left"
            aria-label={`View ${recipient.fullName || 'contact'} info`}
          >
            <Avatar
              src={recipient.profilePhoto}
              name={recipient.fullName}
              size="md"
              isOnline={isOnline}
              showStatus={isOnline}
              ringClassName="border-ink-950"
            />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-fg truncate">{recipient.fullName || 'Chat User'}</h2>
              <div className="text-xs mt-0.5">{renderStatus()}</div>
            </div>
          </button>

          <div className="flex-1" />

          <IconButton
            icon={Search}
            label="Search messages"
            onClick={onToggleSearch}
            active={isSearchOpen}
            tooltipSide="bottom"
          />
          <Dropdown
            trigger={(props) => (
              <IconButton icon={MoreVertical} label="More options" tooltipSide="bottom" tooltipAlign="end" showTooltip={!props['aria-expanded']} {...props} />
            )}
            items={[
              { label: 'Contact info', icon: Info, onClick: () => setIsInfoModalOpen(true) },
              { label: 'Search messages', icon: Search, onClick: () => !isSearchOpen && onToggleSearch() },
              { divider: true },
              { label: 'Close chat', icon: X, onClick: () => selectConversation(null) },
            ]}
          />
        </div>

        {/* In-chat search */}
        {isSearchOpen && (
          <div className="px-3 sm:px-4 pb-3 animate-fade-in">
            <div className="relative mx-auto max-w-4xl 3xl:max-w-6xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && onToggleSearch()}
                placeholder="Search in conversation"
                aria-label="Search in conversation"
                className="w-full h-9 touch:h-10 pl-9 pr-28 text-base sm:text-[13px] bg-ink-750 border border-line rounded-lg text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent-300/45 focus:ring-4 focus:ring-accent-400/10 transition-[border-color,box-shadow] duration-150"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery.trim() && (
                  <span className="text-[11px] text-fg-subtle tabular-nums px-1">
                    {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                  </span>
                )}
                <IconButton icon={X} label="Close search" size="sm" onClick={onToggleSearch} showTooltip={false} />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Contact info */}
      <Modal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} title="Contact info" maxWidth="max-w-sm">
        <div className="flex flex-col items-center text-center pt-2">
          <Avatar
            src={recipient.profilePhoto}
            name={recipient.fullName}
            size="xl"
            isOnline={isOnline}
            showStatus={true}
            ringClassName="border-ink-850"
          />
          <h3 className="mt-4 text-lg font-semibold text-fg">{recipient.fullName}</h3>
          <p className="mt-1 text-xs flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-success' : 'bg-fg-subtle'}`} />
            <span className={isOnline ? 'text-fg-muted' : 'text-fg-subtle'}>
              {isOnline ? 'Online' : formatLastSeen(recipient.lastSeen)}
            </span>
          </p>
        </div>
        {recipient.email && (
          <div className="mt-5 flex items-center gap-3 px-3 py-2.5 rounded-lg bg-ink-800 border border-line">
            <Mail className="w-4 h-4 text-fg-subtle flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-fg-subtle">Email</p>
              <p className="text-[13px] text-fg truncate">{recipient.email}</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ChatHeader;
