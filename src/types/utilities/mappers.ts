export interface GroupChatResponse {
  message: string;
  chat: {
    chatId: string;
    type: 'group';
    participants: string[];
    roles: {
      [participantId: string]: 'admin' | 'member';
    };
    name: string;
    lastMessage: string | null;
    createdAt: string;
    updatedAt: string;
    archived: boolean;
    groupIcon: string | null;
    mutedBy:string[];
    backgroundColor?: string;
  };
}

export interface StateUser<TChat> {
  authToken: string;
  success: boolean;
  user: {
    address: string;
    chats: TChat[];
    id: string;
    lastActive: number;
    userBio?: string;
    fullName?: string;
    newNonce: string;
    profilePicture: string;
    profileThumbnail?: string;
    status: string;
    username: string;
  };
}
