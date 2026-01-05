/**
 * Time formatting utility for last seen timestamps
 * Converts ISO date strings or Date objects into human-readable relative time
 */

/**
 * Format last seen time into human-readable relative time
 * 
 * @param lastSeen - ISO date string or Date object, or null
 * @returns Formatted string:
 *   - "Just now" (< 1 min)
 *   - "Xm ago" (< 1 hour)
 *   - "Xh ago" (< 24 hours)
 *   - "Yesterday"
 *   - "Xd ago" (days ago)
 *   - "" (empty string if lastSeen is null)
 */
export function formatLastSeen(lastSeen: string | Date | null | undefined): string {
  if (!lastSeen) {
    return '';
  }

  const now = new Date();
  const lastSeenDate = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
  
  // Validate date
  if (isNaN(lastSeenDate.getTime())) {
    return '';
  }

  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Less than 1 minute
  if (diffSeconds < 60) {
    return 'Just now';
  }

  // Less than 1 hour
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  // Less than 24 hours
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  // Check if yesterday (within last 48 hours and same day as yesterday)
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = 
    lastSeenDate.getDate() === yesterday.getDate() &&
    lastSeenDate.getMonth() === yesterday.getMonth() &&
    lastSeenDate.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return 'Yesterday';
  }

  // Days ago
  return `${diffDays}d ago`;
}

