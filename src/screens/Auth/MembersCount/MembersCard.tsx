import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { Images, ImagesDark, useTheme } from '@/theme';
import { isImageSourcePropType } from '@/types';
import { getInitials } from '@/utils';
import FastImage from '@d11/react-native-fast-image';
import React, { FC } from 'react';
import { View } from 'react-native';

interface IProps {
    item: {
        profilePicture: string;
        role: string;
        username: string;
        id: string;
        fullName: string;
        backgroundColor: string;
    }
    toggleSheet: (member: {
        profilePicture: string;
        role: string;
        username: string;
        id: string;
        fullName: string;
        backgroundColor: string;
    }) => void;
}

/**
* @author Nitesh Raj Khanal
* @function @MembersCard
**/

const MembersCard: FC<IProps> = ({ item, toggleSheet }) => {

    const { gutters, layout, components, borders } = useTheme();

    if (!isImageSourcePropType(Images.admin) || !isImageSourcePropType(ImagesDark.admin) || !isImageSourcePropType(Images.options) || !isImageSourcePropType(ImagesDark.options)) {
        throw new Error('Image source is not valid');
    }

    return (
        <>
            <ButtonVariant disabled={item.role === "creator"} onPress={() => toggleSheet(item)} style={[gutters.padding_14, layout.row, layout.itemsCenter, layout.justifyBetween]}>
                {item.profilePicture ? (
                    <View>
                        <FastImage source={{ uri: item.profilePicture }} style={[components.imageSize48, borders.rounded_500]} />
                        {(item.role === "creator") ? <View style={[layout.absolute, layout.right0, layout.bottom0]}>
                            <ImageVariant
                                source={Images.admin}
                                sourceDark={ImagesDark.admin}
                                style={[components.iconSize24]}
                            />
                        </View> : null}
                    </View>
                ) : (
                    <View>
                        <View
                            style={[
                                components.imageSize48,
                                borders.rounded_500,
                                { backgroundColor: item.backgroundColor },
                                layout.itemsCenter,
                                layout.justifyCenter,
                            ]}
                        >
                            <TextVariant style={[components.urbanist18BoldWhite, components.textCenter]}>
                                {getInitials(item?.username as string)}
                            </TextVariant>
                        </View>
                    </View>
                )}
                <View style={[layout.flex_1, gutters.marginLeft_14]}>
                    <TextVariant style={[components.urbanist16BoldDark]}>{item.fullName}</TextVariant>
                    <TextVariant style={[components.urbanist16RegularDark]}>{item.role === "admin" ? "Admin" : item.role === "creator" ? "Creator" : "Member"}</TextVariant>
                </View>
                <ButtonVariant disabled={item.role === "creator"} onPress={() => toggleSheet(item)} style={[layout.height40, layout.width40, layout.itemsCenter, layout.justifyCenter]}>
                    <ImageVariant
                        source={Images.options}
                        sourceDark={ImagesDark.options}
                        style={[components.iconSize20]}
                    />
                </ButtonVariant>
            </ButtonVariant>
        </>
    )
}

export default React.memo(MembersCard)