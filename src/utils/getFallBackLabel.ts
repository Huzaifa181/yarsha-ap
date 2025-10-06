export function getFallbackLabel(type: string): string {
  switch (type) {
    case 'chatMuted':
      return 'Chat muted';
    case 'chatUnmuted':
      return 'Chat unmuted';
    case 'chatDeleted':
      return 'Chat deleted';
    case 'chatPinned':
      return 'Chat pinned';
    case 'chatUnPinned':
      return 'Chat unpinned';
    default:
      return '';
  }
}
