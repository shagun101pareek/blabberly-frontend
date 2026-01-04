'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';
import { getUserProfileImage } from '../types/user';

interface ChatNavbarProps {
  // No props needed - simplified navbar
}

export default function ChatNavbar({}: ChatNavbarProps) {
  const router = useRouter();
  const { user } = useUser();
  const profileImageUrl = getUserProfileImage(user);
  const initials = user?.username?.charAt(0).toUpperCase() || 'U';

  const handleProfileClick = () => {
    router.push('/profile');
  };

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
            onClick={handleProfileClick}
          >
            <img
              src={profileImageUrl}
              alt="Profile"
              className="profile-btn-image"
              onError={(e) => {
                // Fallback to initials if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('span')) {
                  const span = document.createElement('span');
                  span.textContent = initials;
                  parent.appendChild(span);
                }
              }}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
