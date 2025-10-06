export type NotificationData = {
  lastMessage?: {
    content: string | null;
    data: null | string;
    messageId: string;
    senderFullName: string;
    senderId: string;
    senderImage?: string;
    senderName: string;
    timestamp: number;
  };
  chatData?: {
    chatId?: string;
    type: string;
    name: string;
    groupIcon?: string;
  };
};

export const buildDeepLinkFromNotificationData = (
  rawData?: NotificationData,
): string | null => {
  if (!rawData) return null;

  let data = {...rawData};

  // Parse `chatData` and `lastMessage` if they are stringified JSON
  if (typeof data.chatData === 'string') {
    try {
      data.chatData = JSON.parse(data.chatData);
    } catch (error) {
      console.error('Failed to parse chatData:', error);
      return null;
    }
  }

  if (typeof data.lastMessage === 'string') {
    try {
      data.lastMessage = JSON.parse(data.lastMessage);
    } catch (error) {
      console.error('Failed to parse lastMessage:', error);
      return null;
    }
  }

  const chatId = data.chatData?.chatId ?? '';
  const type = data.chatData?.type ?? '';
  const name = data.chatData?.name ?? '';
  const groupIcon = data.chatData?.groupIcon ?? '';
  const messageId = data.lastMessage?.senderId ?? '';
  const profilePicture = data.lastMessage?.senderImage ?? '';
  const senderFullName = data.lastMessage?.senderFullName??"";

  if (type === 'group' && chatId) {
    return `yarshaapp://auth/message/${chatId}/${name}/${type}/${encodeURIComponent(groupIcon)}`;
  }

  if (type === 'individual' && chatId) {
    return `yarshaapp://auth/privatemessage/${messageId}/${senderFullName}/${type}/${encodeURIComponent(profilePicture)}/${chatId}`;
  }

  if (chatId) {
    return `yarshaapp://auth/bottomtab/chat`;
  }

  return null;
};
