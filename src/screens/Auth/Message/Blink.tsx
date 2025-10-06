import { ActivityIndicator, Alert, View } from "react-native";
import { Blink } from "@dialectlabs/blinks-react-native";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, VersionedMessage, VersionedTransaction, sendAndConfirmRawTransaction } from "@solana/web3.js";
import { ActionAdapter, BlockchainIds } from "@dialectlabs/blinks";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addWWWIfMissing } from "@/utils/blinks";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';

import { useSelector } from "@/hooks";
import { RootState } from "@/store";
import { Images, ImagesDark, useTheme } from "@/theme";
import { ButtonVariant, ImageVariant, TextVariant } from "@/components/atoms";
import { useTranslation } from "react-i18next";
import LottieView from "lottie-react-native";
import { heightPercentToDp } from "@/utils";
import { BottomSheetDefaultBackdropProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types";
import { useAction } from "@/hooks/useBlinkAction";
import { truncateAddress } from "@/utils/address";
import NetInfo from '@react-native-community/netinfo';
import { RPC_URL } from "@/config";


const BlinkPreview: React.FC<{ url: string, handleSendMessage: any, message: any, chatId: string, id?: string, name?: string, title?: string }> = ({ url, handleSendMessage, chatId, message, id, name, title }) => {
    const { layout, backgrounds, gutters, components, borders, colors } = useTheme();
    const { t } = useTranslation(["translations"]);
    const [requiredSOL, setRequiredSOL] = useState(0);
    const [networkFee, setNetworkFee] = useState(0);
    const [isOnline, setIsOnline] = useState(false);

    const [receiverAddress, setReceiverAddress] = useState("0");
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const insufficientBalanceModalRef = useRef<BottomSheetModal>(null);

    const bottomSheetSnapPoints = useMemo(
        () => [heightPercentToDp("55"), heightPercentToDp("55")],
        []
    );
    const insufficientBalanceToSnapPoints = useMemo(
        () => [heightPercentToDp("30"), heightPercentToDp("30")],
        []
    );

    const [txData, setTxData] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const openInsufficientBalanceBottomSheet = () => {
        insufficientBalanceModalRef.current?.present()
    }

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state: any) => {
            setIsOnline(state.isConnected);
        });

        return () => unsubscribe(); // Cleanup the listener on unmount
    }, []);

    const connection = useMemo(() => {
        if (isOnline) {
            return new Connection(RPC_URL);
        } else {
            console.log("Device offline, connection not created.");
            return null;
        }
    }, [isOnline]);

    const getWalletAdapter = useCallback((publicKey: string): ActionAdapter => {
        return {
            connect: async (_context) => {
                bottomSheetRef.current?.present();
                return publicKey;
            },

            signTransaction: async (_tx, _context) => {
                setTxData(_tx);
                if (connection) {
                    const bufferTx = Buffer.from(_tx, 'base64');
                    let versionedTransaction = VersionedTransaction.deserialize(bufferTx);
                    const { blockhash } = await connection.getLatestBlockhash();

                    const message = VersionedMessage.deserialize(versionedTransaction.message.serialize());
                    message.recentBlockhash = blockhash;
                    const feeCalculator = await connection.getFeeForMessage(message);
                    if (feeCalculator && feeCalculator?.value) {
                        const feeInSOL = feeCalculator?.value / 1e9;
                        setNetworkFee(feeInSOL)
                    }
                    const instructions = message.compiledInstructions;
                    const simulationResult = await connection.simulateTransaction(versionedTransaction);
                    if (simulationResult.value.logs) {
                        const parsedMessage = parseTransactionLogs(simulationResult.value.logs);
                        if (parsedMessage?.requiredSOL) {
                            setRequiredSOL(parsedMessage?.requiredSOL);
                            bottomSheetRef.current?.dismiss();
                            openInsufficientBalanceBottomSheet();
                            return { error: "awaiting_sign" };
                        }
                    }
                    for (const instruction of instructions) {
                        const programId = message.staticAccountKeys[instruction.programIdIndex].toBase58();
                        if (programId === SystemProgram.programId.toBase58()) {
                            if (instruction.data[0] === 2) {
                                const lamportsData = instruction.data.slice(1, 9);

                                const lamports = lamportsData.reduce((acc, byte, index) => acc + BigInt(byte) * (BigInt(256) ** BigInt(index)), BigInt(0));

                                const LAMPORTS_PER_SOL_BIGINT = BigInt(1e9);
                                const sendAmountSOL = Number(lamports / LAMPORTS_PER_SOL_BIGINT);

                                const receiverPubkey = message.staticAccountKeys[instruction.accountKeyIndexes[1]].toBase58();
                                setReceiverAddress(receiverPubkey);
                                // Alert.alert(`Sender: ${senderPubkey}, Receiver: ${receiverPubkey}, Amount: ${sendAmountSOL} SOL`);
                            } else {
                                console.log("Not a SOL transfer instruction");
                            }
                        } else {
                            console.log("Not a SystemProgram instruction");
                        }
                    }

                }

                return { error: "awaiting_sign" };
            },

            confirmTransaction: async (_signature, _context) => {
                // console.log("signature_", _signature)
                // handleSendMessage({
                //     content: `Succussfully bought the blink`, data: {
                //         transactionId: _signature,
                //     },
                //     messageType: "blinkTransfered"
                // });
                // console.log("confirmTransaction", _signature);
            },
            metadata: {
                supportedBlockchainIds: [
                    BlockchainIds.SOLANA_DEVNET,
                    BlockchainIds.SOLANA_TESTNET,
                    BlockchainIds.SOLANA_MAINNET,
                    BlockchainIds.ETHEREUM_MAINNET,
                ],
            },
        };
    }, [connection]);



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

    const adapter = useMemo(
        () => getWalletAdapter(""),
        [getWalletAdapter]
    );
    const { action } = useAction({ url: addWWWIfMissing(url), adapter, chatId, message });
    if (!action) {
        return <ActivityIndicator />;
    }

    const actionUrl = new URL(url);

    const handleBuyBlink = async () => {

        if (!txData) {
            // Alert.alert("Transaction data not available");
            return;
        }
        // if (!keyPair || !keyPair.publicKey) {
        //     Alert.alert("Please wait, your wallet is initializing")
        //     return { signature: "unknown" }
        // }
        setIsLoading(true);

        try {
            // const bufferTx = Buffer.from(txData, 'base64');
            // let versionedTransaction = VersionedTransaction.deserialize(bufferTx);
            // const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

            // const message = VersionedMessage.deserialize(versionedTransaction.message.serialize());
            // message.recentBlockhash = blockhash;
            // versionedTransaction = new VersionedTransaction(message);
            // if (keyPair) {
            //     versionedTransaction.sign([keyPair]);

            //     const serializedTx = versionedTransaction.serialize();
            //     const bufferTx = Buffer.from(serializedTx);
            //     const signature = await sendAndConfirmRawTransaction(connection, bufferTx);

            //     console.log("Transaction signed with signature:", signature);
            //     if(userInfo?.user){

            //         handleSendMessage({
            //             content: "", data: {
            //                 transactionId: signature,
            //                 buyerAddress: userInfo.user.address,
            //                 buyerId: userInfo.user.id,
            //                 buyerName: userInfo.user.username,
            //                 blinkId: id ,
            //                 blinkName: name ,
            //                 blinkTitle: title ,
            //             },
            //             messageType: "blinkTransfered"
            //         });
            //     }
            //     bottomSheetRef.current?.dismiss();
            const buyBlinkPayload = {
                txData
            }
            console.log("buyBlinkPayload", buyBlinkPayload)

            //  if(userInfo) handleSendMessage({
            //     content: "", data: {
            //         transactionId: buyBlinkResponse?.signature ,
            //         buyerAddress: userInfo?.address,
            //         buyerId: userInfo.id,
            //         buyerName: userInfo.username,
            //         blinkId: id ,
            //         blinkName: name ,
            //         blinkTitle: title ,
            //     },
            //     messageType: "blinkTransfered"
            // });
            bottomSheetRef.current?.dismiss()
            return { signature: "" };


        } catch (error: any) {
            console.error("error Error during transaction signing:", error.message);
            Alert.alert("Transaction failed");

            throw error;
        } finally {
            setIsLoading(false);
        }
    }

    function parseTransactionLogs(logs: any) {
        const insufficientBalanceRegex = /insufficient lamports (\d+), need (\d+)/;
        let parsedMessage = { description: "Transaction failed.", details: "Unknown error.", requiredSOL: 0, availableSOL: 0 };

        logs.forEach((log: any) => {
            const match = log.match(insufficientBalanceRegex);
            if (match) {
                const availableLamports = parseInt(match[1]);
                const requiredLamports = parseInt(match[2]);

                // Convert lamports to SOL
                const availableSOL = availableLamports / 1e9;
                const requiredSOL = requiredLamports / 1e9;
                const additionalSOL = (requiredSOL - availableSOL).toFixed(6);

                parsedMessage = {
                    description: "You don't have enough balance.",
                    details: `You tried to send ${requiredSOL.toFixed(6)} SOL but only have ${availableSOL.toFixed(6)} SOL available. You need an additional ${additionalSOL} SOL.`,
                    requiredSOL: requiredSOL,
                    availableSOL: availableSOL,
                };
            }
        });

        return parsedMessage;
    }

    return (
        <React.Fragment>
            <Blink
                theme={{
                    "--blink-button": "#184BFF",
                    "--blink-border-radius-rounded-button": 8,
                    '--blink-text-link': colors.dark,
                }}
                action={action}
                websiteUrl={actionUrl.href}
                websiteText={actionUrl.hostname}
                callbacks={{
                    onActionMount: () => {
                    },
                }}
            />
            <BottomSheetModal
                ref={bottomSheetRef}
                index={0}
                snapPoints={bottomSheetSnapPoints}
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
                                bottomSheetRef.current?.dismiss();
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

                    <View style={[gutters.marginVertical_10]}>

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
                                {t("youWillSend")}
                            </TextVariant>
                            <TextVariant style={[components.urbanist14RegularBlack]}>
                                0.000015 {t("sol")}
                            </TextVariant>
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
                                {t("youWillReceive")}
                            </TextVariant>
                            <TextVariant style={[components.urbanist14RegularBlack]}>
                                0.000015 {t("sol")}
                            </TextVariant>
                        </View>
                    </View>
                    <View style={[gutters.marginVertical_10]}>

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
                                {t("to")}
                            </TextVariant>
                            <TextVariant style={[components.urbanist14RegularBlack]}>
                                {truncateAddress(receiverAddress)}
                            </TextVariant>
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
                            <TextVariant style={[components.urbanist14RegularBlack]}>
                                {networkFee} {t("sol")}
                            </TextVariant>
                        </View>
                    </View>

                    <ButtonVariant
                        style={[
                            components.blueBackgroundButton,
                            layout.itemsCenter,
                            gutters.padding_16,
                            gutters.marginTop_20,
                        ]}
                        onPress={handleBuyBlink}
                    >
                        <TextVariant style={[components.urbanist16SemiBoldWhite]}>
                            {(isLoading) ? <LottieView
                                source={require('@/theme/assets/lottie/loading.json')}
                                style={{ height: 20, width: 20 }}
                                autoPlay
                                loop
                            /> : t("confirm")}
                        </TextVariant>
                    </ButtonVariant>
                    <ButtonVariant
                        style={[
                            layout.itemsCenter,
                            gutters.padding_16,
                            gutters.marginTop_20,
                        ]}
                        onPress={() => {
                            bottomSheetRef.current?.dismiss();
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
                index={0}
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
                                bottomSheetRef.current?.dismiss();
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

                    <View style={[layout.itemsSelfCenter, layout.row, layout.width100px, gutters.marginBottom_18]}>
                        <TextVariant
                            style={[
                                components.textCenter,
                                components.urbanist48RegularBlack,
                                gutters.marginRight_4,
                                { color: colors.error }
                            ]}
                        >
                            {requiredSOL}
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
                            {t("sol")}
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
        </React.Fragment>
    );
};

export default BlinkPreview;
