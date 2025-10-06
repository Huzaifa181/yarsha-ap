import {RootState} from '@/store';

export const selectUnreadCountByChatId =
  (chatId: string) => (state: RootState) =>
    state.unreadCount?[chatId] || 0;
