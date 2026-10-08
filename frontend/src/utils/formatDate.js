export const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatLastSeen = (dateString) => {
  if (!dateString) return 'Offline';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `Last seen ${mins} ${mins === 1 ? 'min' : 'mins'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Last seen ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    return `Last seen ${date.toLocaleDateString()}`;
  }
};

export const formatConversationTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (isYesterday) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Days between the given date and today (0 = today, 1 = yesterday, ...)
export const daysAgo = (dateString) => {
  if (!dateString) return Infinity;
  const diff = startOfDay(new Date()) - startOfDay(new Date(dateString));
  return Math.round(diff / 86400000);
};

// Label for a day separator in the message list
export const formatDayLabel = (dateString) => {
  const days = daysAgo(dateString);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  const date = new Date(dateString);
  if (days < 7) return date.toLocaleDateString([], { weekday: 'long' });
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString([], { month: 'long', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
};

// Bucket used to group conversations in the sidebar
export const conversationBucket = (dateString) => {
  const days = daysAgo(dateString);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return 'This week';
  return 'Earlier';
};

export const isSameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
