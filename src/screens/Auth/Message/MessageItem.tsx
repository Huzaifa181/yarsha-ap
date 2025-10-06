import React, {FC, memo} from 'react';
import {Linking} from 'react-native';
import {useTranslation} from 'react-i18next';
import {MessageType} from '@/types';

/**
 * @author Nitesh Raj Khanal
 * @function MessageItem
 * @returns JSX.Element
 */

const MessageItem: FC<{
  item: MessageType;
  index: number;
  messages: MessageType[];
  openSentToSlider: (solAmount: string, recipientAddress: string) => void;
  recipientAddress: string;
}> = memo(({item, index, messages, openSentToSlider, recipientAddress}) => {


  const {t} = useTranslation(['translations']);

  const direction = item.senderId === "" ? 'sent' : 'received';

  const isSameSenderAsPrevious =
    index > 0 && messages[index - 1].senderId === item.senderId;
  const isSameSenderAsNext =
    index < messages.length - 1 &&
    messages[index + 1].senderId === item.senderId;

  const borderRadius = {
    borderRadius: 16,
  };

  const borderTopRadius = {
    borderTopStartRadius: 16,
    borderTopEndRadius: 16,
    borderBottomStartRadius: 16,
  };

  const borderBottomRadius = {
    borderBottomStartRadius: 16,
    borderBottomEndRadius: 16,
    borderTopStartRadius: 16,
  };

  const borderTopRadiusReceived = {
    borderTopStartRadius: 16,
    borderTopEndRadius: 16,
    borderBottomEndRadius: 16,
  };

  const borderBottomRadiusReceived = {
    borderBottomStartRadius: 16,
    borderBottomEndRadius: 16,
    borderTopEndRadius: 16,
  };

  let borderStyle = {};

  if (direction === 'sent') {
    if (isSameSenderAsNext && isSameSenderAsPrevious) {
      borderStyle = borderRadius;
    } else if (isSameSenderAsPrevious) {
      borderStyle = borderTopRadius;
    } else if (isSameSenderAsNext) {
      borderStyle = borderBottomRadius;
    } else {
      borderStyle = borderRadius;
    }
  } else if (direction === 'received') {
    if (isSameSenderAsNext && isSameSenderAsPrevious) {
      borderStyle = borderRadius;
    } else if (isSameSenderAsPrevious) {
      borderStyle = borderTopRadiusReceived;
    } else if (isSameSenderAsNext) {
      borderStyle = borderBottomRadiusReceived;
    } else {
      borderStyle = borderRadius;
    }
  }

  const cryptoRequestRegex = /(?:send me|can you send me) (\d+) sol/i;
  const matchTransferSolText = item?.content?.match(cryptoRequestRegex);
  const solAmount = matchTransferSolText ? matchTransferSolText[1] : null;

  const handleOpenExplorer = () => {
    const url = `https://explorer.solana.com/address/${item?.data.transactionId}/tokens?cluster=devnet`;
    Linking.openURL(url);
  };

  return (
    <></>
    // <SafeScreen>
    // < BlinkPreview url={actionUrl} />
    // </SafeScreen >
    // <>
    //     {item?.type === "blink" && item?.data?.actionUrl && (
    //         <View
    //             style={[
    //                 layout.row,
    //                 gutters.paddingHorizontal_10,
    //                 layout.justifyStart,
    //                 gutters.marginVertical_2,
    //                 direction === "sent" ? layout.justifyEnd : layout.justifyStart,
    //             ]}
    //         >
    //             <BlinkPreview url={actionUrl} />
    //         </View>
    //     )}
    //     {matchTransferSolText && (
    //         <View
    //         >
    //             <View
    //                 style={[
    //                     layout.row,
    //                     gutters.paddingHorizontal_10,
    //                     layout.justifyStart,
    //                     gutters.marginVertical_2,
    //                     direction === "sent" ? layout.justifyEnd : layout.justifyStart,
    //                 ]}>

    //                 <View style={[layout.width190px, gutters.paddingHorizontal_10]}>
    //                     <View
    //                         style={[
    //                             backgrounds.receivedMessage,
    //                             gutters.paddingVertical_14,
    //                             borders.roundedTop_8,
    //                         ]}
    //                     >
    //                         <TextVariant
    //                             style={[
    //                                 components.urbanist18BoldPrimary,
    //                                 components.textCenter,
    //                             ]}
    //                         >
    //                             {solAmount} {t("sol")}
    //                         </TextVariant>
    //                     </View>
    //                     <View
    //                         style={[
    //                             backgrounds.white,
    //                             gutters.paddingVertical_14,
    //                             gutters.paddingHorizontal_10,
    //                             borders.roundedBottom_8,
    //                             layout.row,
    //                         ]}
    //                     >
    //                         <ImageVariant
    //                             source={Images.solanaGradient}
    //                             sourceDark={ImagesDark.solanaGradient}
    //                             style={[components.iconSize22, gutters.marginRight_10]}
    //                         />
    //                         <View>
    //                             <TextVariant style={[components.urbanist16SemiBoldDark]}>
    //                                 {t("sendSolana")}
    //                             </TextVariant>
    //                             <TextVariant
    //                                 style={[components.urbanist10RegularmessageSenderText]}
    //                             >
    //                                 {t("balance")} 44.001 SOL
    //                             </TextVariant>
    //                         </View>
    //                     </View>
    //                 </View>
    //                 <ButtonVariant
    //                     style={[
    //                         gutters.paddingHorizontal_4,
    //                         layout.row,
    //                         layout.itemsCenter,
    //                         layout.justifyAround,
    //                         layout.width55px,
    //                         borders.w_1,
    //                         borders.rounded_125,
    //                         gutters.marginTop_10,
    //                         gutters.marginLeft_6,
    //                         gutters.paddingVertical_4,
    //                     ]}
    //                     onPress={() => openSentToSlider(solAmount!, recipientAddress)}
    //                 >
    //                     <TextVariant
    //                         style={[
    //                             components.urbanist10RegularmessageSenderText,
    //                             layout.flex_1,
    //                         ]}
    //                     >
    //                         {t("send")}
    //                     </TextVariant>
    //                     <ImageVariant
    //                         source={Images.arrowRightWithBg}
    //                         sourceDark={ImagesDark.arrowRightWithBg}
    //                         style={[components.iconSize16]}
    //                     />
    //                 </ButtonVariant>
    //             </View>
    //         </View>
    //     )}
    //     {item?.type === "transfer" && (
    //         <View
    //             style={[
    //                 layout.row,
    //                 gutters.paddingHorizontal_10,
    //                 layout.justifyStart,
    //                 gutters.marginVertical_2,
    //                 direction === "sent" ? layout.justifyEnd : layout.justifyStart,
    //             ]}
    //         >
    //             <TouchableOpacity
    //                 onPress={handleOpenExplorer}
    //                 style={{
    //                     borderColor: colors.primary, // Blue border color
    //                     borderWidth: 1,
    //                     borderRadius: 16,
    //                     padding: 4,
    //                     marginTop: 2,
    //                     backgroundColor: "transparent",
    //                     alignSelf: direction === "sent" ? "flex-end" : "flex-start",
    //                     borderTopRightRadius: 5,
    //                     borderTopLeftRadius: 5,
    //                     borderBottomLeftRadius: 5,
    //                 }}
    //             >
    //                 <TextVariant style={{ color: colors.primary, textAlign: "center", fontSize: 12 }}>
    //                     {t("viewOnExplorer")}
    //                 </TextVariant>

    //             </TouchableOpacity>
    //         </View>
    //     )}
    //     <View
    //         style={[
    //             layout.row,
    //             gutters.paddingHorizontal_10,
    //             layout.justifyStart,
    //             gutters.marginVertical_2,
    //             direction === "sent" ? layout.justifyEnd : layout.justifyStart,
    //         ]}
    //     >
    //         <View
    //             style={[
    //                 backgrounds.primary,
    //                 gutters.padding_14,
    //                 borderStyle,
    //                 direction === "received" && backgrounds.receivedMessage,
    //             ]}
    //         >
    //             <TextVariant
    //                 style={[
    //                     direction === "received"
    //                         ? components.urbanist14RegularBlack
    //                         : components.urbanist14RegularWhite,
    //                 ]}
    //             >
    //                 {item?.type == "transfer" && direction == "received" ? item.data?.receiverContent : item.content}
    //             </TextVariant>
    //         </View>
    //     </View>

    // </>
  );
});

export default React.memo(MessageItem);
