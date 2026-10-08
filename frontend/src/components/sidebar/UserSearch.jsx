import React, { useEffect, useRef, useState } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { useChatContext } from '../../context/ChatContext';
import { useToast } from '../../context/ToastContext';
import Avatar from '../common/Avatar';

// Find people by name/email and open a conversation with them
const UserSearch = ({ onSelected }) => {
  const [query, setQuery] = useState('');
  const [startingId, setStartingId] = useState(null);
  const inputRef = useRef(null);
  const toast = useToast();
  const { searchUsers, searchResults, isSearching, startConversationWithUser, onlineUserIds } =
    useChatContext();

  useEffect(() => {
    inputRef.current?.focus();
    // Clear results when the search panel goes away
    return () => searchUsers('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    searchUsers(val);
  };

  const handleClear = () => {
    setQuery('');
    searchUsers('');
    inputRef.current?.focus();
  };

  const handleSelectUser = async (targetUser) => {
    setStartingId(targetUser._id);
    try {
      await startConversationWithUser(targetUser);
      setQuery('');
      searchUsers('');
      onSelected?.();
    } catch (err) {
      console.error('Failed to start conversation:', err);
      toast.error('Could not start the conversation. Please try again.', {
        action: { label: 'Retry', onClick: () => handleSelectUser(targetUser) },
      });
    } finally {
      setStartingId(null);
    }
  };

  const hasQuery = query.trim().length > 0;

  return (
    <div>
      <div className="relative group px-5">
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle group-focus-within:text-accent-400 transition-colors pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search by name or email"
          aria-label="Search people"
          className="w-full h-11 pl-10 pr-10 text-base sm:text-sm bg-ink-750 border border-line rounded-lg text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent-300/45 focus:ring-4 focus:ring-accent-400/10 transition-[border-color,box-shadow] duration-150"
        />
        {query && (
          <button
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1 rounded text-fg-subtle hover:text-fg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mt-3 h-[min(360px,50vh)] short:h-[40vh] overflow-y-auto px-3 pb-3">
        {!hasQuery ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 text-fg-subtle">
            <Search className="w-5 h-5 mb-2" />
            <p className="text-[13px]">Type a name or email to find people.</p>
          </div>
        ) : isSearching && searchResults.length === 0 ? (
          <div className="space-y-1 px-2 pt-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="skeleton w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-2.5 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : searchResults.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center px-6">
            <p className="text-[13px] text-fg-muted">No people found for “{query}”</p>
          </div>
        ) : (
          <ul className="space-y-px">
            {searchResults.map((usr) => {
              const isOnline = onlineUserIds.includes(usr._id);
              const isStarting = startingId === usr._id;
              return (
                <li key={usr._id}>
                  <button
                    type="button"
                    onClick={() => handleSelectUser(usr)}
                    disabled={!!startingId}
                    className="group/row w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left hover:bg-white/[0.05] transition-colors duration-150 disabled:opacity-60 animate-fade-in"
                  >
                    <Avatar
                      src={usr.profilePhoto}
                      name={usr.fullName}
                      size="sm"
                      isOnline={isOnline}
                      showStatus={isOnline}
                      ringClassName="border-ink-850"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-fg truncate">{usr.fullName}</p>
                      <p className="text-xs text-fg-subtle truncate">{usr.email}</p>
                    </div>
                    {isStarting ? (
                      <span className="w-4 h-4 rounded-full border-2 border-white/10 border-t-accent-400 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-fg-subtle opacity-0 -translate-x-1 group-hover/row:opacity-100 group-hover/row:translate-x-0 transition-all duration-150" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UserSearch;
