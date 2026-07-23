/**
 * Returns Tailwind CSS classes for the given resume status badge.
 */
export function statusColor(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'ACTIVE':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'ARCHIVED':
      return 'text-gray-500 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-500 bg-gray-50 border-gray-200';
  }
}

/**
 * Returns a human-readable relative time string (e.g. "3h ago", "2d ago").
 */
export function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
