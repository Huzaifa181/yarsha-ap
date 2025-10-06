import {useEffect, useRef, useState} from 'react';
import io, {Socket} from 'socket.io-client';
import {SOCKET_COLLECTIONS} from '@/config';
import {store} from '@/store';

/**
 * Custom React hook to manage WebSocket connections using Socket.IO.
 * This version automatically handles authentication and server URL.
 *
 * @returns {{ isConnected: boolean, message: string | null, sendMessage:(chatId: string, senderId: string, msg: string) => void }}
 *          An object containing connection status, received message, and a function to send messages.
 */

interface SendMessageParams {
  chatId: string;
  senderId: string;
  msg: string;
  messageId: string;
}

type UseSocketReturn = {
  isConnected: boolean;
  message: string | null;
  sendMessage: (params: SendMessageParams) => void;
};

const useSocket = (): UseSocketReturn => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let isMounted = true;

    const getToken = async () => {
      try {
        const token = await store.getState().accessToken.authToken;
        return token;
      } catch (error) {
        console.error('Error getting token:', error);
        return null;
      }
    };

    const initializeSocket = async () => {
      const authToken = await getToken();
      if (!isMounted) return;

      socketRef.current = io(SOCKET_COLLECTIONS.MESSAGE_SEND_SOCKET, {
        transportOptions: {
          polling: {
            extraHeaders: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        },
      });

      socketRef.current.on('connect', () => {
        if (isMounted) {
          setIsConnected(true);
          console.log('Socket.IO connected at:', new Date().toISOString());
        }
      });

      socketRef.current.on('sendMessage', (msg: string) => {
        if (isMounted) {
          setMessage(msg);
        }
      });

      socketRef.current.on('error', (error: unknown) => {
        console.error('Socket.IO error:', error);
      });

      socketRef.current.on('disconnect', () => {
        if (isMounted) {
          setIsConnected(false);
          console.log('Socket.IO disconnected at:', new Date().toISOString());
        }
      });
    };

    initializeSocket();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  /**
   * Sends a message to the WebSocket server.
   *
   * @param {string} msg - The message content to be sent.
   * @param {string} chatId - The ID of the chat room.
   */
  const sendMessage = ({ chatId, senderId, msg, messageId }: SendMessageParams): void => {
    if (socketRef.current && isConnected) {
      const payload = {
        chatId,
        senderId,
        content: msg,
        messageId,
      };
  
      console.log('Sending message:', payload);
      socketRef.current.emit('sendMessage', JSON.stringify(payload));
    } else {
      console.warn('Cannot send message: Socket is not connected');
    }
  };

  return {isConnected, message, sendMessage};
};

export default useSocket;
