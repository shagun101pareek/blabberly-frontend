'use client';

import { useUserStatus } from '@/hooks/useUserStatus';
import { formatLastSeen } from '@/app/utils/timeFormat';

interface UserStatusProps {
  userId: string | null | undefined;
  /**
   * Display variant
   * - 'inline': Shows status inline (e.g., "Online" or "Last seen 5m ago")
   * - 'dot': Shows only the status dot indicator
   * - 'full': Shows dot + text (default)
   */
  variant?: 'inline' | 'dot' | 'full';
  /**
   * Custom className for the container
   */
  className?: string;
  /**
   * Custom className for the status text
   */
  textClassName?: string;
}

/**
 * UserStatus component displays user online status and last seen time
 * 
 * Displays:
 * - Green dot + "Online" if user is online
 * - Gray dot + "Last seen {time}" if user is offline with lastSeen
 * - "Offline" if lastSeen is null
 */
export default function UserStatus({
  userId,
  variant = 'full',
  className = '',
  textClassName = '',
}: UserStatusProps) {
  const { isOnline, lastSeen, isLoading } = useUserStatus(userId);

  if (isLoading) {
    return (
      <span className={className} aria-label="Loading status">
        <span className="user-status-dot user-status-dot-loading" />
        {variant !== 'dot' && (
          <span className={textClassName}>Loading...</span>
        )}
      </span>
    );
  }

  const formattedLastSeen = formatLastSeen(lastSeen);

  // Online state
  if (isOnline) {
    return (
      <span className={`${className} user-status-online`} aria-label="Online">
        {variant !== 'inline' && (
          <span
            className="user-status-dot user-status-dot-online"
            aria-hidden="true"
          />
        )}
        {variant !== 'dot' && (
          <span className={`${textClassName} user-status-text-online`}>Online</span>
        )}
      </span>
    );
  }

  // Offline with last seen
  if (lastSeen && formattedLastSeen) {
    return (
      <span className={`${className} user-status-offline`} aria-label={`Last seen ${formattedLastSeen}`}>
        {variant !== 'inline' && variant !== 'dot' && (
          <span
            className="user-status-dot user-status-dot-offline"
            aria-hidden="true"
          />
        )}
        {variant !== 'dot' && (
          <span className={`${textClassName} user-status-text-offline`}>
            Last seen {formattedLastSeen}
          </span>
        )}
      </span>
    );
  }

  // Offline without last seen
  return (
    <span className={`${className} user-status-offline`} aria-label="Offline">
      {variant !== 'inline' && variant !== 'dot' && (
        <span
          className="user-status-dot user-status-dot-offline"
          aria-hidden="true"
        />
      )}
      {variant !== 'dot' && (
        <span className={`${textClassName} user-status-text-offline`}>Offline</span>
      )}
    </span>
  );
}

