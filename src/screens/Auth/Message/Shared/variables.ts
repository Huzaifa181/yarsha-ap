import StyleGuide from "@/utils/StyleGuide";

export const MessageStyles = (fromMe: boolean, theme: 'light' | 'dark') => {
  return fromMe
    ? {
        right: 0,
      }
    : {
        left: 0,
      };
};
