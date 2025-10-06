import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AuthStackParamList } from "@/types";
import {
    AddAdminConfirmation,
    AddAdminsScreen,
    AddMembers,
    BotDescription,
    BotMessage,
    ChatsScreen,
    ContactsScreen,
    CreateGroup,
    DeleteAccount,
    EditGroup,
    EditProfile,
    EnterAmount,
    GroupDetailsScreen,
    MembersCount,
    MessageScreen,
    PortfolioScreen,
    PrivacyPolicy,
    PrivateMessage,
    ProfileDetailsScreen,
    QRCodeScreen,
    SearchScreen,
    SecurityAndPrivacyScreen,
    SendMoney,
    SetGroup,
    SettingsScreen,
    TermsAndCondition
} from '@/screens';
import { BottomTabNavigator } from '@/navigators';
import TokenContact from '@/screens/Auth/TokenContact/TokenContact';
import StartBot from '@/screens/Auth/Bot/Start/StartBot';
import PinnedMessage from '@/screens/Auth/Message/Shared/PinnedMessage';

const Stack = createNativeStackNavigator<AuthStackParamList>();

// @refresh reset
const AuthNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                gestureEnabled: true,
                animation: "default",
                animationDuration: 100,
            }}
            initialRouteName="BottomTab"
        >
            <Stack.Screen name="BottomTab" options={{
                animation: "default",
                animationTypeForReplace: "pop",
            }} component={BottomTabNavigator} />
            <Stack.Screen name='ChatsScreen' component={ChatsScreen} />
            <Stack.Screen name='PortfolioScreen' component={PortfolioScreen} />
            <Stack.Screen name='ContactsScreen' component={ContactsScreen} />
            <Stack.Screen name='TokenContactsScreen' component={TokenContact} />
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
            <Stack.Screen name='MessageScreen' component={MessageScreen} options={{
                headerShown: false,
                gestureEnabled: true,
                animation: "default",
                animationDuration: 100,
            }} />
            <Stack.Screen name='ProfileDetails' component={ProfileDetailsScreen} />
            <Stack.Screen name="EnterAmountScreen" component={EnterAmount} />
            <Stack.Screen name='CreateGroupScreen' component={CreateGroup} options={{
                animation: "slide_from_bottom",
                animationDuration: 300,
                animationTypeForReplace: "pop",
            }} />
            <Stack.Screen name="SetGroupScreen" component={SetGroup} />
            <Stack.Screen name='EditProfileScreen' component={EditProfile} />
            <Stack.Screen name="GroupDetailsScreen" component={GroupDetailsScreen} />
            <Stack.Screen name="SearchScreen" component={SearchScreen} />
            <Stack.Screen name="SecurityAndPrivacyScreen" options={{
                animation: "fade",
                animationDuration: 100,
                animationTypeForReplace: "pop",
            }} component={SecurityAndPrivacyScreen} />
            <Stack.Screen name="PrivateMessageScreen" component={PrivateMessage} />
            <Stack.Screen name="PinnedMessageScreen" component={PinnedMessage} />
            <Stack.Screen name="QRCodeScreen" component={QRCodeScreen} />
            <Stack.Screen name="SendMoney" component={SendMoney} options={{
                animation: "slide_from_bottom",
                animationDuration: 100,
                animationTypeForReplace: "pop",
            }} />
            <Stack.Screen name="EditGroupScreen" component={EditGroup} options={{
                animation: "slide_from_bottom",
                animationDuration: 100,
                animationTypeForReplace: "pop",
            }} />
            <Stack.Screen name="MembersScreen" component={MembersCount} options={{
                animation: "slide_from_bottom",
                animationDuration: 100,
                animationTypeForReplace: "pop",
            }} />
            <Stack.Screen
                name="AddMembers"
                component={AddMembers}
                options={{
                    animation: "slide_from_bottom",
                    animationDuration: 100,
                    animationTypeForReplace: "pop",
                }}
            />
            <Stack.Screen
                name="BotMessage"
                component={StartBot}
            />
            <Stack.Screen
                name='BotMessageScreen'
                component={BotMessage}
            />
            <Stack.Screen
                name="BotDescription"
                component={BotDescription}
            />
            <Stack.Screen
                name='AddAdminsScreen'
                component={AddAdminsScreen}
            />
            <Stack.Screen
                name={"AddAdminConfirmation"}
                component={AddAdminConfirmation}
            />
            <Stack.Screen
                name={'TermsAndCondition'}
                component={TermsAndCondition}
            />
            <Stack.Screen
                name={'PrivacyPolicy'}
                component={PrivacyPolicy}
            />
            <Stack.Screen
                name="DeleteAccount"
                component={DeleteAccount}
            />
        </Stack.Navigator>
    );
};

export default React.memo(AuthNavigator);
