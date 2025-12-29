'use client';

import { useState, useCallback, useEffect } from 'react';
import ChatSidebar from '../Components/ChatSidebar';
import ChatList from '../Components/ChatList';
import ChatWindow from '../Components/ChatWindow';
import EmptyChatView from '../Components/EmptyChatView';
import SearchUserModal from '../Components/SearchUserModal';
import ProtectedRoute from '../Components/ProtectedRoute';
import ChatNavbar from '../Components/ChatNavbar';
import { useFriendRequests } from '@/hooks/useFriendRequests';
import { useFriends } from '@/hooks/useFriends';
import { useChatrooms } from '@/hooks/useChatrooms';
import { initializeSocket, disconnectSocket } from '../utils/socket';
import { getUserId } from '../utils/auth';

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState<'chats' | 'settings' | 'profile'>('chats');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  
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
    chatrooms,
    isLoading: chatroomsLoading,
    fetchChatrooms,
    updateLastMessage,
  } = useChatrooms();

  const currentUserId = getUserId();

  // Initialize socket connection on mount
  useEffect(() => {
    if (currentUserId) {
      initializeSocket();
    }

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, [currentUserId]);

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
      
      // Refresh chatrooms to get the new chatroom from the server
      await fetchChatrooms();
      
      // Find the chatroom for this friend (it should now exist after fetch)
      const friendChatRoom = chatrooms.find(room => room.friendId === newFriend.id);
      if (friendChatRoom) {
        setSelectedChatId(friendChatRoom.id);
      }
    }
  }, [acceptRequest, addFriend, fetchChatrooms, chatrooms]);

  const handleRejectRequest = useCallback(async (requestId: string) => {
    await rejectRequest(requestId);
  }, [rejectRequest]);

  const handleSelectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
  }, []);

  const selectedChat = chatrooms.find(room => room.id === selectedChatId) || null;

  // Determine what to show in the main area
  const hasChats = chatrooms.length > 0;
  const showEmptyState = !hasFriends && !hasChats && incomingRequests.length === 0;

  return (
    <ProtectedRoute>
      <div className="chat-page flex flex-col">
        {/* Top Navbar (Chat Page) */}
        <ChatNavbar
          friendRequests={incomingRequests}
          onAcceptRequest={handleAcceptRequest}
          onRejectRequest={handleRejectRequest}
          isLoading={friendRequestsLoading}
        />

        {/* Main chat layout */}
        <div className="chat-main-container">
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
                  chatRooms={chatrooms}
                  selectedChatId={selectedChatId}
                  onSelectChat={handleSelectChat}
                  friendRequests={incomingRequests}
                  onNewChat={handleOpenSearchModal}
                />
                <ChatWindow
                  chatroom={selectedChat}
                  currentUserId={currentUserId || ''}
                  onUpdateLastMessage={updateLastMessage}
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
