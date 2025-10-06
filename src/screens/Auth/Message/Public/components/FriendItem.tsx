import { ButtonVariant, TextVariant } from "@/components/atoms";
import { useTheme } from "@/theme";
import { GroupDetailsSpace, SafeScreenNavigationProp } from "@/types";
import { getInitials } from "@/utils";
import FastImage from "@d11/react-native-fast-image";
import React, { FC } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { z } from 'zod';

interface GroupDetail {
    membersCount: number;
    chatId: string;
    name: string;
    profilePicture?: string;
    backgroundColor?: string;
    type: string;
}

interface FriendItemProps {
    item: GroupDetailsSpace.ChatParticipant;
    chatId: string;
    openSendSOLSlider: () => void;
    closeParticipantsSiider: () => void;
    navigation: SafeScreenNavigationProp;
    groupDetail: GroupDetail
}



const FriendItem: FC<FriendItemProps> = React.memo(
    ({ item, navigation, chatId, groupDetail, closeParticipantsSiider }) => {
        const { components, gutters, layout, borders } = useTheme();
        const { t } = useTranslation(['translations']);
        return (
            <ButtonVariant
                style={[
                    gutters.marginRight_16,
                    layout.row,
                    layout.itemsCenter,
                    layout.justifyBetween,
                    gutters.paddingVertical_12,
                ]}
                onPress={() => {
                    closeParticipantsSiider();
                    navigation.navigate('PortfolioScreen', {
                        chatId,
                        type: 'group',
                        receivers: [{
                            ...item,
                            chatId: chatId
                        }],
                        groupDetail
                    });
                }}>
                <View style={[layout.row, layout.itemsCenter, layout.justifyBetween]}>
                    {(item.profilePicture && item.profilePicture != "" && z.string().url().safeParse(item.profilePicture).success) ? (
                        <FastImage
                            source={{
                                uri: item.profilePicture,
                            }}
                            style={[components.imageSize48,
                            gutters.marginRight_10,
                            borders.rounded_500,]}
                        />
                    ) : (
                        <View
                            style={[
                                components.imageSize48,
                                borders.rounded_500,
                                { backgroundColor: item.backgroundColor },
                                layout.itemsCenter,
                                gutters.marginRight_10,

                                layout.justifyCenter,
                            ]}>
                            <TextVariant style={[components.urbanist18BoldWhite]}>
                                {getInitials(item.fullName as string)}
                            </TextVariant>
                        </View>
                    )}

                    <TextVariant
                        style={[
                            components.textCenter,
                            components.urbanist16messageSender,
                            gutters.marginTop_4,
                        ]}>
                        {item.username}
                    </TextVariant>
                </View>
                <ButtonVariant>
                    <TextVariant>{t('moreIcon')}</TextVariant>
                </ButtonVariant>
            </ButtonVariant>
        );
    },
);

export default React.memo(FriendItem);