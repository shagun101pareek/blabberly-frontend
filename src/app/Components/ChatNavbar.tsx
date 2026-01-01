'use client';

interface ChatNavbarProps {
  // No props needed - simplified navbar
}

export default function ChatNavbar({}: ChatNavbarProps) {
  return (
    <header className="chat-navbar">
      <div className="chat-navbar-container">
        {/* Brand */}
        <div className="chat-navbar-brand">
          <span className="chat-navbar-logo">Blabberly</span>
        </div>

        {/* Right section */}
        <div className="chat-navbar-right">
          {/* Profile */}
          <button
            type="button"
            className="profile-btn"
            aria-label="Profile"
          >
            SP
          </button>
        </div>
      </div>
    </header>
  );
}
