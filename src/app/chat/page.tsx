'use client';

import { useState } from 'react';
import Navbar from '../Components/Navbar';
import ChatList from '../Components/ChatList';
import ChatView from '../Components/ChatView';

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);

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

  return (
    <div className="chat-page">
      <Navbar />
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
  );
}

