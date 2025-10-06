// Define a list of colors with their associated text color
const colorOptions = [
  { backgroundColor: '#002366', textColor: '#FFFFFF' }, // Dark blue with white text
  { backgroundColor: '#7F00FF', textColor: '#FFFFFF' }, // Violet with white text
  { backgroundColor: '#B5E0C3', textColor: '#000000' }, // Light green with black text
  { backgroundColor: '#FFD700', textColor: '#000000' }, // Gold with black text
  { backgroundColor: '#FF6600', textColor: '#000000' }, // Orange with black text
  { backgroundColor: '#FFB6C1', textColor: '#000000' }  // Light pink with black text
];

/**
 * Utility function to get a random color from the predefined list
 */
export const getRandomColor = (): { backgroundColor: string, textColor: string } => {
  const randomIndex = Math.floor(Math.random() * colorOptions.length);
  return colorOptions[randomIndex];
};
