/**
 * Utility function to capitalize the first character of a string
 * @param str - Input string
 * @returns String with the first character capitalized
 */
export const capitalizeFirstLetter = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
};