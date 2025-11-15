// import BlabberLogo from '../assets/blabberly-logo.png';
export default function MainContent() {
    return (
      <div className="mainContent-container">
        <div className="mainContent-wrapper">
          {/* Main Heading */}
          <h1 className="mainContent-heading">
            Connect instantly. <br /> 
            And blabber without boundaries.
          </h1>
          
          {/* Subheading */}
          <h2 className="mainContent-subheading">
            Blabbering made easier.
          </h2>

          <button className = "mainContent-getStarted-button">
            Get Started for Free
          </button>

          <button className="mainContent-learnMore-button">
            Learn More
            </button>

          {/* Feature Cards */}
          <div className="mainContent-cards">
            {/* Card 1: Instant Messaging */}
            <div className="mainContent-card">
              <div className="mainContent-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/>
                </svg>
              </div>
              <h3 className="mainContent-card-title">Instant Messaging</h3>
              <p className="mainContent-card-description">Real-time chat with zero delay</p>
            </div>

            {/* Card 2: Secure & Private */}
            <div className="mainContent-card">
              <div className="mainContent-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="white"/>
                </svg>
              </div>
              <h3 className="mainContent-card-title">Secure & Private</h3>
              <p className="mainContent-card-description">End-to-end encrypted conversations</p>
            </div>

            {/* Card 3: Easy to Use */}
            <div className="mainContent-card">
              <div className="mainContent-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="white"/>
                </svg>
              </div>
              <h3 className="mainContent-card-title">Easy to Use</h3>
              <p className="mainContent-card-description">Intuitive interface for everyone</p>
            </div>
          </div>
        </div>
      </div>
    );
  }