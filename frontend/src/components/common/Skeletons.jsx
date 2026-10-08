import React from 'react';

export const ConversationSkeleton = ({ count = 6 }) => (
  <div className="space-y-1 px-2" aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-2.5 py-2.5">
        <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="skeleton h-3 rounded" style={{ width: `${45 + ((i * 17) % 30)}%` }} />
            <div className="skeleton h-2.5 w-8 rounded" />
          </div>
          <div className="skeleton h-2.5 rounded" style={{ width: `${55 + ((i * 23) % 35)}%` }} />
        </div>
      </div>
    ))}
  </div>
);

const MESSAGE_SHAPES = [
  { out: false, w: 'w-48' },
  { out: false, w: 'w-64' },
  { out: true, w: 'w-40' },
  { out: false, w: 'w-56' },
  { out: true, w: 'w-72' },
  { out: true, w: 'w-32' },
  { out: false, w: 'w-44' },
];

export const MessageSkeleton = () => (
  <div className="mx-auto w-full max-w-4xl 3xl:max-w-6xl px-3 sm:px-6 py-6 space-y-3" aria-hidden="true">
    {MESSAGE_SHAPES.map((s, i) => (
      <div key={i} className={`flex items-end gap-2 ${s.out ? 'justify-end' : 'justify-start'}`}>
        {!s.out && <div className="skeleton w-7 h-7 rounded-full flex-shrink-0" />}
        <div className={`skeleton h-10 rounded-bubble max-w-[70%] ${s.w}`} />
      </div>
    ))}
  </div>
);

export const AppShellSkeleton = () => (
  <div className="app-screen w-full flex bg-ink-950 overflow-hidden" aria-busy="true" aria-label="Loading">
    <div className="hidden md:flex flex-col w-[300px] lg:w-[320px] 2xl:w-[360px] border-r border-line bg-ink-900">
      <div className="h-16 short:h-14 px-4 flex items-center gap-3 border-b border-line">
        <div className="skeleton w-8 h-8 rounded-lg" />
        <div className="skeleton h-3.5 w-24 rounded" />
      </div>
      <div className="p-3">
        <div className="skeleton h-9 w-full rounded-lg" />
      </div>
      <ConversationSkeleton count={7} />
    </div>
    <div className="flex-1 flex flex-col">
      <div className="h-16 short:h-14 px-5 flex items-center gap-3 border-b border-line">
        <div className="skeleton w-9 h-9 rounded-full" />
        <div className="space-y-2">
          <div className="skeleton h-3 w-28 rounded" />
          <div className="skeleton h-2.5 w-16 rounded" />
        </div>
      </div>
      <div className="flex-1">
        <MessageSkeleton />
      </div>
    </div>
  </div>
);
