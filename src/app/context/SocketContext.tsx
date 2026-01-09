"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Socket } from "socket.io-client";
import { getSocket, disconnectSocket } from "../utils/socket";
import { getAuthToken, getUserId } from "../utils/auth";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    const userId = getUserId();

    if (!token || !userId) return;

    const s = getSocket();
    if (!s) return;

    setSocket(s);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    // Handle logout from another tab
    const onStorage = (e: StorageEvent) => {
      if (e.key === "authToken" && !e.newValue) {
        disconnectSocket();
        setSocket(null);
        setIsConnected(false);
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      window.removeEventListener("storage", onStorage);
      // ❌ DO NOT disconnect socket here
    };
  }, []);

  // Disconnect only on full page unload
  useEffect(() => {
    const unload = () => disconnectSocket();
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocket must be used inside SocketProvider");
  }
  return ctx;
}
