import io, { Socket } from "socket.io-client";
import { SOCKET_COLLECTIONS } from "@/config";
import { store } from "@/store";

let socket: Socket | null = null;

export const initSocket = async () => {
    if (!socket) {
        const token = store.getState().accessToken.authToken;
        
        socket = io(SOCKET_COLLECTIONS.GROUP_CHAT_SUBSCRIBE, {
            transportOptions: {
                polling: {
                    extraHeaders: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            },
        });

        socket.on("connect", () => {
            console.log("Socket connected at:", new Date().toISOString());
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected at:", new Date().toISOString());
        });
    }
};

export const getSocket = () => socket;
