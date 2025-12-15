'use client';

interface EmptyChatViewProps {
  onFindFriends: () => void;
}

export default function EmptyChatView({ onFindFriends }: EmptyChatViewProps) {
  return (
    <div className="empty-chat-container">
      <div className="empty-chat-card">
        {/* Illustration */}
        <div className="empty-chat-illustration">
          <div className="empty-chat-illustration-bg"></div>
          <div className="empty-chat-illustration-circles">
            <div className="empty-chat-circle empty-chat-circle-1"></div>
            <div className="empty-chat-circle empty-chat-circle-2"></div>
            <div className="empty-chat-circle empty-chat-circle-3"></div>
          </div>
          <div className="empty-chat-illustration-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M23 21V19C22.9986 17.177 21.765 15.5857 20 15.13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M16 3.13C17.7699 3.58317 19.0078 5.17799 19.0078 7.005C19.0078 8.83201 17.7699 10.4268 16 10.88" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          {/* Floating chat bubbles */}
          <div className="empty-chat-bubble empty-chat-bubble-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7117 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92176 4.44061 8.37485 5.27072 7.03255C6.10083 5.69025 7.28825 4.60557 8.7 3.9C9.87812 3.30493 11.1801 2.99656 12.5 3H13C15.0843 3.11499 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91565 21 11V11.5Z" fill="currentColor" opacity="0.3"/>
            </svg>
          </div>
          <div className="empty-chat-bubble empty-chat-bubble-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7117 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92176 4.44061 8.37485 5.27072 7.03255C6.10083 5.69025 7.28825 4.60557 8.7 3.9C9.87812 3.30493 11.1801 2.99656 12.5 3H13C15.0843 3.11499 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91565 21 11V11.5Z" fill="currentColor" opacity="0.3"/>
            </svg>
          </div>
          <div className="empty-chat-bubble empty-chat-bubble-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7117 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92176 4.44061 8.37485 5.27072 7.03255C6.10083 5.69025 7.28825 4.60557 8.7 3.9C9.87812 3.30493 11.1801 2.99656 12.5 3H13C15.0843 3.11499 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91565 21 11V11.5Z" fill="currentColor" opacity="0.3"/>
            </svg>
          </div>
        </div>

        {/* Content */}
        <h2 className="empty-chat-title">Add friends to Blabber!</h2>
        <p className="empty-chat-subtitle">
          Start connecting with people to begin chatting.
        </p>

        {/* CTA Button */}
        <button className="empty-chat-cta" onClick={onFindFriends}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Find Friends
        </button>

        {/* Decorative elements */}
        <div className="empty-chat-sparkle empty-chat-sparkle-1">✨</div>
        <div className="empty-chat-sparkle empty-chat-sparkle-2">✨</div>
      </div>
    </div>
  );
}


