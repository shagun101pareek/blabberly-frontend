'use client';

import { useState } from 'react';
import Image from 'next/image';
import SignupModal from './SignupModal';

export default function MainContent() {
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

    return (
      <>
        <div className="mainContent-container">
          <div className="mainContent-wrapper">
            {/* Logo */}
            <div className="mainContent-logo-wrapper">
              <Image 
                src="/Images/Blabberly_logo_bg.png" 
                alt="Blabberly Logo" 
                width={112} 
                height={112} 
                className="mainContent-logo"
                priority
                unoptimized
              />
            </div>

            {/* Main Heading */}
            <h1 className="mainContent-heading">
              Connect freely with <span className="mainContent-heading-gradient">Blabberly</span>
            </h1>
            
            {/* Subheading */}
            <h2 className="mainContent-subheading">
            Experience a new era of messaging where simplicity meets power. <br /> Fast, secure, and designed for humans who love to talk.
            </h2>

            <button 
              className="mainContent-getStarted-button"
              onClick={() => setIsSignupModalOpen(true)}
            >
              Get Started for Free
            </button>

            <button className="mainContent-learnMore-button">
              Learn More
            </button>

          {/* Feature Cards */}

        </div>
      </div>


        {/* Signup Modal */}
        <SignupModal 
          isOpen={isSignupModalOpen} 
          onClose={() => setIsSignupModalOpen(false)} 
        />
      </>
    );
  }