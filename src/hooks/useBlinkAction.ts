'use client';
import { useEffect, useState } from 'react';
import { unfurlUrlToActionApiUrl } from '@/utils/url-mapper';
import { Action, ActionAdapter, ActionGetResponse, ActionSupportStrategy, defaultActionSupportStrategy, NextAction, useActionsRegistryInterval } from '@dialectlabs/blinks';
import database, { onValue, ref, set, update } from '@react-native-firebase/database';
import { createResponseFromData, getActionMetadata, proxify } from '@/utils/blinks';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { reduxStorage } from '@/store';


interface UseActionOptions {
  url: string;
  adapter: ActionAdapter;
  chatId: string;
  message: any;
  securityRegistryRefreshInterval?: number;
  supportStrategy?: ActionSupportStrategy;
}

function useActionApiUrl(url: string, chatId: string, message: any) {
  const [apiUrl, setApiUrl] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    if(message?.data?.apiUrl){
      setApiUrl(message?.data?.apiUrl);
      return;
    }
    else{
      unfurlUrlToActionApiUrl(url)
        .then((apiUrl) => {
          if (ignore) {
            return;
          }
          setApiUrl(apiUrl);
          const messageRef = ref(database(), `chats/${chatId}/messages/${message?.id}/data`);
          (async ()=>{
            await update(messageRef, {
              apiUrl
            });
          })()
        })
        .catch((e) => {
          // console.log("getting data error", message);
          console.error('[@dialectlabs/blinks] Failed to unfurl action URL', e);
          setApiUrl(null);
        });
    }

    return () => {
      ignore = true;
    };
  }, [url]);

  return { actionApiUrl: apiUrl };
}

export function useAction({
  url,
  adapter,
  supportStrategy = defaultActionSupportStrategy,
  message,
  chatId,
}: UseActionOptions) {
  const { isRegistryLoaded } = useActionsRegistryInterval();
  const { actionApiUrl } = useActionApiUrl(url, chatId, message);
  const [action, setAction] = useState<Action | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    const actionKey = `action_${message?.id}`;

    (async ()=>{
      if (!isRegistryLoaded || !actionApiUrl) {
        return;
      }
      const cachedAction = await reduxStorage.getItem(actionKey);

      setIsLoading(true);
      if(cachedAction){
        const data=  JSON.parse(cachedAction);
        const metadata = getActionMetadata(createResponseFromData(data));
        const action = Action.hydrate(
          actionApiUrl,
          data,
          metadata,
          supportStrategy,
          undefined
        );
        setAction(action);
      }
      else{ 
        const proxyUrl = proxify(actionApiUrl);
        const response = await fetch(proxyUrl, {
          headers: {
            Accept: 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(
            `Failed to fetch action ${proxyUrl}, action url: ${actionApiUrl}`,
          );
        }
    
        const data = (await response.json()) as NextAction;
        await reduxStorage.setItem(actionKey, JSON.stringify(data));

        const metadata = getActionMetadata(response);
  
        const action = Action.hydrate(
          actionApiUrl,
          data,
          metadata,
          supportStrategy,
          undefined
        );
        setAction(action);
      }
    })()


    return () => {
      ignore = true;
    };
  }, [actionApiUrl, isRegistryLoaded, message, chatId]);

  useEffect(() => {
    action?.setAdapter(adapter);
  }, [action, adapter]);

  return { action, isLoading };
}
