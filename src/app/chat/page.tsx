'use client';

import { useState, useCallback, useEffect } from 'react';
import ChatSidebar from '../Components/ChatSidebar';
import ChatList from '../Components/ChatList';
import ChatWindow from '../Components/ChatWindow';
// import EmptyChatView from '../Components/EmptyChatView';
import SearchUserModal from '../Components/SearchUserModal';
import ProtectedRoute from '../Components/ProtectedRoute';
import ChatNavbar from '../Components/ChatNavbar';
import { useFriendRequests } from '@/hooks/useFriendRequests';
import { useFriends } from '@/hooks/useFriends';
import { useChat } from '@/api/auth/chat/chat';
import { getUserId } from '../utils/auth';
// Socket connection is now handled globally in SocketProvider (layout.tsx)
// No need to initialize here anymore

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState<'chats' | 'settings' | 'profile'>('chats');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileShowingChat, setIsMobileShowingChat] = useState(false);
  
  // Socket connection is now handled globally in SocketProvider (layout.tsx)
  // Users will appear online as soon as they're logged in, not just when visiting chat page

  // Hooks
  const { 
    incomingRequests, 
    acceptRequest, 
    rejectRequest,
    isLoading: friendRequestsLoading,
    fetchPendingRequests
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
    isLoading: chatLoading,
  } = useChat();

  const currentUserId = getUserId() || 'current_user'; // Get from auth context

  // Detect mobile viewport (width < 768px)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 768px)');

    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      // When switching between mobile/desktop, keep currently selected chat but
      // let layout logic decide what to show.
      setIsMobile(event.matches);
    };

    // Initial value
    setIsMobile(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange as (e: MediaQueryListEvent) => void);
      return () => mediaQuery.removeEventListener('change', handleChange as (e: MediaQueryListEvent) => void);
    } else {
      // Fallback for older browsers (deprecated API)
      const listener = (e: MediaQueryListEvent) => handleChange(e);
      mediaQuery.addListener(listener);
      return () => mediaQuery.removeListener(listener);
    }
  }, []);

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
    // On mobile, switch to chat view when a conversation is selected
    setIsMobileShowingChat(true);
  }, [selectChat]);

  const handleCloseMobileChat = useCallback(() => {
    setIsMobileShowingChat(false);
  }, []);

  // Get selected chat - this should update when messages change
  const selectedChat = getSelectedChat();
  
  // Debug: Log when selectedChat changes
  useEffect(() => {
    if (selectedChat) {
      console.log('[ChatPage] selectedChat updated, message count:', selectedChat.messages.length);
    }
  }, [selectedChat?.messages.length, selectedChat?.id]);

  // Check if we're still loading initial data
  const isInitialLoading = chatLoading || friendRequestsLoading;

  // Determine what to show in the main area
  // Only show empty state if we're not loading AND have no data
  const showEmptyState = !isInitialLoading && !hasFriends && !hasChats && incomingRequests.length === 0;

  return (
    <ProtectedRoute>
      <div className="chat-page flex flex-col">
        {/* Top Navbar (Chat Page) */}
        <ChatNavbar />

        {/* Main chat layout */}
        <div className="chat-main-container">
          <ChatSidebar activeTab={activeTab} onTabChange={handleTabChange} />
          <div className="chat-container">
            {isInitialLoading ? (
              <>
                {/* Loading State - Show skeleton or loading indicator */}
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
                {/* On desktop we also show a loading chat window; on mobile list is enough */}
                {!isMobile && (
                  <div className="chat-window chat-window-empty">
                    <div className="chat-window-empty-content">
                      <div className="connections-spinner" style={{ margin: '0 auto' }}></div>
                    </div>
                  </div>
                )}
              </>
            ) : showEmptyState ? (
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
                {/* <EmptyChatView onFindFriends={handleOpenSearchModal} /> */}
              </>
            ) : (
              <>
                {/* On desktop/tablet show both panes. On mobile show either list or chat. */}
                {(!isMobile || !isMobileShowingChat) && (
                  <ChatList
                    chatRooms={chatRooms}
                    selectedChatId={selectedChatId}
                    onSelectChat={handleSelectChat}
                    friendRequests={incomingRequests}
                    onNewChat={handleOpenSearchModal}
                  />
                )}
                {(!isMobile || isMobileShowingChat) && (
                  <ChatWindow
                    chatRoom={selectedChat}
                    currentUserId={currentUserId}
                    onSendMessage={handleSendMessage}
                    onMarkAsRead={markConnectionAsRead}
                    hasFriends={hasFriends}
                    isMobile={isMobile}
                    onCloseMobile={isMobile ? handleCloseMobileChat : undefined}
                  />
                )}
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
