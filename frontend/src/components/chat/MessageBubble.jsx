import React, { useEffect, useRef, useState } from 'react';
import { formatTime } from '../../utils/formatDate';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Avatar from '../common/Avatar';
import IconButton from '../common/IconButton';
import { Trash2, Pencil, Check, CheckCheck, Ban, Copy } from 'lucide-react';
import { useChatContext } from '../../context/ChatContext';
import { useToast } from '../../context/ToastContext';

// Wrap case-insensitive matches of `query` in <mark>
const highlightText = (text, query) => {
  if (!query) return text;
  const lower = text.toLowerCase();
  const parts = [];
  let i = 0;
  let idx = lower.indexOf(query, i);
  while (idx !== -1) {
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark key={idx} className="search-hit">
        {text.slice(idx, idx + query.length)}
      </mark>
    );
    i = idx + query.length;
    idx = lower.indexOf(query, i);
  }
  parts.push(text.slice(i));
  return parts;
};

const MessageBubble = ({ message, isOutgoing, isFirst = true, isLast = true, highlight = '' }) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [actionsOpen, setActionsOpen] = useState(false);
  const rowRef = useRef(null);

  const { deleteMessage, setEditingMessage } = useChatContext();
  const toast = useToast();

  // Touch devices have no hover: tap a message to show its actions, tap elsewhere to hide them
  useEffect(() => {
    if (!actionsOpen) return;
    const close = (e) => {
      if (!rowRef.current?.contains(e.target)) setActionsOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [actionsOpen]);

  const handleBubbleTap = (e) => {
    if (!window.matchMedia?.('(hover: none)').matches) return;
    if (e.target.closest('button, video, a')) return;
    setActionsOpen((open) => !open);
  };

  const runAction = (fn) => () => {
    setActionsOpen(false);
    fn();
  };

  const isDeleted = message.isDeletedForEveryone;
  const isMedia = !isDeleted && (message.messageType === 'image' || message.messageType === 'video') && message.mediaUrl;
  const canDeleteForEveryone = isOutgoing && !isDeleted;
  const sender = message.sender || {};

  const renderStatus = () => {
    if (!isOutgoing || isDeleted) return null;

    if (message.status === 'seen') {
      return <CheckCheck className="w-3.5 h-3.5 text-on-accent-seen stroke-[2.5]" aria-label="Seen" />;
    }
    if (message.status === 'delivered') {
      return <CheckCheck className="w-3.5 h-3.5" aria-label="Delivered" />;
    }
    return <Check className="w-3.5 h-3.5" aria-label="Sent" />;
  };

  const handleDelete = async (scope) => {
    setIsDeleting(true);
    setIsConfirmDeleteOpen(false);
    try {
      await deleteMessage(message._id, scope);
      // Bubble stays mounted (as a placeholder) after deleting for everyone
      setIsDeleting(false);
    } catch (err) {
      console.error('Failed to delete message:', err);
      setIsDeleting(false);
      toast.error('Could not delete the message.', {
        action: { label: 'Retry', onClick: () => handleDelete(scope) },
      });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      toast.success('Copied to clipboard', { duration: 1800 });
    } catch {
      toast.error('Could not copy message');
    }
  };

  // Tighten the corners where bubbles in the same group touch
  const corners = isOutgoing
    ? `${!isFirst ? 'rounded-tr-md' : ''} ${!isLast ? 'rounded-br-md' : ''}`
    : `${!isFirst ? 'rounded-tl-md' : ''} ${!isLast ? 'rounded-bl-md' : ''}`;

  const meta = (overlay = false) => (
    <span
      className={`inline-flex items-center gap-1 text-[11px] leading-none tabular-nums select-none whitespace-nowrap ${
        overlay
          ? 'px-1.5 py-1 rounded-md bg-black/45 text-white/90 backdrop-blur-sm'
          : isOutgoing
          ? 'text-on-accent-muted'
          : 'text-fg-subtle'
      }`}
    >
      {message.isEdited && !isDeleted && <span className="italic">edited</span>}
      <span>{formatTime(message.createdAt)}</span>
      {renderStatus()}
    </span>
  );

  // Floated so the timestamp sits on the last line when there's room (WhatsApp-style)
  const inlineMeta = <span className="float-right ml-3 mt-[5px] -mb-1 relative top-[3px]">{meta()}</span>;

  const hasActions = !isDeleting;

  return (
    <>
      <div
        ref={rowRef}
        className={`group flex items-start gap-2 ${isOutgoing ? 'justify-end' : 'justify-start'} ${
          isFirst ? 'mt-3' : 'mt-0.5'
        } animate-slide-up`}
      >
        {/* Avatar column for incoming messages (shown once per group) */}
        {!isOutgoing && (
          <div className="w-8 flex-shrink-0 hidden sm:block">
            {isFirst && <Avatar src={sender.profilePhoto} name={sender.fullName} size="sm" className="mt-5" />}
          </div>
        )}

        <div className={`flex flex-col min-w-0 max-w-[85%] sm:max-w-[70%] ${isOutgoing ? 'items-end' : 'items-start'}`}>
          {isFirst && !isOutgoing && (
            <span className="mb-1 px-1 text-xs font-medium text-fg-muted truncate max-w-full">{sender.fullName}</span>
          )}

          <div className="relative max-w-full" onClick={handleBubbleTap}>
            {/* Bubble */}
            <div
              className={`relative rounded-bubble ${corners} transition-[opacity,transform] duration-200 ${
                isMedia ? 'p-1' : 'px-3 py-2'
              } ${
                isOutgoing
                  ? isDeleted
                    ? 'bg-ink-800 border border-line text-fg-muted'
                    : 'on-accent-surface bg-accent-gradient text-on-accent'
                  : 'bg-ink-800 border border-line text-fg'
              } ${isDeleting ? 'opacity-40 scale-[0.98]' : ''} ${actionsOpen ? 'ring-2 ring-accent-400/40' : ''}`}
            >
              {/* Deleted for everyone placeholder */}
              {isDeleted && (
                <p className="flow-root text-sm italic text-fg-subtle">
                  <span className="inline-flex items-center gap-1.5 align-middle">
                    <Ban className="w-3.5 h-3.5 flex-shrink-0" />
                    {isOutgoing ? 'You deleted this message' : 'This message was deleted'}
                  </span>
                  {inlineMeta}
                </p>
              )}

              {/* Image */}
              {isMedia && message.messageType === 'image' && (
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(true)}
                  className="relative block overflow-hidden rounded-[10px] bg-black/40"
                  aria-label="Open image"
                >
                  <img
                    src={message.mediaUrl}
                    alt="Shared attachment"
                    loading="lazy"
                    className="block max-h-72 short:max-h-44 w-full max-w-[320px] object-cover transition-transform duration-300 hover:scale-[1.02]"
                  />
                  {!message.text && <span className="absolute bottom-1.5 right-1.5">{meta(true)}</span>}
                </button>
              )}

              {/* Video */}
              {isMedia && message.messageType === 'video' && (
                <div className="relative overflow-hidden rounded-[10px] bg-black">
                  <video
                    src={message.mediaUrl}
                    controls
                    className="block max-h-72 short:max-h-44 w-full max-w-[320px]"
                    preload="metadata"
                  />
                </div>
              )}

              {/* Text / caption */}
              {!isDeleted && message.text && (
                <p
                  className={`flow-root text-sm leading-[1.45] whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${
                    isMedia ? 'px-2 pt-1.5 pb-1' : ''
                  }`}
                >
                  {highlightText(message.text, highlight)}
                  {inlineMeta}
                </p>
              )}

              {isMedia && message.messageType === 'video' && !message.text && (
                <div className="flex justify-end px-1.5 pt-1 pb-0.5">{meta()}</div>
              )}
            </div>

            {/* Hover actions */}
            {hasActions && (
              <div
                className={`absolute z-10 bottom-full mb-1 sm:mb-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 ${
                  isOutgoing ? 'right-0 sm:right-full sm:mr-1.5' : 'left-0 sm:left-full sm:ml-1.5'
                } flex items-center gap-0.5 p-0.5 rounded-lg bg-ink-850 border border-line shadow-panel ${
                  actionsOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                } group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:scale-100 group-focus-within:pointer-events-auto transition-all duration-150 ${
                  isOutgoing ? 'flex-row-reverse' : ''
                }`}
              >
                {!isDeleted && message.text && (
                  <IconButton icon={Copy} label="Copy" size="sm" onClick={runAction(handleCopy)} />
                )}
                {isOutgoing && !isDeleted && message.messageType === 'text' && (
                  <IconButton icon={Pencil} label="Edit" size="sm" onClick={runAction(() => setEditingMessage(message))} />
                )}
                <IconButton
                  icon={Trash2}
                  label="Delete"
                  size="sm"
                  variant="danger"
                  onClick={runAction(() => setIsConfirmDeleteOpen(true))}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete options (WhatsApp style) */}
      <Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        title="Delete message?"
        description={
          canDeleteForEveryone
            ? 'You can delete this message for everyone or just for yourself.'
            : 'This message will be removed from your view only.'
        }
        maxWidth="max-w-sm"
      >
        {!isDeleted && message.text && (
          <div className="mb-4 px-3 py-2.5 rounded-lg bg-ink-800 border border-line text-[13px] text-fg-muted line-clamp-3 break-words">
            {message.text}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {canDeleteForEveryone && (
            <Button type="button" variant="danger" onClick={() => handleDelete('everyone')} className="w-full">
              Delete for everyone
            </Button>
          )}
          <Button
            type="button"
            variant={canDeleteForEveryone ? 'danger-soft' : 'danger'}
            onClick={() => handleDelete('me')}
            className="w-full"
          >
            Delete for me
          </Button>
          <Button type="button" variant="ghost" onClick={() => setIsConfirmDeleteOpen(false)} className="w-full">
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Image lightbox */}
      {isMedia && message.messageType === 'image' && (
        <Modal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          title={sender.fullName ? `Photo from ${sender.fullName}` : 'Photo'}
          maxWidth="max-w-4xl"
          bodyClassName="p-3 pt-2"
          placement="center"
        >
          <div className="flex items-center justify-center">
            <img
              src={message.mediaUrl}
              alt="Full attachment view"
              className="max-h-[70vh] max-h-[70dvh] max-w-full rounded-lg object-contain"
            />
          </div>
        </Modal>
      )}
    </>
  );
};

export default MessageBubble;
