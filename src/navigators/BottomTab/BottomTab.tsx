import { BottomTab } from '@/components/template';
import { ChatsScreen, ContactsScreen, HistoryScreen, SearchScreen, SettingsScreen } from '@/screens';
import { AuthStackParamList } from "@/types";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';

const Tab = createBottomTabNavigator<AuthStackParamList>();

const BottomTabs: React.FC = () => {
    return (
        <Tab.Navigator
            detachInactiveScreens={false}
            initialRouteName="ChatsScreen"
            screenOptions={{
                headerShown: false,
                animation: "shift",
                tabBarHideOnKeyboard: true,
                transitionSpec: {
                    animation: 'spring',
                    config: {
                        stiffness: 1000,
                        damping: 50,
                        mass: 3,
                        overshootClamping: true,
                        restDisplacementThreshold: 0.01,
                        restSpeedThreshold: 0.01,
                    },
                }
            }}
            tabBar={props => <BottomTab {...props} />}
        >
            <Tab.Screen
                name={"ContactsScreen"}
                component={ContactsScreen}
                options={{
                    tabBarLabel: "Contacts",
                }}
                listeners={({ navigation }) => ({
                    tabPress: async (e) => {
                        e.preventDefault();
                        navigation.navigate("ContactsScreen");
                    },
                })}
            />
            <Tab.Screen name={"ChatsScreen"} component={ChatsScreen} options={{
                tabBarLabel: "Chat",
            }}
                listeners={({ navigation }) => ({
                    tabPress: async (e) => {
                        e.preventDefault();
                        if (navigation) {
                            navigation.navigate("ChatsScreen");
                        }
                    },
                })}
            />
            <Tab.Screen name={"SearchScreen"} component={SearchScreen} options={{
                tabBarLabel: "Search",
            }}
                listeners={({ navigation }) => ({
                    tabPress: async (e) => {
                        e.preventDefault();
                        if (navigation) {
                            navigation.navigate("SearchScreen");
                        }
                    },
                })}
            />
            <Tab.Screen name={"SettingsScreen"} component={SettingsScreen} options={{
                tabBarLabel: "Settings"
            }}
                listeners={({ navigation }) => ({
                    tabPress: async (e) => {
                        e.preventDefault();
                        if (navigation) {
                            navigation.navigate("SettingsScreen");
                        }
                    },
                })}
            />
            <Tab.Screen name={"HistoryScreen"} component={HistoryScreen} options={{
                tabBarLabel: "History",
                animation: "shift",
            }}
                listeners={({ navigation }) => ({
                    tabPress: async (e) => {
                        e.preventDefault();
                        if (navigation) {
                            navigation.navigate("HistoryScreen");
                        }
                    },
                })}
            />
        </Tab.Navigator>
    );
};

export default React.memo(BottomTabs);
