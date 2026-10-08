import React, { useState, useEffect, useRef } from 'react';
import { Smile, Heart, ThumbsUp, Sparkles, X } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys & Expressions',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
      '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
      '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨',
      '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢',
      '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸',
    ],
  },
  {
    id: 'hands',
    name: 'Gestures & Reactions',
    icon: ThumbsUp,
    emojis: [
      '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙',
      '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '✊', '👊', '🤛',
      '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳',
      '💪', '🦾', '🖐️', '✋', '👋', '👋', '👀', '👁️', '🧠', '🫀',
    ],
  },
  {
    id: 'hearts',
    name: 'Hearts & Love',
    icon: Heart,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌',
      '💋', '🔥', '✨', '🌟', '⭐', '💥', '💯', '💢', '🎉', '🎊',
    ],
  },
  {
    id: 'symbols',
    name: 'Symbols & Fun',
    icon: Sparkles,
    emojis: [
      '⚡', '☀️', '🌙', '☁️', '🌧️', '❄️', '🌈', '☕', '🍺', '🍻',
      '🍕', '🍔', '🍟', '🍿', '🍩', '🎂', '🎈', '🎁', '🏆', '🎯',
      '🚀', '🛸', '🎵', '🎶', '🎤', '🎧', '🎮', '💡', '🔔', '📌',
    ],
  },
];

const EmojiPicker = ({ onSelectEmoji, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('smileys');
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const currentCategoryObj = EMOJI_CATEGORIES.find((cat) => cat.id === activeCategory);

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full right-0 mb-2 z-40 w-[min(320px,calc(100vw-1.5rem))] rounded-xl bg-ink-800 border border-line shadow-pop overflow-hidden animate-scale-in origin-bottom-right"
    >
      {/* Category tabs */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-line">
        <div className="flex items-center gap-0.5">
          {EMOJI_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                aria-label={cat.name}
                aria-pressed={isActive}
                className={`p-1.5 rounded-md transition-colors duration-150 ${
                  isActive ? 'bg-white/[0.08] text-fg' : 'text-fg-subtle hover:text-fg hover:bg-white/[0.05]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close emoji picker"
          className="p-1.5 rounded-md text-fg-subtle hover:text-fg hover:bg-white/[0.05] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Emoji grid */}
      <div className="p-2 max-h-56 short:max-h-32 overflow-y-auto">
        <p className="px-1 pb-1.5 text-[11px] font-medium text-fg-subtle">{currentCategoryObj?.name}</p>
        <div className="grid grid-cols-8 gap-0.5">
          {currentCategoryObj?.emojis.map((emoji, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSelectEmoji(emoji)}
              className="aspect-square flex items-center justify-center text-xl rounded-md hover:bg-white/[0.07] active:scale-90 transition-[background-color,transform] duration-100"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;
