/**
 * @function shortenAddress
 * @param {string} address - The wallet address to be shortened. It can be for Ethereum or Solana.
 * @returns {string} The shortened address in the format [prefix][start]...[end], or an empty string if the address is invalid.
 * @description Shortens a wallet address (Ethereum or Solana) to a fixed length for display purposes.
 * @author Nitesh Raj Khanal
 */
export const shortenAddress = (address: string | null | undefined): string => {
  const ethereumPrefix = "0x";
  const ethereumAddressLength = 42;
  const ellipsis = "...";

  if (!address || typeof address !== "string") {
    console.warn("Invalid wallet address provided:", address);
    return ""; 
  }

  let startLength: number;
  let endLength: number;
  let prefix: string;

  if (
    address.startsWith(ethereumPrefix) &&
    address.length === ethereumAddressLength
  ) {
    startLength = 10;
    endLength = 3;
    prefix = ethereumPrefix;
  } else if (address.length >= 32 && address.length <= 44) {
    startLength = 6;
    endLength = 3;
    prefix = "";
  } else {
    console.warn("Invalid wallet address format:", address);
    throw new Error("Invalid address format");
  }

  const start = address.slice(prefix.length, prefix.length + startLength);
  const end = address.slice(-endLength);

  return `${prefix}${start}${ellipsis}${end}`;
};
