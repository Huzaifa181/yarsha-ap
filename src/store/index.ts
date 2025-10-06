import {configureStore, combineReducers} from '@reduxjs/toolkit';
import {setupListeners} from '@reduxjs/toolkit/query';
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  Storage,
} from 'redux-persist';
import {MMKV} from 'react-native-mmkv';
import {api} from '@/services';
import {
  AvailableBiometricsReducer,
  AccessTokenReducer,
  CountryCodeReducer,
  SelectedUsers,
  BalanceReducer,
  LogoutReducer,
  DeleteAccountReducer,
} from './slices';
import {giphyApi} from '@/hooks/domain/fetch-gifs/useFetchGifs';

const reducers = combineReducers({
  logout: LogoutReducer,
  availableBiometrics: AvailableBiometricsReducer,
  accessToken: AccessTokenReducer,
  countryCode: CountryCodeReducer,
  selectedUsers: SelectedUsers,
  solanaBalance: BalanceReducer,
  account: DeleteAccountReducer,
  [api.reducerPath]: api.reducer,
  [giphyApi.reducerPath]: giphyApi.reducer,
});

export const storage = new MMKV();
export const reduxStorage: Storage = {
  setItem: (key, value) => {
    storage.set(key, value);
    return Promise.resolve(true);
  },
  getItem: key => {
    const value = storage.getString(key);
    return Promise.resolve(value);
  },
  removeItem: key => {
    storage.delete(key);
    return Promise.resolve();
  },
};

const persistConfig = {
  key: 'root',
  storage: reduxStorage,
  whitelist: ['theme', 'accessToken', 'solanaBalance'],
};

const persistedReducer = persistReducer(persistConfig, reducers);

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware => {
    const middlewares = getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: ['keypair.keypair'],
      },
      immutableCheck: false,
    })
      .concat(api.middleware)
      .concat(giphyApi.middleware);

    return middlewares;
  },
});

const persistor = persistStore(store);

setupListeners(store.dispatch);

export {store, persistor};

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<typeof reducers>;
