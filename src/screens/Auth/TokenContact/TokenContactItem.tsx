import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { Images, useTheme } from '@/theme';
import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { GroupDetailsSpace, StartupSpace, User } from '@/types';
import { getInitials, getRandomColor } from '@/utils';
import { RootState } from '@/store';
import { WAPAL_MEDIA_CACHE } from '@/config';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import FastImage from '@d11/react-native-fast-image';
import { ChatsModel } from '@/database';
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser';

interface TokenContactItemProps {
    item: ChatsModel;
    selectedUsers: StartupSpace.ParticipantDetail[];
    setSelectedUsers: any
}

/**
 * @author Nitesh Raj Khanal
 * @function @TokenContactItem
 * @returns JSX.Element
 **/

const TokenContactItem: React.FC<TokenContactItemProps> = ({ item, selectedUsers, setSelectedUsers }): JSX.Element => {
    const { layout, gutters, components, borders, backgrounds } = useTheme();
    const { t } = useTranslation(["translations"]);

    const { data: currentUser } = useFetchLatestUserQuery();

    const { backgroundColor } = React.useMemo(() => getRandomColor(), [item]);

    const handleSelectUser = useCallback((user: StartupSpace.ParticipantDetail) => {
        setSelectedUsers((prevSelected: StartupSpace.ParticipantDetail[]) => {
            if (prevSelected.some((selectedUser) => selectedUser.id === user.id)) {
                return prevSelected.filter((selectedUser) => selectedUser.id !== user.id);
            } else {
                return [...prevSelected, { ...user }];
            }
        });
    }, []);

    // const otherParticipant = item.participants?.find((participant) => participant.id !== currentUser?.id)
    // const isSelected = selectedUsers.some((selectedUser: StartupSpace.ParticipantDetail) => otherParticipant && selectedUser.id === otherParticipant.id);

    return (
        <></>
        //     <ButtonVariant
        //         style={[layout.row, layout.itemsCenter, layout.justifyBetween]}
        //         onPress={() => otherParticipant && handleSelectUser(otherParticipant)}
        //     >
        //     <View style={[layout.row, layout.itemsCenter, gutters.paddingVertical_10]}>
        //         <View style={[layout.relative]}>
        //             {otherParticipant?.profilePicture ? (
        //                 <FastImage
        //                     source={{ uri: otherParticipant?.profilePicture }}
        //                     style={[components.imageSize48, borders.rounded_500, gutters.marginRight_14]}
        //                 />
        //             ) : (
        //                 <View
        //                     style={[components.imageSize48, gutters.marginRight_14, borders.rounded_500, { backgroundColor: backgroundColor }, layout.itemsCenter, layout.justifyCenter]}
        //                 >
        //                     <TextVariant style={[components.urbanist18BoldWhite]}>
        //                         {getInitials((item.groupName || otherParticipant?.fullName) as string)}
        //                     </TextVariant>
        //                 </View>
        //             )
        //             }
        //         </View>
        //         <View>
        //             <TextVariant style={[components.urbanist16SemiBoldDark]}>{item.groupName || otherParticipant?.fullName}</TextVariant>
        //             <TextVariant style={[components.urbanist14RegularcodeDark]}>{t("lastSeen")+" recently"}</TextVariant>
        //         </View>
        //     </View>

        //     <ImageVariant
        //         source={isSelected ? Images.checkContact : Images.uncheckedContact}
        //         sourceDark={isSelected ? Images.checkContact : Images.uncheckedContact}
        //         style={[components.iconSize24,]}
        //     />
        // </ButtonVariant>
    );
};

export default React.memo(TokenContactItem);
