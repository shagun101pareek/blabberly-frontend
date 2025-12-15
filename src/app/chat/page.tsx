'use client';

import { useState } from 'react';
import ChatSidebar from '../Components/ChatSidebar';
import ChatList from '../Components/ChatList';
import ChatView from '../Components/ChatView';
import ProtectedRoute from '../Components/ProtectedRoute';

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'chats' | 'settings' | 'profile'>('chats');

  // Sample chat data - you can replace this with real data from your backend
  const chats = [
    {
      id: 1,
      name: 'John Doe',
      lastMessage: 'Hey! How are you doing?',
      timestamp: '2:30 PM',
      unread: 2
    },
    {
      id: 2,
      name: 'Jane Smith',
      lastMessage: 'Let\'s meet tomorrow at 5',
      timestamp: '1:15 PM',
      unread: 0
    },
    {
      id: 3,
      name: 'Team Project',
      lastMessage: 'Great work everyone!',
      timestamp: '12:45 PM',
      unread: 5
    },
    {
      id: 4,
      name: 'Alex Johnson',
      lastMessage: 'Thanks for your help',
      timestamp: 'Yesterday',
      unread: 0
    },
    {
      id: 5,
      name: 'Sarah Williams',
      lastMessage: 'See you soon!',
      timestamp: 'Yesterday',
      unread: 1
    }
  ];

  const handleTabChange = (tab: 'chats' | 'settings' | 'profile') => {
    setActiveTab(tab);
    // In the future, you can add logic here to show different views
  };

  return (
    <ProtectedRoute>
      <div className="chat-page">
        <div className="chat-main-container">
          <ChatSidebar activeTab={activeTab} onTabChange={handleTabChange} />
          <div className="chat-container">
            <ChatList 
              chats={chats} 
              selectedChat={selectedChat}
              onSelectChat={setSelectedChat}
            />
            <ChatView 
              selectedChat={selectedChat}
              chatData={chats.find(chat => chat.id === selectedChat)}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

