import { io } from "socket.io-client";
import { API_URL, getToken } from "./api";

const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

export const connectRealtime = () => {
  const token = getToken();

  if (!token) return null;

  return io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
  });
};