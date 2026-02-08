'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';

export default function Navbar() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
                  width={48} 
                  height={48} 
                  className="navbar-logo-image"
                  priority
                  unoptimized
                />
                <span className="navbar-logo">Blabberly</span>
              </Link>
            </div>

            {/* Desktop menu & buttons */}
            <div className="navbar-menu navbar-menu-desktop">
              <span className="navbar-menu-item">Features</span>
              <span className="navbar-menu-item">About Us</span>
              <span className="navbar-menu-item">Help Center</span>
              <span className="navbar-menu-item">Privacy</span>
            </div>
            <div className="navbar-buttons navbar-buttons-desktop">
              <button
                className="navbar-login-button"
                onClick={() => setIsLoginModalOpen(true)}
              >
                Login
              </button>
              <button
                className="navbar-signup-button"
                onClick={() => setIsSignupModalOpen(true)}
              >
                Get Started
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="navbar-hamburger"
              onClick={() => setIsMobileMenuOpen((o) => !o)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              <span className="navbar-hamburger-line" />
              <span className="navbar-hamburger-line" />
              <span className="navbar-hamburger-line" />
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        <div
          className={`navbar-mobile-menu ${isMobileMenuOpen ? 'navbar-mobile-menu-open' : ''}`}
          aria-hidden={!isMobileMenuOpen}
        >
          <div className="navbar-mobile-menu-backdrop" onClick={closeMobileMenu} />
          <div className="navbar-mobile-menu-panel">
            <div className="navbar-mobile-menu-items">
              <span className="navbar-mobile-menu-item">Features</span>
              <span className="navbar-mobile-menu-item">About Us</span>
              <span className="navbar-mobile-menu-item">Help Center</span>
              <span className="navbar-mobile-menu-item">Privacy</span>
            </div>
            <div className="navbar-mobile-menu-buttons">
              <button
                className="navbar-login-button"
                onClick={() => { closeMobileMenu(); setIsLoginModalOpen(true); }}
              >
                Login
              </button>
              <button
                className="navbar-signup-button"
                onClick={() => { closeMobileMenu(); setIsSignupModalOpen(true); }}
              >
                Get Started
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
        onSwitchToLogin={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </>
  );
}