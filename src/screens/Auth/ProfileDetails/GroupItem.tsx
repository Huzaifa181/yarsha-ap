import React, { FC, useMemo } from 'react';
import { View } from 'react-native';
import { ImageVariant, TextVariant } from '@/components/atoms';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';
import { WAPAL_MEDIA_CACHE } from '@/config';
import { getInitials, getRandomColor } from '@/utils';
import FastImage from '@d11/react-native-fast-image';

export interface GroupItemProps {
    groupImage: string;
    groupName: string;
    membersCount: number;
    chatId: string;
}

/**
 * @author @neeteshraj
 * @function GroupItem
 * @returns JSX.Element
 */

const GroupItem: FC<GroupItemProps> = ({ groupImage, groupName, membersCount }): JSX.Element => {
    const { components, layout, gutters, borders } = useTheme();

    const { t } = useTranslation(["translations"])

    const { backgroundColor } = useMemo(() => getRandomColor(), []);
    return (
        <View style={[layout.row, layout.itemsCenter, gutters.marginVertical_10]}
        >
           {groupImage? <FastImage
                source={{ uri: groupImage }}
                style={[components.imageSize56, gutters.marginRight_10, borders.rounded_500]}
            />:( <View
                style={[
                    components.imageSize56,
                    gutters.marginRight_10,
                    borders.rounded_500,
                    { backgroundColor },
                    layout.itemsCenter,
                    layout.justifyCenter,
                ]}
            >
                <TextVariant style={[components.urbanist18BoldWhite]}>
                    {getInitials(groupName)}
                </TextVariant>
            </View>)}
            <View>
                <TextVariant style={[components.urbanist16SemiBoldDark]}>{groupName}</TextVariant>
                <TextVariant style={[components.urbanist16RegulartextInputPlaceholder]}>
                    {membersCount} {t("members")}
                </TextVariant>
            </View>
        </View>
    );
};

export default React.memo(GroupItem);
