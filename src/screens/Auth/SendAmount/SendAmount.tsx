import React, { FC, JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, TextInput, View, Platform, Keyboard, EmitterSubscription, Alert } from 'react-native';
import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { SafeScreen } from '@/components/template';
import { Images, ImagesDark, useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { getNetworkFee, heightPercentToDp } from '@/utils';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import { SafeScreenNavigationProp, SafeScreenRouteProp } from '@/types';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { shortenAddress } from '@/utils/shortenAddress';
import LottieView from 'lottie-react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from '@solana/web3.js';
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser';
import { createClusterConnection } from '@/utils/connection';
import { useCreateTransactionMutation } from '@/hooks/domain/create-transaction/useCreateTransaction';
import { generateRequestHeader } from '@/utils/requestHeaderGenerator';
import { APP_CLUSTER } from '@/config';
import { useSelector } from '@/hooks';
import { RootState } from '@/store';
import { UserGRPClient } from '@/services/grpcService/grpcClient';
import { MessageServiceClient } from '@/pb/message.client';
import { RNGrpcTransport } from '@/services/grpcService/RPCTransport';
import MessageRepository from '@/database/repositories/Message.repository';
import { useAddMessageMutation } from '@/hooks/domain';
import { SendMessageRequest, transactionPayload } from '@/pb/message';

interface IProps { }

/**
 * @author Nitesh Raj Khanal
 * @function @EnterAmount
 * @returns JSX.Element
 **/

const MessageClient = new MessageServiceClient(
    new RNGrpcTransport(UserGRPClient),
);


const EnterAmount: FC<IProps> = (): JSX.Element => {
    const { layout, backgrounds, gutters, components, borders, colors } = useTheme();
    const { t } = useTranslation(["translations"]);
    const navigation = useNavigation<SafeScreenNavigationProp>();
    const authToken = useSelector((state: RootState) => state.accessToken.authToken);
    const route = useRoute<SafeScreenRouteProp & { params: { chatType: string, groupDetail: any, token?: any, receivers?: any } }>();
    const { token, chatType, receivers, groupDetail } = route.params;

    console.log("receivers", receivers);
    const [sendAmount, setSendAmount] = useState<string>("");
    const [createTransaction] = useCreateTransactionMutation();
    const [addMessage] = useAddMessageMutation();
    const { data: latestUser } = useFetchLatestUserQuery();
    const [balance, setBalance] = useState<string>("");
    const [networkFee, setNetworkFee] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [transactionError, setTransactionError] = useState<string | null>(null);
    const [isKeyboardVisible, setKeyboardVisible] = useState<boolean>(false);
    const keyboardDidShowListener = useRef<EmitterSubscription | null>(null);
    const keyboardDidHideListener = useRef<EmitterSubscription | null>(null);
    const sentToBottomSheetModalRef = useRef<BottomSheetModal>(null);
    const insufficientBalanceModalRef = useRef<BottomSheetModal>(null);

    const maxAmount = useCallback(() => {
        setSendAmount(token?.balance.toString());
    }, [balance]);


    useEffect(() => {
        setTransactionError(null);
        keyboardDidShowListener.current = Keyboard.addListener('keyboardWillShow', () => {
            setKeyboardVisible(true);
        });

        keyboardDidHideListener.current = Keyboard.addListener('keyboardWillHide', () => {
            setKeyboardVisible(false);
        });
        // checkingBalance();
        return () => {
            keyboardDidHideListener.current?.remove();
            keyboardDidShowListener.current?.remove();
        };
    }, []);

    const handleSendToken = async () => {
        try {
            if (!token?.mint || !receivers?.length || !sendAmount) return;

            setIsLoading(true);
            setTransactionError(null);

            const connection = await createClusterConnection();
            if (!connection) throw new Error("No blockchain connection available");
            if (latestUser?.privateKey) {
                const secretKey = Uint8Array.from(Buffer.from(latestUser?.privateKey, 'base64'));
                const senderKeypair = Keypair.fromSecretKey(secretKey);

                const lamportsToSend = Math.floor(+sendAmount * LAMPORTS_PER_SOL);

                for (const receiver of receivers) {
                    const transaction = new Transaction();
                    const recipientPubkey = new PublicKey(receiver.address);

                    transaction.add(
                        SystemProgram.transfer({
                            fromPubkey: senderKeypair.publicKey,
                            toPubkey: recipientPubkey,
                            lamports: lamportsToSend,
                        }),
                    );

                    const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);

                    const RequestHeader = await generateRequestHeader();
                    const createTransactionRequestPayload = {
                        RequestHeader: RequestHeader,
                        AccessToken: authToken,
                        Body: {
                            toWallet: receiver.address,
                            cluster: APP_CLUSTER,
                            signature,
                        }
                    }
                    const createTransactionResponse = await createTransaction(createTransactionRequestPayload).unwrap();
                    console.log(`✅ Sent to ${receiver.address} with signature:`, signature);
                    const messageId = new Realm.BSON.ObjectId().toHexString();

                    let transactionPayload: transactionPayload = {
                        amount: sendAmount,
                        fromWallet: senderKeypair.publicKey.toString(),
                        senderId: latestUser?.id,
                        signature: signature,
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        toWallet: receiver.address,
                        transactionId: createTransactionResponse.transactionId
                    };

                    const storedMessagePromise = addMessage({
                        chatId: receiver.chatId,
                        senderId: latestUser?.id,
                        content: `${latestUser.fullName} has successfully sent ${createTransactionResponse.amount} ${token?.symbol} to ${receiver?.fullName} `,
                        messageId,
                        status: "pending",
                        automated: false,
                        type: 'transaction',
                        transaction: transactionPayload
                    }).unwrap();

                    const grpcMessage = SendMessageRequest.create({
                        chatId: receiver.chatId,
                        senderId: latestUser?.id,
                        messageId,
                        timestamp: new Date().toISOString(),
                        content: `${latestUser.fullName} has successfully sent ${createTransactionResponse.amount} ${token?.symbol} to ${receiver?.fullName} `,
                        automated: false,
                        transaction: transactionPayload
                    });
                    try {
                        const [storedMessage, sendThroughGrpc] = await Promise.all([
                            storedMessagePromise,
                            MessageClient.sendMessage(grpcMessage, {
                                meta: { Authorization: `Bearer ${authToken}` },
                            }).response,
                        ]);
                        console.log("✅ Stored Message:", storedMessage);
                        console.log("✅ GRPC Response:", sendThroughGrpc);
                        await MessageRepository.updateMessageStatus(storedMessage._id, 'sent');

                    } catch (error) {
                        console.error("❌ Error sending message through GRPC:", error);
                    }
                }
                sentToBottomSheetModalRef.current?.dismiss();
                if (chatType == "group" || chatType === "community") {
                    navigation.navigate('MessageScreen', {
                        chatId: groupDetail.chatId,
                        name: groupDetail.name || '',
                        type: groupDetail.type,
                        profilePicture: groupDetail.profilePicture,
                        membersCount: groupDetail.membersCount,
                        backgroundColor: groupDetail.backgroundColor,
                    });
                } else if (chatType == "individual") {
                    navigation.navigate('PrivateMessageScreen', {
                        messageId: receivers[0]?.id || '',
                        name: receivers[0].fullName || '',
                        type: "individual",
                        profilePicture:
                            receivers[0]?.profilePicture,
                        chatId: receivers[0].chatId || '',
                        backgroundColor:
                            receivers[0]?.backgroundColor || ''
                    });
                } else {
                    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] }));
                }
                // navigation.goBack();
            }

        } catch (err: any) {
            console.log('Transaction error:', err);
            const message = err?.message || 'Something went wrong';
            setTransactionError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const openInsufficientBalanceBottomSheet = () => {
        insufficientBalanceModalRef.current?.present()
    }

    const sendToSnapPoints = useMemo(
        () => [heightPercentToDp("50"), heightPercentToDp("50")],
        []
    );

    const insufficientBalanceToSnapPoints = useMemo(
        () => [heightPercentToDp("30"), heightPercentToDp("30")],
        []
    );

    const renderBackdrop = useCallback(
        (props: React.JSX.IntrinsicAttributes & BottomSheetDefaultBackdropProps) => (
            <BottomSheetBackdrop
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                {...props}
            />
        ),
        [],
    );

    const handleSheetChanges = useCallback((index: number) => {
        console.log('handleSheetChanges', index);
    }, []);



    useEffect(() => {
        const fetchNetworkFee = async () => {
            try {
                const fee = await getNetworkFee(new PublicKey(latestUser?.address || ""));
                setNetworkFee(fee !== undefined ? fee.toString() : "");
            } catch (error) {
                console.error("Error fetching network fee:", error);
            }
        }
        fetchNetworkFee();
    }, [
        latestUser
    ])

    return (
        <>
            <SafeScreen>
                <KeyboardAvoidingView
                    style={[layout.fullHeight, gutters.paddingBottom_24]}
                    {...(Platform.OS === 'ios' && { behavior: 'padding' })}
                >
                    <View style={[layout.flex_1, backgrounds.sendAmountBackground, gutters.padding_14, gutters.paddingVertical_20]}>
                        <ButtonVariant activeOpacity={1} style={[layout.flex_1, layout.itemsCenter, layout.justifyCenter]} onPress={() => {
                            Keyboard.dismiss();
                        }}>
                            <View style={[layout.row, layout.itemsEnd]}>
                                <TextInput
                                    value={sendAmount}
                                    onChangeText={(text) => setSendAmount(text)}
                                    keyboardType="numeric"
                                    keyboardAppearance="light"
                                    placeholder={t("0")}
                                    textAlign="center"
                                    autoFocus
                                    style={[
                                        components.urbanist48RegularBlack,
                                        components.textCenter,
                                        layout.flexShrink1,
                                        {
                                            color: token?.balance !== undefined && token?.balance !== null && !isNaN(+token?.balance) &&
                                                sendAmount !== undefined && sendAmount !== null && !isNaN(+sendAmount) &&
                                                (
                                                    +sendAmount * (receivers?.length) > +token?.balance
                                                )
                                                ? colors.error
                                                : "black"
                                        }
                                    ]}
                                    placeholderTextColor={colors.placeholderTextColor}
                                    selectionColor={colors.dark}
                                    caretHidden={false}
                                />
                                <TextVariant style={[components.urbanist24RegularBlack, gutters.marginBottom_18, gutters.marginLeft_2, layout.flexShrink0, {
                                    color: token?.balance !== undefined &&
                                        token?.balance !== null &&
                                        !isNaN(+token?.balance) &&
                                        sendAmount !== undefined &&
                                        sendAmount !== null &&
                                        !isNaN(+sendAmount) &&
                                        (
                                            +sendAmount * (receivers.length) > +token?.balance
                                        )
                                        ? colors.error
                                        : "black"
                                }]}>{token?.symbol}</TextVariant>
                            </View>
                            {(
                                token?.balance !== undefined &&
                                token?.balance !== null &&
                                !isNaN(+token?.balance) &&
                                sendAmount !== undefined &&
                                sendAmount !== null &&
                                !isNaN(+sendAmount) &&
                                (
                                    +sendAmount * (receivers.length) > +token?.balance
                                )
                            ) && (
                                    <View style={[layout.row, layout.itemsEnd]}>
                                        <TextVariant
                                            style={[
                                                components.urbanist24RegularBlack,
                                                gutters.marginBottom_8,
                                                gutters.marginLeft_10,
                                                layout.flexShrink0,
                                                { color: colors.error }
                                            ]}
                                        >
                                            {t("insufficientBalance")}
                                        </TextVariant>
                                    </View>
                                )}
                        </ButtonVariant>

                        <View style={[gutters.paddingVertical_14]}>
                            <View style={[layout.row, layout.justifyBetween, layout.itemsCenter, components.sendAmountTopBorder, gutters.paddingVertical_14]}>
                                <View>
                                    <TextVariant style={[components.urbanist14RegularLight]}>{t("availableToSend")}</TextVariant>
                                    <TextVariant style={[components.urbanist14BoldBlack]}>{token?.balance / receivers.length} {token?.symbol}</TextVariant>
                                </View>
                                <ButtonVariant style={[gutters.paddingHorizontal_4, layout.row, layout.itemsCenter, layout.justifyAround, layout.width55px, borders.w_1, borders.rounded_125, gutters.marginTop_10, gutters.marginLeft_6, gutters.paddingVertical_4]} onPress={maxAmount}>
                                    <TextVariant style={[components.urbanist10RegularmessageSenderText, layout.flex_1]}>{t("max")}</TextVariant>
                                    <ImageVariant
                                        source={Images.arrowRightWithBg}
                                        sourceDark={ImagesDark.arrowRightWithBg}
                                        style={[components.iconSize16]}
                                    />
                                </ButtonVariant>
                            </View>
                            {!isKeyboardVisible && (
                                <ButtonVariant
                                    style={[
                                        (token?.balance &&
                                            (
                                                (+sendAmount * (receivers.length)) > +token?.balance
                                            )
                                        ) ? components.disabledButton : components.blueBackgroundButton,
                                        layout.itemsCenter,
                                        gutters.padding_14,
                                        gutters.marginBottom_8,
                                    ]}
                                    onPress={() => {
                                        setTransactionError(null);
                                        if (token?.balance &&
                                            (
                                                +sendAmount * (receivers.length) > +token?.balance
                                            )
                                        ) return;
                                        Keyboard.dismiss();
                                        if (!(sendAmount && +sendAmount > 0)) return
                                        sentToBottomSheetModalRef.current?.present();
                                    }}
                                    disabled={token?.balance
                                        ? (
                                            (+sendAmount * receivers.length) > +token?.balance
                                        )
                                        : false}
                                >

                                    <TextVariant style={[components.urbanist16SemiBoldWhite]}>{t("send")}</TextVariant>
                                </ButtonVariant>
                            )}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeScreen>


            <BottomSheetModal
                ref={sentToBottomSheetModalRef}
                index={0}
                snapPoints={sendToSnapPoints}
                backdropComponent={renderBackdrop}
                onChange={handleSheetChanges}
                enableDismissOnClose
                enablePanDownToClose={true}
                backgroundStyle={[backgrounds.white, borders.roundedTop_20]}
                handleIndicatorStyle={[layout.width40, backgrounds.cream]}
            >
                <BottomSheetView
                    style={[
                        layout.itemsSelfCenter,
                        layout.fullWidth,
                        gutters.paddingHorizontal_14,
                    ]}
                >
                    <View
                        style={[layout.row, layout.itemsCenter, gutters.marginBottom_20]}
                    >
                        <ButtonVariant
                            onPress={() => {
                                sentToBottomSheetModalRef.current?.dismiss();
                            }}
                        >
                            <ImageVariant
                                source={Images.arrowLeft}
                                sourceDark={ImagesDark.arrowLeft}
                                style={[components.iconSize20, gutters.marginRight_10]}
                            />
                        </ButtonVariant>
                        <TextVariant style={[components.urbanist20BoldBlack]}>
                            {t("confirmation")}
                        </TextVariant>
                    </View>

                    <TextVariant
                        style={[
                            components.textCenter,
                            components.urbanist14MediumcancelText,
                        ]}
                    >
                        {t("youWillSend")}
                    </TextVariant>
                    <View style={[layout.itemsSelfCenter, layout.row]}>
                        <TextVariant
                            style={[
                                components.textCenter,
                                components.urbanist48RegularBlack,
                                gutters.marginRight_4,
                            ]}
                        >
                            {sendAmount}
                        </TextVariant>
                        <TextVariant
                            style={[
                                components.textCenter,
                                components.urbanist24RegularBlack,
                                layout.alignSelfItemsEnd,
                                gutters.marginBottom_8,
                            ]}
                        >
                            {token?.symbol}
                        </TextVariant>
                    </View>

                    <View style={[gutters.marginVertical_10]}>
                        <View
                            style={[
                                layout.row,
                                layout.justifyBetween,
                                gutters.padding_14,
                                components.borderTopLeftRadius14,
                                components.borderTopRightRadius14,
                                backgrounds.messageInputBackground,
                            ]}
                        >
                            <View style={[layout.fullWidth, gutters.gap_10]}>
                                {receivers.map((user: any, index: number) => (
                                    <View style={[layout.row, layout.justifyBetween]}>
                                        <TextVariant style={[components.urbanist14RegularcancelText]}>
                                            {t("to")}
                                        </TextVariant>
                                        {user.address ? (
                                            <TextVariant style={[components.urbanist14RegularBlack]}>
                                                {shortenAddress(user.address)}
                                            </TextVariant>
                                        ) : (
                                            <SkeletonPlaceholder>
                                                <SkeletonPlaceholder.Item width={100} height={10} />
                                            </SkeletonPlaceholder>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                        <View
                            style={[
                                layout.row,
                                layout.justifyBetween,
                                gutters.padding_14,
                                components.borderBottomLeftRadius14,
                                components.borderBottomRightRadius14,
                                backgrounds.messageInputBackground,
                            ]}
                        >
                            <TextVariant style={[components.urbanist14RegularcancelText]}>
                                {t("networkFee")}
                            </TextVariant>
                            {true ? (
                                <TextVariant style={[components.urbanist14RegularBlack]}>
                                    {networkFee} {t("sol")}
                                </TextVariant>
                            ) : (
                                <SkeletonPlaceholder >
                                    <SkeletonPlaceholder.Item width={100} height={10} />
                                </SkeletonPlaceholder>
                            )}

                        </View>
                    </View>

                    <ButtonVariant
                        style={[
                            components.blueBackgroundButton,
                            layout.itemsCenter,
                            gutters.padding_16,
                            gutters.marginTop_20,
                        ]}
                        onPress={handleSendToken}
                    >
                        <TextVariant style={[components.urbanist16SemiBoldWhite]}>
                            {(isLoading) ? <LottieView
                                source={require('@/theme/assets/lottie/loading.json')}
                                style={{ height: 20, width: 20 }}
                                autoPlay
                                loop
                            /> : t("send")}
                        </TextVariant>
                    </ButtonVariant>
                    {transactionError && (
                        <TextVariant style={[components.urbanist14RegularBlack, { color: colors.error, marginTop: 10, textAlign: 'center' }]}>
                            {transactionError}
                        </TextVariant>
                    )}
                    <ButtonVariant
                        style={[
                            layout.itemsCenter,
                            gutters.padding_16,
                            gutters.marginTop_20,
                        ]}
                        onPress={() => {
                            sentToBottomSheetModalRef.current?.dismiss();
                        }}
                    >
                        <TextVariant style={[components.urbanist14MediumcancelText]}>
                            {t("cancel")}
                        </TextVariant>
                    </ButtonVariant>
                    <View style={[layout.height30]} />
                </BottomSheetView>
            </BottomSheetModal>

            <BottomSheetModal
                ref={insufficientBalanceModalRef}
                index={2}
                snapPoints={insufficientBalanceToSnapPoints}
                backdropComponent={renderBackdrop}
                onChange={handleSheetChanges}
                enableDismissOnClose
                enablePanDownToClose={true}
                backgroundStyle={[backgrounds.white, borders.roundedTop_20]}
                handleIndicatorStyle={[layout.width40, backgrounds.cream]}
            >
                <BottomSheetView
                    style={[
                        layout.itemsSelfCenter,
                        layout.fullWidth,
                        gutters.paddingHorizontal_14,
                    ]}
                >
                    <View
                        style={[layout.row, layout.itemsCenter, gutters.marginBottom_20]}
                    >
                        <ButtonVariant
                            onPress={() => {
                                sentToBottomSheetModalRef.current?.dismiss();
                            }}
                        >
                            <ImageVariant
                                source={Images.arrowLeft}
                                sourceDark={ImagesDark.arrowLeft}
                                style={[components.iconSize20, gutters.marginRight_10]}
                            />
                        </ButtonVariant>
                        <TextVariant style={[components.urbanist20BoldBlack]}>
                            {t("insufficientBalance")}
                        </TextVariant>
                    </View>

                    <View style={[layout.itemsSelfCenter, layout.row, gutters.marginBottom_18]}>
                        <TextVariant
                            style={[
                                components.textCenter,
                                components.urbanist14RegularBlack,
                                gutters.marginRight_4,
                            ]}
                        >
                            {t("insufficientBalanceDescription")}
                        </TextVariant>

                    </View>

                    <View style={[layout.itemsSelfCenter, layout.row, layout.fullWidth, gutters.marginBottom_18, layout.itemsCenter, layout.justifyCenter]}>
                        <TextVariant
                            style={[
                                components.textCenter,
                                components.urbanist48RegularBlack,
                                gutters.marginRight_4,
                                { color: colors.error }
                            ]}
                        >
                            {sendAmount}
                        </TextVariant>
                        <TextVariant
                            style={[
                                components.textCenter,
                                components.urbanist24RegularBlack,
                                layout.alignSelfItemsEnd,
                                gutters.marginBottom_8,
                                { color: colors.error }
                            ]}
                        >
                            {token?.symbol}
                        </TextVariant>
                    </View>

                    <ButtonVariant
                        style={[components.blueBackgroundButton, layout.itemsCenter, gutters.padding_14, gutters.marginBottom_8]}
                        onPress={() => {
                            insufficientBalanceModalRef.current?.dismiss();
                        }}
                    >
                        <TextVariant style={[components.urbanist16SemiBoldWhite]}>
                            {t("close")}
                        </TextVariant>
                    </ButtonVariant>
                    <View style={[layout.height30]} />
                </BottomSheetView>
            </BottomSheetModal >
        </>
    );
};



export default React.memo(EnterAmount);
