
/**
 * Formats a timestamp into "Today" if the date is today, or "DD/MM" otherwise.
 *
 * @param {number} timestamp - The Unix timestamp to format.
 * @returns {string} - The formatted date string.
 */


export const formatDateToUTC = (timestamp: any) => {
  const date = new Date(timestamp);
  
  const dayName = date.toLocaleString('en-US', { weekday: 'short', timeZone: 'UTC' });
  const monthName = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const day = String(date.getUTCDate()).padStart(2, '0');
  const year = date.getUTCFullYear();
  
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${dayName} ${monthName} ${day} ${year} ${hours}:${minutes}:${seconds} GMT+0000 (Coordinated Universal Time)`;
};