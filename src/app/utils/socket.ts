/**
 * Socket.IO Singleton Utility
 * Creates exactly ONE socket per browser tab.
 */

import { io, Socket } from "socket.io-client";
import { getAuthToken, getUserId } from "./auth";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  // 🔥 IMPORTANT: return existing socket if it exists
  if (socket) return socket;

  const token = getAuthToken();
  const userId = getUserId();

  if (!token || !userId) {
    console.warn("Socket not created: user not authenticated");
    return null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
  });

  socket.on("connect", () => {
    console.log("🟢 Socket connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔴 Socket disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket error:", err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function isSocketConnected() {
  return socket?.connected ?? false;
}
