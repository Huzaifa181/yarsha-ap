export const truncateAddress = (address: string) => {
    const start = address.slice(0, 8);
    const end = address.slice(-6); 
    return `${start}....${end}`;
  };