import React, { FC, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './translations';
import { ApplicationNavigator } from '@/navigators';
import { Provider } from 'react-redux';
import { persistor, storage, store } from '@/store';
import { PersistGate } from 'redux-persist/integration/react';
import { LanguageProvider } from '@/context';
import { PaperProvider } from 'react-native-paper';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useColorScheme } from 'react-native';
import { useTheme } from './theme';
import * as Sentry from '@sentry/react-native';

const Root: FC = () => {
    const { changeTheme, layout } = useTheme();
    const theme = useColorScheme();

    useEffect(() => {
        const hideSplash = async () => {
            changeTheme('dark');
        };

        hideSplash();
    }, [theme]);

    return (
        <GestureHandlerRootView style={[layout.flex_1]}>
            <BottomSheetModalProvider>
                <Provider store={store}>
                    <PersistGate loading={null} persistor={persistor}>
                        <LanguageProvider storage={storage}>
                            <PaperProvider
                                settings={{
                                    rippleEffectEnabled: false,
                                }}
                                theme={{
                                    version: 3,
                                }}>
                                <ApplicationNavigator />
                            </PaperProvider>
                        </LanguageProvider>
                    </PersistGate>
                </Provider>
            </BottomSheetModalProvider>
        </GestureHandlerRootView>
    );
};

export default Sentry.withProfiler(React.memo(Root))
