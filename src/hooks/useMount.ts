import { useEffect } from "react";

export const useMount = (func: () => void) => {
  useEffect(() => {
    func();
  }, []);
};

export const useAsyncMount = (func: () => Promise<void>) => {
  useEffect(() => {
    const execute = async () => {
      await func();
    };
    execute();
  }, []);
};
