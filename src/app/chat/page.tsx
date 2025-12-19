'use client';

import { useState, useCallback } from 'react';
import ChatSidebar from '../Components/ChatSidebar';
import ChatList from '../Components/ChatList';
import ChatWindow from '../Components/ChatWindow';
import EmptyChatView from '../Components/EmptyChatView';
import SearchUserModal from '../Components/SearchUserModal';
import ProtectedRoute from '../Components/ProtectedRoute';
import { useFriendRequests, useFriends } from '../hooks/friend';
import { useChat } from '../hooks/chat';

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState<'chats' | 'settings' | 'profile'>('chats');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  
  // Hooks
  const { 
    incomingRequests, 
    acceptRequest, 
    rejectRequest,
    isLoading: friendRequestsLoading 
  } = useFriendRequests();
  
  const { 
    friends, 
    addFriend, 
    hasFriends 
  } = useFriends();
  
  const {
    chatRooms,
    selectedChatId,
    selectChat,
    createChatRoom,
    sendMessage,
    getSelectedChat,
    markConnectionAsRead,
    hasChats,
  } = useChat();

  const currentUserId = 'current_user'; // In real app, get from auth context

  const handleTabChange = (tab: 'chats' | 'settings' | 'profile') => {
    setActiveTab(tab);
  };

  const handleOpenSearchModal = useCallback(() => {
    setIsSearchModalOpen(true);
  }, []);

  const handleCloseSearchModal = useCallback(() => {
    setIsSearchModalOpen(false);
  }, []);

  const handleAcceptRequest = useCallback(async (requestId: string) => {
    const newFriend = await acceptRequest(requestId);
    if (newFriend) {
      // Add to friends list
      addFriend(newFriend);
      
      // Create a new chat room for this friend
      const newRoom = createChatRoom(
        newFriend.id, 
        newFriend.username, 
        newFriend.avatar
      );
      
      // Automatically select the new chat
      selectChat(newRoom.id);
    }
  }, [acceptRequest, addFriend, createChatRoom, selectChat]);

  const handleRejectRequest = useCallback(async (requestId: string) => {
    await rejectRequest(requestId);
  }, [rejectRequest]);

  const handleSendMessage = useCallback((chatId: string, text: string) => {
    sendMessage(chatId, text, currentUserId);
  }, [sendMessage, currentUserId]);

  const handleSelectChat = useCallback((chatId: string) => {
    selectChat(chatId);
  }, [selectChat]);

  const selectedChat = getSelectedChat();

  // Determine what to show in the main area
  const showEmptyState = !hasFriends && !hasChats && incomingRequests.length === 0;

  return (
    <ProtectedRoute>
      <div className="chat-page flex flex-col">
        {/* Top Navbar (Chat Page) */}
        <header className="fixed top-0 left-0 right-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                blabberly
              </span>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button
                type="button"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-indigo-300 hover:text-indigo-500 hover:shadow-md transition"
                aria-label="Notifications"
              >
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[0.625rem] font-semibold text-white shadow-sm">
                  3
                </span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 10.5C18 8.84315 17.3679 7.26264 16.2426 6.13744C15.1174 5.01225 13.5369 4.38013 11.88 4.38013C10.2231 4.38013 8.64263 5.01225 7.51744 6.13744C6.39224 7.26264 5.76013 8.84315 5.76013 10.5C5.76013 14.25 4.5 15.75 4.5 15.75H19.26C19.26 15.75 18 14.25 18 10.5Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.7552 18.75C13.5548 19.0964 13.2677 19.384 12.9244 19.5836C12.5811 19.7831 12.1939 19.8879 11.8002 19.8879C11.4066 19.8879 11.0194 19.7831 10.6761 19.5836C10.3328 19.384 10.0457 19.0964 9.84521 18.75"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* User avatar */}
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-xs font-semibold text-white shadow-sm hover:shadow-md transition"
                aria-label="Profile"
              >
                SP
              </button>
            </div>
          </div>
        </header>

        {/* Main chat layout */}
        <div className="chat-main-container pt-16">
          <ChatSidebar activeTab={activeTab} onTabChange={handleTabChange} />
          <div className="chat-container">
            {showEmptyState ? (
              <>
                {/* Empty Chat List */}
                <div className="chat-list">
               
                  <div className="chat-list-search">
                    <input 
                      type="text" 
                      placeholder="Search conversations..."
                      className="chat-list-search-input"
                      disabled
                    />
                  </div>
                </div>
                {/* Empty State View */}
                <EmptyChatView onFindFriends={handleOpenSearchModal} />
              </>
            ) : (
              <>
                <ChatList 
                  chatRooms={chatRooms}
                  selectedChatId={selectedChatId}
                  onSelectChat={handleSelectChat}
                  friendRequests={incomingRequests}
                  onNewChat={handleOpenSearchModal}
                />
                <ChatWindow
                  chatRoom={selectedChat}
                  currentUserId={currentUserId}
                  onSendMessage={handleSendMessage}
                  onMarkAsRead={markConnectionAsRead}
                />
              </>
            )}
          </div>
        </div>

        {/* Search User Modal */}
        <SearchUserModal
          isOpen={isSearchModalOpen}
          onClose={handleCloseSearchModal}
        />
      </div>
    </ProtectedRoute>
  );
}
