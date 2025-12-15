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
      <div className="chat-page">
        <div className="chat-main-container">
          <ChatSidebar activeTab={activeTab} onTabChange={handleTabChange} />
          <div className="chat-container">
            {showEmptyState ? (
              <>
                {/* Empty Chat List */}
                <div className="chat-list">
                  <div className="chat-list-header">
                    <h2 className="chat-list-title">Blabberly</h2>
                    <button 
                      className="chat-list-new-chat-button" 
                      onClick={handleOpenSearchModal}
                      title="Find Friends"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                        <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
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
                  onAcceptRequest={handleAcceptRequest}
                  onRejectRequest={handleRejectRequest}
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
