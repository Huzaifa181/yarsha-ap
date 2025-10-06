export const formatTimestampToTimeAMPM = (timestamp: string): string => {
  const date = new Date(typeof timestamp === 'string' ? Date.parse(timestamp) : timestamp);

  if (isNaN(date.getTime())) return "Invalid Date";

  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12 || 12;
  const minutesFormatted = minutes < 10 ? `0${minutes}` : minutes;

  return `${hours}:${minutesFormatted} ${ampm}`;
};



export const formatTimestampToLocalTimeAMPM = (timestamp: string): string => {
  const date = new Date(typeof timestamp === 'string' ? Date.parse(timestamp) : timestamp);

  if (isNaN(date.getTime())) return "Invalid Date";

  let hours = date.getHours();
  const minutes = date.getMinutes(); 
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12 || 12;
  const minutesFormatted = minutes < 10 ? `0${minutes}` : minutes;

  return `${hours}:${minutesFormatted} ${ampm}`;
};
