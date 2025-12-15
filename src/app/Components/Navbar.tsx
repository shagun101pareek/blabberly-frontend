'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';

export default function Navbar() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  return (
    <>
      <nav className="navbar-container">
        <div className="navbar-wrapper">
          <div className="navbar-content">
            {/* Logo */}
            <div className="navbar-logo-wrapper">
              <Link href="/" className="navbar-logo-link">
                <Image 
                  src="/Images/Blabberly_logo.png" 
                  alt="Blabberly Logo" 
                  width={64} 
                  height={64} 
                  style={{ borderRadius: '15px' }}
                  className="navbar-logo-image"
                />
                <span className="navbar-logo">Blabberly</span>
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="navbar-buttons">
              {/* Login Button */}
              <button 
                className="navbar-login-button"
                onClick={() => setIsLoginModalOpen(true)}
              >
                Login
              </button>

              {/* Sign Up Button */}
              <button 
                className="navbar-signup-button"
                onClick={() => setIsSignupModalOpen(true)}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Modals */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
      <SignupModal 
        isOpen={isSignupModalOpen} 
        onClose={() => setIsSignupModalOpen(false)} 
      />
    </>
  );
}