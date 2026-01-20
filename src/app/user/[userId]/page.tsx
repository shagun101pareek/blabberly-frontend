'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '../../Components/ProtectedRoute';
import ChatNavbar from '../../Components/ChatNavbar';
import ChatSidebar from '../../Components/ChatSidebar';

const mockProfile = {
  name: "Travis",
  username: "@travis_ui",
  bio: "Hi, I'm Travis! With more than 10 years of experience, I'm ready to be a part of your wonderful project!",
  profilePicture: "https://randomuser.me/api/portraits/men/75.jpg",
  onlineStatus: "online",
  stats: {
    connections: 650,
    mutuals: 99,
    projects: 240
  },
  isFollowing: false
};

export default function UserProfilePage() {
  const params = useParams();
  const userId = params?.userId as string;
  const [isFollowing, setIsFollowing] = useState(mockProfile.isFollowing);

  const handleFollowClick = () => {
    setIsFollowing(!isFollowing);
  };

  const handleMessageClick = () => {
    console.log("Start chat");
  };

  return (
    <ProtectedRoute>
      <div className="chat-page flex flex-col">
        <ChatNavbar />
        <div className="chat-main-container">
          <ChatSidebar activeTab="chats" />
          <div className="chat-container overflow-y-auto">
            <div className="min-h-screen bg-white">
              <div className="max-w-[1400px] mx-auto px-8 lg:px-16 py-8 lg:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[calc(100vh-4rem)]">
                  {/* Left Column - Text Content */}
                  <div className="space-y-6 order-2 lg:order-1">
                    {/* Main Headline */}
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                      Make{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500">
                        Designs
                      </span>{' '}
                      That
                      <br />
                      Engage, Delight,
                      <br />
                      and Connect
                    </h2>

                    {/* Bio */}
                    <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl pt-2">
                      {mockProfile.bio}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <button
                        onClick={handleMessageClick}
                        className="px-8 py-3.5 bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 text-white font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                      >
                        Message
                      </button>
                      <button
                        onClick={handleFollowClick}
                        className="flex items-center gap-2 text-slate-700 font-medium hover:text-slate-900 transition-colors duration-200"
                      >
                        <span>{isFollowing ? 'Following' : 'Follow'}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transform rotate-45">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                      </button>
                    </div>

                    {/* Stats Row */}
                    <div className="flex flex-wrap items-start gap-12 pt-4">
                      <div className="flex flex-col">
                        <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-none">
                          {mockProfile.stats.connections.toLocaleString()}+
                        </span>
                        <span className="text-xs text-slate-500 font-medium mt-2 tracking-wider uppercase">
                          Projects Done
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-none">
                          {mockProfile.stats.mutuals}%
                        </span>
                        <span className="text-xs text-slate-500 font-medium mt-2 tracking-wider uppercase">
                          Happy Client
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-none">
                          {mockProfile.stats.projects}+
                        </span>
                        <span className="text-xs text-slate-500 font-medium mt-2 tracking-wider uppercase">
                          Fine Artworks
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Visual */}
                  <div className="relative order-1 lg:order-2 flex justify-center lg:justify-end">
                    <div className="relative w-full max-w-[500px] aspect-square">
                      {/* Large background circle */}
                      <div className="absolute inset-0 w-full h-full rounded-full bg-slate-100/50"></div>
                      
                      {/* Curved gradient lines */}
                      <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                        <path
                          d="M 380 30 Q 420 80 460 120"
                          stroke="url(#gradient1)"
                          strokeWidth="2.5"
                          fill="none"
                          className="opacity-70"
                        />
                        <path
                          d="M 40 380 Q 80 420 120 460"
                          stroke="url(#gradient2)"
                          strokeWidth="2.5"
                          fill="none"
                          className="opacity-70"
                        />
                        <defs>
                          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#3b82f6" />
                          </linearGradient>
                          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#3b82f6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      
                      {/* Large Circular Profile Image */}
                      <div className="relative w-[85%] aspect-square mx-auto mt-[7.5%]">
                        <div className="absolute inset-0 w-full h-full rounded-full bg-white shadow-2xl"></div>
                        <div className="relative w-full h-full rounded-full overflow-hidden">
                          <img
                            src={mockProfile.profilePicture}
                            alt={mockProfile.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Decorative Icons */}
                      {/* Mobile Phone Icon - Top Right */}
                      <div className="absolute top-[8%] right-[12%] w-14 h-14 rounded-full border-2 border-transparent bg-gradient-to-r from-violet-500 to-blue-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-violet-500">
                            <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
                            <line x1="12" y1="18" x2="12" y2="18.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <rect x="8" y="6" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                        </div>
                      </div>

                      {/* Monitor Icon - Middle Left */}
                      <div className="absolute top-[45%] left-[5%] w-14 h-14 rounded-full border-2 border-transparent bg-gradient-to-r from-violet-500 to-blue-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-violet-500">
                            <rect x="2" y="4" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                            <line x1="6" y1="8" x2="18" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="8" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M12 16V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M8 20L16 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                      </div>

                      {/* Picture Frame Icon - Bottom Right */}
                      <div className="absolute bottom-[15%] right-[8%] w-14 h-14 rounded-full border-2 border-transparent bg-gradient-to-r from-violet-500 to-blue-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-violet-500">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                            <rect x="7" y="7" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M12 7V17M7 12H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

