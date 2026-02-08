'use client';

import { useState } from 'react';
import Image from 'next/image';
import SignupModal from './SignupModal';
import LoginModal from './LoginModal';
import { FaArrowRight } from "react-icons/fa6";

export default function MainContent() {
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

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
              <span className="mainContent-getStarted-text">Get Started for Free</span><span className="mainContent-getStarted-arrow"><FaArrowRight /></span> 
            </button>

            <button className="mainContent-learnMore-button">
              Learn More
            </button>

        </div>

        {/* <div className="review-marquee">
  <div className="review-track">
    <div className="review-card">
      <p className="review-text">
        Super fast and clean UI. Everything feels smooth and instant while chatting.
      </p>
      <span className="review-name">— Aditi Sharma</span>
    </div>

    <div className="review-card">
      <p className="review-text">
        Finally a chat app that feels human and not cluttered with unnecessary features.
      </p>
      <span className="review-name">— Rohan Mehta</span>
    </div>

    <div className="review-card">
      <p className="review-text">
        Minimal design, great performance, and very reliable even during long chats.
      </p>
      <span className="review-name">— Neha Kapoor</span>
    </div>

    <div className="review-card">
      <p className="review-text">
        The app feels premium and secure. Definitely my go-to messaging platform now.
      </p>
      <span className="review-name">— Arjun Verma</span>
    </div>

    {/* <!-- duplicate cards for seamless loop --> */}
    {/* <div className="review-card">
      <p className="review-text">
        Super fast and clean UI. Everything feels smooth and instant while chatting.
      </p>
      <span className="review-name">— Aditi Sharma</span>
    </div>

    <div className="review-card">
      <p className="review-text">
        Finally a chat app that feels human and not cluttered with unnecessary features.
      </p>
      <span className="review-name">— Rohan Mehta</span>
    </div>
  </div>
</div> } */}

      </div>


        {/* Signup Modal */}
        <SignupModal 
          isOpen={isSignupModalOpen} 
          onClose={() => setIsSignupModalOpen(false)}
          onSwitchToLogin={() => {
            setIsSignupModalOpen(false);
            setIsLoginModalOpen(true);
          }}
        />
        <LoginModal 
          isOpen={isLoginModalOpen} 
          onClose={() => setIsLoginModalOpen(false)} 
        />
      </>
    );
  }