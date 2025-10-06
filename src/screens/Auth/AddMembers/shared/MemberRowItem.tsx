import React from 'react';
import { View } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { ButtonVariant, TextVariant } from '@/components/atoms';
import { getInitials } from '@/utils';
import { useTheme } from '@/theme';
import { useNavigation } from '@react-navigation/native';
import { SafeScreenNavigationProp } from '@/types';

type Participant = {
    id: string;
    fullName: string;
    role: 'member' | 'admin' | 'creator';
    profilePicture: string;
    backgroundColor: string;
    status: 'online' | 'offline';
};

interface Props {
    participant: Participant;
    groupId: string;
}

const MemberRowItem: React.FC<Props> = ({ participant, groupId }) => {
    const { layout, gutters, borders, components } = useTheme();
    const { t } = useTranslation('translations');

    const navigation = useNavigation<SafeScreenNavigationProp>()

    const hasValidImage = participant.profilePicture &&
        z.string().url().safeParse(participant.profilePicture).success;

    const navigateAction = () => {
        navigation.navigate('AddAdminConfirmation', {
            fullName: participant.fullName,
            backgroundColor: participant.backgroundColor,
            id: participant.id,
            profilePicture: participant.profilePicture,
            role: participant.role,
            status: participant.status,
            groupId: groupId,
        });
    }

    return (
        <ButtonVariant onPress={navigateAction} style={[layout.row, layout.justifyStart, layout.itemsCenter, gutters.marginBottom_12]}>
            {hasValidImage ? (
                <FastImage
                    source={{ uri: participant.profilePicture }}
                    style={[components.imageSize48, gutters.marginRight_12, borders.rounded_500]}
                />
            ) : (
                <View
                    style={[
                        components.imageSize48,
                        gutters.marginRight_6,
                        borders.rounded_500,
                        { backgroundColor: participant.backgroundColor },
                        layout.itemsCenter,
                        layout.justifyCenter,
                    ]}
                >
                    <TextVariant style={components.urbanist24BoldWhite}>
                        {getInitials(participant.fullName || '')}
                    </TextVariant>
                </View>
            )}

            <View>
                <TextVariant style={components.urbanist14SemiBoldBlack}>
                    {participant.fullName}
                </TextVariant>
                <TextVariant style={components.urbanist14RegularSecondary}>
                    {participant.role === 'member' ? t('member') : t('admin')}
                </TextVariant>
            </View>
        </ButtonVariant>
    );
};

export default React.memo(MemberRowItem);
