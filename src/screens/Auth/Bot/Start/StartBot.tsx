import { ButtonVariant, TextVariant } from '@/components/atoms';
import { SafeScreen } from '@/components/template'
import MessageRepository from '@/database/repositories/Message.repository';
import { useSelector } from '@/hooks';
import { useAddMessageMutation } from '@/hooks/domain';
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser';
import { useGeneratePeerChatMutation } from '@/hooks/domain/individual-chat/individualChats';
import { CheckIndividualChatRequestWrapper } from '@/pb/groupchat';
import { SendMessageRequest } from '@/pb/message';
import { MessageServiceClient } from '@/pb/message.client';
import { UserGRPClient } from '@/services/grpcService/grpcClient';
import { RNGrpcTransport } from '@/services/grpcService/RPCTransport';
import { RootState } from '@/store';
import { useTheme } from '@/theme';
import { SafeScreenNavigationProp, SafeScreenRouteProp } from '@/types';
import { generateRequestHeader } from '@/utils/requestHeaderGenerator';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { FC, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

interface IProps { }

/**
* @author Nitesh Raj Khanal
* @function @StartBot
**/

const MessageClient = new MessageServiceClient(
    new RNGrpcTransport(UserGRPClient),
);

const StartBot: FC<IProps> = (props) => {
    const route = useRoute<SafeScreenRouteProp & {
        params:
        {
            botId: string,
            name: string,
            type: string,
            profilePicture: string,
            botDescription: string,
            botBio: string,
            category?: string,
            username?: string,
            descriptions?: string[]
        }
    }>();
    const { botId, descriptions } = route.params;

    console.log("🚀 ~ file: StartBot.tsx:42 ~ StartBot ~ botId:", botId);

    const { t } = useTranslation(["translations"]);

    const { layout, components, gutters, backgrounds, colors } = useTheme()

    const token = useSelector((state: RootState) => state.accessToken.authToken)

    const [generatePeerChat] = useGeneratePeerChatMutation();
    const { data: latestUser } = useFetchLatestUserQuery()

    const [chatId, setChatId] = useState<string>('');

    const navigation = useNavigation<SafeScreenNavigationProp>();

    const [launchingBot, setLaunchingBot] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            try {
                const RequestHeader = await generateRequestHeader();
                const requestPayload: CheckIndividualChatRequestWrapper = {
                    body: {
                        peerId: botId,
                    },
                    requestHeader: {
                        action: 'checkIndividualChat',
                        requestId: Date.now().toString(),
                        timestamp: RequestHeader.Timestamp,
                        appVersion: "1.0.1",
                        deviceId: RequestHeader.DeviceId,
                        deviceType: "mobile",
                        channel: "mobile",
                        deviceModel: RequestHeader.DeviceModel,
                        clientIp: "127.0.0.1",
                        languageCode: "en",
                    }
                }

                const checkIndividualChatResponse = await generatePeerChat(requestPayload).unwrap();

                console.log('checkIndividualChatResponse in private message screen', checkIndividualChatResponse);
                setChatId(checkIndividualChatResponse?.response?.groupId || '');
            } catch (error) {
                console.error('Error in checkIndividualChatResponse', error);
                Alert.alert("Error", "Failed to check the bot chat");
            }
        })();
    }, [botId, generatePeerChat]);

    const [addMessage] = useAddMessageMutation()


    const handleSendMessage = useCallback(
        async () => {
            setLaunchingBot(true);
            try {

                if (latestUser) {
                    const existingMessage = await MessageRepository.getMessageByStatus(chatId, 'syncing');

                    console.log("existingMessage", existingMessage);

                    if (existingMessage) {
                        console.warn("🚫 Previous message is still syncing. Skipping new message...");
                        return;
                    }

                    const messageId = new Realm.BSON.ObjectId().toHexString();

                    const storedMessagePromise = addMessage({
                        chatId,
                        senderId: latestUser?.id,
                        content: "/start",
                        status: "pending",
                        messageId
                    }).unwrap();

                    console.log("chatId===>", chatId)
                    const grpcMessage = SendMessageRequest.create({
                        automated: false,
                        chatId,
                        content: "/start",
                        messageId,
                        senderId: latestUser?.id,
                        timestamp: new Date().toISOString(),
                    });

                    try {
                        const [storedMessage, sendThroughGrpc] = await Promise.all([
                            storedMessagePromise,
                            MessageClient.sendMessage(grpcMessage, {
                                meta: { Authorization: `Bearer ${token}` },
                            }).response,
                        ]);
                        console.log("✅ Stored Message:", storedMessage);
                        console.log("✅ GRPC Response:", sendThroughGrpc);

                        await MessageRepository.updateMessageStatus(storedMessage._id, 'sent');
                        navigation.navigate("BotMessageScreen", {
                            chatId: chatId,
                            name: route.params?.name,
                            type: "bot",
                            profilePicture: route.params?.profilePicture,
                            messageId: botId,
                            botId: botId,
                        })
                    } catch (error) {
                        console.error("❌ Error sending message through GRPC:", error);
                    }
                }
            } catch (error) {
                console.error('Error sending message:', error);
            }
            finally {
                setLaunchingBot(false);
            }
        },
        [chatId]
    );

    return (
        <SafeScreen
            profilePicture={route.params?.profilePicture}
            groupName={route.params?.name}
        >
            <View style={[layout.flex_1, layout.justifyBetween, gutters.padding_12, backgrounds.gray50]}>

                <View style={[layout.flex_1, layout.justifyCenter, gutters.marginBottom_250]}>
                    <TextVariant style={[components.urbanist26BoldBlack]}>{t("whatCanThisBotDo")}</TextVariant>

                    {
                        descriptions?.map((item, index) => (
                            <TextVariant key={index} style={[components.urbanist14RegularBlack, gutters.marginTop_10]}>
                                • {item || ''}
                            </TextVariant>
                        ))
                    }
                </View>

                <ButtonVariant
                    disabled={launchingBot}
                    onPress={handleSendMessage} style={[launchingBot ? components.disabledButton : components.blueBackgroundButton, layout.itemsCenter,
                    gutters.padding_14,]}>
                    {
                        launchingBot ? <ActivityIndicator size="small" color={colors.primary} /> : <TextVariant style={[components.urbanist16SemiBoldWhite]}>{t("start")}</TextVariant>
                    }

                </ButtonVariant>
            </View>
        </SafeScreen>
    )
}

export default React.memo(StartBot)