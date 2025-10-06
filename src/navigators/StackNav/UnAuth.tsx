import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { MainParamsList } from "@/types";
import { CreateProfileScreen, OTPVerificationScreen, SetupProfileScreen } from '@/screens';

const Stack = createNativeStackNavigator<MainParamsList>();

// @refresh reset
const UnAuthNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                gestureEnabled: true,
                animation: 'default',
                animationDuration: 100,
            }}
            initialRouteName="SetupProfileScreen"
        >
            <Stack.Screen name='SetupProfileScreen' component={SetupProfileScreen} />
            <Stack.Screen name='OTPVerificationScreen' component={OTPVerificationScreen} />
            <Stack.Screen name='CreateProfileScreen' component={CreateProfileScreen} />
        </Stack.Navigator>
    );
};

export default React.memo(UnAuthNavigator);
