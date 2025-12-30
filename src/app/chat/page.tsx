'use client';

import { useState, useCallback } from 'react';
import ChatSidebar from '../Components/ChatSidebar';
import ChatList from '../Components/ChatList';
import ChatWindow from '../Components/ChatWindow';
import EmptyChatView from '../Components/EmptyChatView';
import SearchUserModal from '../Components/SearchUserModal';
import ProtectedRoute from '../Components/ProtectedRoute';
import ChatNavbar from '../Components/ChatNavbar';
import { useFriendRequests } from '@/hooks/useFriendRequests';
import { useFriends } from '@/hooks/useFriends';
import { useChat } from '@/api/auth/chat/chat';
import { getUserId } from '../utils/auth';
import { useSocketConnection } from '@/hooks/useSocketConnection';

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState<'chats' | 'settings' | 'profile'>('chats');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  
  // Initialize socket connection on page load
  useSocketConnection();

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
    fetchChatrooms,
  } = useChat();

  const currentUserId = getUserId() || 'current_user'; // Get from auth context

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
      const friendChatRoom = chatRooms.find(room => room.friendId === newFriend.id);
      if (friendChatRoom) {
        selectChat(friendChatRoom.id);
      } else {
        // Fallback: Create a local chat room if server hasn't created one yet
        const newRoom = createChatRoom(
          newFriend.id, 
          newFriend.username, 
          newFriend.avatar
        );
        selectChat(newRoom.id);
      }
    }
  }, [acceptRequest, addFriend, createChatRoom, selectChat, fetchChatrooms, chatRooms]);

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
                <div className="chat-list-sidebar">
                  <div className="chat-list-search">
                    <input 
                      type="text" 
                      placeholder="Search conversations..."
                      className="chat-list-search-input"
                      disabled
                    />
                  </div>
                  <div className="chat-list"></div>
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
