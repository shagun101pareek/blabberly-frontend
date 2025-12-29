# Frontend Messaging Implementation

This document explains the messaging flow implementation with Socket.IO for real-time messaging.

## 📁 Folder Structure

```
src/
├── app/
│   ├── utils/
│   │   ├── socket.ts          # Socket singleton utility
│   │   └── auth.ts             # Auth utilities (existing)
│   ├── chat/
│   │   └── page.tsx            # Main chat page (updated with socket connection)
│   └── Components/
│       └── ChatWindow.tsx      # Chat window component (works with new hooks)
├── api/
│   └── auth/
│       └── chat/
│           ├── chat.ts         # Main useChat hook (refactored)
│           ├── getChatrooms.ts # REST API for chatrooms (existing)
│           └── getMessages.ts  # REST API for messages (new)
└── hooks/
    ├── useChatrooms.ts         # Hook for fetching/managing chatrooms
    ├── useMessages.ts          # Hook for fetching/managing messages
    └── useSocketConnection.ts  # Hook for socket connection lifecycle
```

## 🔧 Implementation Details

### 1. Socket Setup (Singleton)
**File:** `src/app/utils/socket.ts`

- Creates a single Socket.IO client instance
- Ensures socket is NOT recreated on every render
- Handles connection, disconnection, and error events
- Automatically registers user on connection

**Key Functions:**
- `getSocket()` - Get or create socket instance
- `disconnectSocket()` - Cleanup socket connection
- `isSocketConnected()` - Check connection status

### 2. Socket Connection on Login
**File:** `src/hooks/useSocketConnection.ts`

- Connects socket on app load (chat page mount)
- Reads user from localStorage
- Emits `register` event with userId
- Ensures registration happens only once

**Usage:** Added to `src/app/chat/page.tsx`

### 3. Chatroom List (Sidebar)
**File:** `src/hooks/useChatrooms.ts`

- Fetches chatrooms using REST API (`GET /api/chat/chatrooms`)
- Displays other participant's username and last message
- Manages chatroom state cleanly
- Provides `updateChatroom` and `addChatroom` functions

**Key Functions:**
- `fetchChatrooms()` - Fetch from API
- `updateChatroom(id, updates)` - Update specific chatroom
- `addChatroom(chatroom)` - Add new chatroom

### 4. Message Fetching for Selected Chat
**File:** `src/hooks/useMessages.ts`

- Fetches messages using REST API (`GET /api/chat/chatrooms/:chatroomId/messages`)
- Displays messages in chronological order
- Handles loading & empty states
- Automatically fetches when chatroom is selected

**Key Functions:**
- `fetchMessages()` - Fetch messages for selected chatroom
- `addMessage(message)` - Add message (for optimistic updates & real-time)
- `clearMessages()` - Clear messages when switching chatrooms

### 5. Sending Messages (Socket)
**File:** `src/api/auth/chat/chat.ts` (useChat hook)

- On "Send" click, emits `sendMessage` via socket
- Uses optimistic UI update (message shows immediately)
- Clears input after sending
- Updates chatroom last message

**Socket Event:**
```typescript
socket.emit('sendMessage', {
  chatroomId: string,
  senderId: string,
  content: string
});
```

### 6. Receiving Messages (Socket Listener)
**File:** `src/api/auth/chat/chat.ts` (useChat hook)

- Listens for `receiveMessage` event
- If message belongs to currently open chat: appends to message list
- If message belongs to another chat: updates chatroom (doesn't add to messages)
- Updates last message and unread count

**Socket Events:**
- `receiveMessage` - New message received
- `messageSent` - Acknowledgment for sent message

### 7. Cleanup & Best Practices
- Socket listeners are properly removed on unmount
- No memory leaks (singleton pattern prevents multiple connections)
- Components are small and readable
- Clear variable and function names
- No unnecessary complexity

## 🔄 Data Flow

### Sending a Message:
1. User types message and clicks "Send"
2. `useChat.sendMessage()` is called
3. Optimistic message is added to UI immediately
4. Socket emits `sendMessage` event
5. Server processes and broadcasts to other participants
6. Server sends `messageSent` acknowledgment

### Receiving a Message:
1. Socket receives `receiveMessage` event
2. `useChat` hook processes the message
3. If current chat: message added to `useMessages` hook
4. Chatroom updated with last message
5. UI automatically updates

### Selecting a Chatroom:
1. User clicks on a chatroom in sidebar
2. `useChat.selectChat(chatroomId)` is called
3. `useMessages` hook automatically fetches messages via REST API
4. Messages displayed in chronological order
5. Chatroom marked as read (unreadCount = 0)

## 🎯 Key Features

✅ **Singleton Socket** - One connection, reused everywhere  
✅ **Optimistic UI** - Messages show immediately when sent  
✅ **Real-time Updates** - Messages appear instantly via socket  
✅ **REST API Fallback** - Messages fetched via REST on chat selection  
✅ **Clean Separation** - Hooks for chatrooms, messages, and socket  
✅ **Proper Cleanup** - No memory leaks, listeners removed on unmount  
✅ **Type Safety** - Full TypeScript support  

## 📝 Usage Example

```typescript
// In your component
const {
  chatRooms,
  selectedChatId,
  selectChat,
  sendMessage,
  getSelectedChat,
} = useChat();

// Select a chatroom
selectChat('chatroom-id');

// Send a message
sendMessage('chatroom-id', 'Hello!', currentUserId);

// Get selected chat with messages
const selectedChat = getSelectedChat();
```

## 🚀 Next Steps (Future Enhancements)

- Unread count tracking
- Read receipts
- Typing indicators
- Message status (sending, sent, delivered, read)
- Message reactions
- File attachments

