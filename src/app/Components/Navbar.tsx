'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="navbar-container">
      <div className="navbar-wrapper">
        <div className="navbar-content">
          {/* Logo */}
          <div className="navbar-logo-wrapper">
            <Link href="/" className="navbar-logo">
              Blabberly
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="navbar-buttons">
            {/* Login Button */}
            <button className="navbar-login-button">
              Login
            </button>

            {/* Sign Up Button */}
            <button className="navbar-signup-button">
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}