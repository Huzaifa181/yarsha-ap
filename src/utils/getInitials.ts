/**
 * Extracts the initials from a given name.
 *
 * @param {string} name - The name from which to extract initials.
 * @returns {string} - A string containing the initials, or an empty string if input is invalid.
 */
export const getInitials = (name: string): string => {
  // Check if the name is null, undefined, or not a string. Return an empty string if so.
  if (!name || typeof name !== 'string') {
    return '';
  }

  // Trim leading and trailing spaces and split the name into words.
  const words = name.trim().split(' ');

  // If there are no valid words after trimming, return an empty string.
  if (words.length === 0 || !words[0]) {
    return '';
  }

  // If there is only one word, return the first character as the initial.
  if (words.length === 1) {
    return words[0][0].toUpperCase();
  }

  // Extract the first character from the first and last words to form the initials.
  const firstNameInitial = words[0][0];
  const lastNameInitial = words[words.length - 1][0];

  // Return the initials in uppercase.
  return (firstNameInitial + lastNameInitial).toUpperCase();
};
