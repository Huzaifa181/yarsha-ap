/**
 * Utility to format last seen time based on the time difference
 * @param lastActive - The last active timestamp in milliseconds
 * @returns A string representing the formatted last seen time
 */

export const formatLastSeen = (lastActive: number): string => {
  const currentTime = Date.now();
  const timeDiff = currentTime - lastActive;

  const seconds = Math.floor(timeDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) {
    return "Last seen recently";
  } else if (minutes < 60) {
    return `Last seen ${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (hours < 24) {
    return `Last seen ${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (days <= 7) {
    return `Last seen ${days} day${days > 1 ? "s" : ""} ago`;
  } else {
    const lastSeenDate = new Date(lastActive);
    return `Last seen on ${lastSeenDate.toLocaleDateString()}`;
  }
};
