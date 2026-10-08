import React from 'react';
import { X, SendHorizontal, Image as ImageIcon, Video as VideoIcon, Loader2 } from 'lucide-react';
import IconButton from '../common/IconButton';

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MediaPreview = ({
  file,
  previewUrl,
  caption,
  setCaption,
  onSend,
  onCancel,
  uploadProgress,
  isUploading,
}) => {
  if (!file || !previewUrl) return null;

  const isVideo = file.type.startsWith('video');
  const TypeIcon = isVideo ? VideoIcon : ImageIcon;

  return (
    <div className="rounded-2xl bg-ink-750/90 backdrop-blur-md border border-line shadow-composer p-3 animate-scale-in origin-bottom">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-md bg-white/[0.05] flex items-center justify-center text-fg-muted">
          <TypeIcon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-fg truncate">{file.name}</p>
          <p className="text-[11px] text-fg-subtle">
            {isVideo ? 'Video' : 'Image'} · {formatSize(file.size)}
          </p>
        </div>
        <IconButton icon={X} label="Remove" size="sm" onClick={onCancel} disabled={isUploading} tooltipAlign="end" />
      </div>

      {/* Preview */}
      <div className="relative rounded-xl overflow-hidden bg-black/50 flex items-center justify-center max-h-60 short:max-h-32">
        {isVideo ? (
          <video src={previewUrl} controls className="max-h-60 w-full" />
        ) : (
          <img src={previewUrl} alt="Upload preview" className="max-h-60 object-contain" />
        )}

        {isUploading && (
          <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex justify-between text-[11px] text-white/90 font-medium mb-1.5">
              <span>Uploading…</span>
              <span className="tabular-nums">{uploadProgress}%</span>
            </div>
            <div className="w-full h-1 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-400 transition-[width] duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Caption & send */}
      <div className="flex items-center gap-2 mt-3">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isUploading) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Add a caption…"
          disabled={isUploading}
          autoFocus
          className="flex-1 min-w-0 h-9 touch:h-10 px-3 text-base sm:text-sm bg-ink-850 border border-line rounded-lg text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent-300/45 focus:ring-4 focus:ring-accent-400/10 transition-[border-color,box-shadow] duration-150 disabled:opacity-60"
        />
        <button
          onClick={onSend}
          disabled={isUploading}
          className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-accent-gradient text-on-accent text-[13px] font-semibold shadow-sm shadow-black/30 hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:active:scale-100 transition-all duration-150"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
          <span>{isUploading ? 'Sending' : 'Send'}</span>
        </button>
      </div>
    </div>
  );
};

export default MediaPreview;
