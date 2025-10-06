import { ButtonVariant, TextVariant } from "@/components/atoms";
import { useTheme } from "@/theme";
import { GroupDetailsSpace, SafeScreenNavigationProp } from "@/types";
import { getInitials } from "@/utils";
import FastImage from "@d11/react-native-fast-image";
import React, { FC } from "react";
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

interface UserItemProps {
  item: GroupDetailsSpace.ChatParticipant;
  chatId: string;
  openSendSOLSlider: () => void;
  closeParticipantsSiider: () => void;
  navigation: SafeScreenNavigationProp;
  groupDetail: GroupDetail
}

const RecentUserItem: FC<UserItemProps> = React.memo(
  ({ item, chatId, navigation, groupDetail, closeParticipantsSiider }) => {
    const { components, gutters, layout, borders } = useTheme();
    return (
      <ButtonVariant
        style={[gutters.marginRight_16, layout.itemsCenter]}
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
            components.urbanist10SemiboldLightText,
            gutters.marginTop_4,
          ]}>
          {item.username}
        </TextVariant>
      </ButtonVariant>
    );
  },
);

export default React.memo(RecentUserItem);