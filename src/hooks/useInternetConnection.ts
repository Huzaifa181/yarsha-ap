import {useEffect, useState, useRef} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {useTranslation} from 'react-i18next';
import { useDispatch } from 'react-redux';

export const useInternetConnection = () => {
  const {t} = useTranslation(['translations']);
const dispatch = useDispatch();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const previousConnectionState = useRef<boolean | null>(null);
  const hasInitialized = useRef(false);
  const snackbarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleConnectionChange = (state: {isConnected: boolean | null}) => {
      if (hasInitialized.current) {
        if (previousConnectionState.current !== state.isConnected) {
          handleSnackbar(state.isConnected);
        }
      } else {
        hasInitialized.current = true;
      }
      if(state.isConnected !=null){
      }
      setIsConnected(state.isConnected);
      previousConnectionState.current = state.isConnected;
    };

    const checkConnection = async () => {
      const state = await NetInfo.fetch();
      if(state.isConnected !=null){
      }
      setIsConnected(state.isConnected);
      previousConnectionState.current = state.isConnected;
    };

    checkConnection();

    const unsubscribe = NetInfo.addEventListener(handleConnectionChange);

    return () => {
      unsubscribe();
      if (snackbarTimeoutRef.current) {
        clearTimeout(snackbarTimeoutRef.current);
      }
    };
  }, []);

  const handleSnackbar = (isConnected: boolean | null) => {
    if (isConnected === false) {
      setSnackbarMessage(t('lostConnection'));
      setSnackbarVisible(true);
    } else if (isConnected === true) {
      setSnackbarMessage(t('connectionRestored'));
      setSnackbarVisible(true);
      setSnackbarTimeout(3000);
    }
  };

  const setSnackbarTimeout = (duration: number) => {
    if (snackbarTimeoutRef.current) {
      clearTimeout(snackbarTimeoutRef.current);
    }
    snackbarTimeoutRef.current = setTimeout(() => {
      setSnackbarVisible(false);
    }, duration);
  };

  return {
    isConnected,
    snackbarVisible,
    snackbarMessage,
    setSnackbarVisible,
    snackbarTimeoutRef,
  };
};
