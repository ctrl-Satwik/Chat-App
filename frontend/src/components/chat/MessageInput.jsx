import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { Plus, SendHorizontal, Smile, Pencil, X } from 'lucide-react';
import { useChatContext } from '../../context/ChatContext';
import { useToast } from '../../context/ToastContext';
import MediaPreview from './MediaPreview';
import EmojiPicker from './EmojiPicker';
import IconButton from '../common/IconButton';

const MAX_TEXTAREA_HEIGHT = 160;

const MessageInput = () => {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const {
    activeConversation,
    sendMessageText,
    sendMediaMessage,
    emitTyping,
    editingMessage,
    setEditingMessage,
    editMessage
  } = useChatContext();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || '');
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [editingMessage]);

  // Focus the composer when switching conversations (desktop only, avoids popping the mobile keyboard)
  useEffect(() => {
    if (window.matchMedia?.('(hover: hover)').matches) textareaRef.current?.focus();
  }, [activeConversation?._id]);

  // Auto-grow textarea
  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    ta.style.overflowY = ta.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
  }, [text, selectedFile]);

  const handleTextChange = (e) => {
    setText(e.target.value);

    // Emit typing indicator
    emitTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
    }, 1500);
  };

  const handleSelectEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    emitTyping(true);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setMediaPreviewUrl(URL.createObjectURL(file));
      setShowEmojiPicker(false);
    }
  };

  const handleCancelMedia = () => {
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setSelectedFile(null);
    setMediaPreviewUrl(null);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setText('');
  };

  const handleSendText = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    emitTyping(false);
    setShowEmojiPicker(false);

    if (editingMessage) {
      if (text.trim() !== editingMessage.text) {
        try {
          await editMessage(editingMessage._id, text.trim());
        } catch {
          toast.error('Could not save your edit. Please try again.');
          return;
        }
      }
      setEditingMessage(null);
    } else {
      sendMessageText(text);
    }
    setText('');
  };

  const handleSendMedia = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      await sendMediaMessage(selectedFile, text, (percent) => {
        setUploadProgress(percent);
      });
      handleCancelMedia();
      setText('');
    } catch (err) {
      console.error('Media upload failed:', err);
      toast.error('Upload failed. Check the file size and try again.', {
        duration: 5000,
        action: { label: 'Retry', onClick: () => handleSendMedia() },
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && editingMessage) {
      e.preventDefault();
      cancelEdit();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (selectedFile) {
        handleSendMedia();
      } else {
        handleSendText(e);
      }
    }
  };

  const canSend = text.trim().length > 0;

  return (
    <div className="flex-shrink-0 px-3 sm:px-6 pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-5 short:pb-2">
      <div className="relative mx-auto max-w-4xl 3xl:max-w-6xl">
        {/* Emoji Picker Popover */}
        {showEmojiPicker && !selectedFile && (
          <EmojiPicker
            onSelectEmoji={handleSelectEmoji}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,video/*"
          className="hidden"
        />

        {/* Media preview replaces the composer while a file is selected */}
        {selectedFile && mediaPreviewUrl ? (
          <MediaPreview
            file={selectedFile}
            previewUrl={mediaPreviewUrl}
            caption={text}
            setCaption={setText}
            onSend={handleSendMedia}
            onCancel={handleCancelMedia}
            uploadProgress={uploadProgress}
            isUploading={isUploading}
          />
        ) : (
          <form
            onSubmit={handleSendText}
            className="rounded-2xl bg-ink-750/90 backdrop-blur-md border border-line shadow-composer transition-[border-color,box-shadow] duration-200 focus-within:border-accent-300/35 focus-within:ring-4 focus-within:ring-accent-400/[0.08]"
          >
            {/* Editing banner */}
            {editingMessage && (
              <div className="flex items-center gap-2.5 mx-2 mt-2 pl-3 pr-1 py-1.5 rounded-lg bg-accent-500/10 border-l-2 border-accent-400 animate-fade-in">
                <Pencil className="w-3.5 h-3.5 text-accent-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-accent-300">Editing message</p>
                  <p className="text-xs text-fg-muted truncate">{editingMessage.text}</p>
                </div>
                <IconButton icon={X} label="Cancel edit" size="sm" onClick={cancelEdit} tooltipAlign="end" />
              </div>
            )}

            <div className="flex items-end gap-1 p-1.5">
              {!editingMessage && (
                <IconButton
                  icon={Plus}
                  label="Attach photo or video"
                  onClick={() => {
                    setShowEmojiPicker(false);
                    fileInputRef.current?.click();
                  }}
                  tooltipSide="top"
                />
              )}

              <textarea
                ref={textareaRef}
                rows={1}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowEmojiPicker(false)}
                placeholder={editingMessage ? 'Edit your message…' : 'Type a message…'}
                aria-label="Message"
                className={`flex-1 min-w-0 bg-transparent resize-none py-2 text-base leading-6 sm:text-sm sm:leading-5 text-fg placeholder:text-fg-subtle focus:outline-none focus-visible:outline-none ${
                  editingMessage ? 'pl-2.5' : 'pl-1'
                }`}
                style={{ maxHeight: MAX_TEXTAREA_HEIGHT }}
              />

              <IconButton
                icon={Smile}
                label="Emoji"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                active={showEmojiPicker}
              />

              <button
                type="submit"
                disabled={!canSend}
                aria-label={editingMessage ? 'Save edit' : 'Send message'}
                data-tooltip={canSend ? (editingMessage ? 'Save' : 'Send') : undefined}
                data-tooltip-align="end"
                className={`w-9 h-9 flex-shrink-0 inline-flex items-center justify-center rounded-xl transition-all duration-200 ${
                  canSend
                    ? 'bg-accent-gradient text-on-accent shadow-sm shadow-black/30 hover:brightness-110 active:scale-95'
                    : 'bg-white/[0.04] text-fg-subtle cursor-not-allowed'
                }`}
              >
                <SendHorizontal className={`w-[18px] h-[18px] transition-transform duration-200 ${canSend ? 'translate-x-px' : ''}`} />
              </button>
            </div>
          </form>
        )}

        <p className="hidden md:block short:hidden touch:hidden mt-1.5 text-center text-[11px] text-fg-subtle select-none">
          <kbd className="font-sans font-medium text-fg-muted">Enter</kbd> to send ·{' '}
          <kbd className="font-sans font-medium text-fg-muted">Shift + Enter</kbd> for a new line
        </p>
      </div>
    </div>
  );
};

export default MessageInput;
