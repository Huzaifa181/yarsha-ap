interface TimeUnit {
    value: number;
    unit: string;
  }
  
  const TIME_UNITS: TimeUnit[] = [
    { value: 31536000, unit: 'year' },
    { value: 2592000, unit: 'month' },
    { value: 86400, unit: 'day' },
    { value: 3600, unit: 'hour' },
    { value: 60, unit: 'minute' },
    { value: 1, unit: 'second' }
  ];
  
  /**
   * Formats a timestamp into a "last seen" status based on the time difference.
   * @param {number} timestamp - The Unix timestamp in milliseconds.
   * @returns {string} - The formatted last seen status.
   */
  export const getLastSeen = (timestamp: number): string => {
    if (timestamp === 0) return 'Last seen long time ago';
    
    const now = Date.now();
    const secondsDiff = Math.floor((now - timestamp) / 1000);
  
    // For very recent times (less than 30 seconds)
    if (secondsDiff < 30) return 'Last seen just now';
    
    // For times less than 60 seconds
    if (secondsDiff < 60) return 'Last seen recently';
  
    // Find the appropriate time unit
    for (const { value, unit } of TIME_UNITS) {
      const count = Math.floor(secondsDiff / value);
      if (count >= 1) {
        // Handle special cases for months and years
        if (unit === 'month' || unit === 'year') {
          const date = new Date(timestamp);
          const options: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric',
            year: unit === 'year' ? 'numeric' : undefined,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          };
          return `Last seen ${new Intl.DateTimeFormat('en-US', options).format(date)}`;
        }
        return `Last seen ${count} ${unit}${count > 1 ? 's' : ''} ago`;
      }
    }
    
    return 'Last seen recently';
  };
  
  /**
   * Formats a date for message timestamps
   * @param {number} timestamp - The Unix timestamp in milliseconds
   * @returns {string} - Formatted time string
   */
  export const getMessageTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isThisYear = date.getFullYear() === now.getFullYear();
  
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      ...(isToday ? {} : {
        month: 'short',
        day: 'numeric',
        ...(isThisYear ? {} : { year: 'numeric' })
      })
    };
  
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };
  
  /**
   * Returns whether a timestamp is from today
   * @param {number} timestamp - The Unix timestamp in milliseconds
   * @returns {boolean} - True if the timestamp is from today
   */
  export const isToday = (timestamp: number): boolean => {
    const date = new Date(timestamp);
    const now = new Date();
    return date.toDateString() === now.toDateString();
  };