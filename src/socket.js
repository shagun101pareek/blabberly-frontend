import { io } from "socket.io-client";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";
const socket = io(BASE_URL, {
  autoConnect: false, // VERY IMPORTANT
});

export default socket;
