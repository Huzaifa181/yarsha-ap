import React, { FC } from 'react';
import { ImageSourcePropType, View } from 'react-native';
import { ImageVariant, TextVariant } from '@/components/atoms';
import { useTheme } from '@/theme';
import { isImageSourcePropType } from '@/types';

export interface LinkItemProps {
    image: ImageSourcePropType;
    name: string;
    url: string;
}

/**
 * @author @neeteshraj
 * @function LinkItem
 * @returns JSX.Element
 */

const LinkItem: FC<LinkItemProps> = ({ image, name, url }) => {
    const { components, layout, gutters } = useTheme();

    if (!isImageSourcePropType(image)) {
        throw new Error("Image source is not valid")
    }

    return (
        <View style={[layout.row, layout.itemsCenter, gutters.marginVertical_10]}>
            <ImageVariant
                source={image}
                sourceDark={image}
                style={[components.imageSize56, gutters.marginRight_10]}
            />
            <View style={[layout.flex_1]}>
                <TextVariant style={[components.urbanist16SemiBoldDark]}>{name}</TextVariant>
                <TextVariant style={[components.urbanist12RegularBlack]}>{url}</TextVariant>
            </View>
        </View>
    );
};

export default React.memo(LinkItem);
