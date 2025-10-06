import React, { FC } from 'react';
import { ButtonVariant, ImageVariant } from '@/components/atoms';
import { Images, ImagesDark, useTheme } from '@/theme';
import { isImageSourcePropType } from '@/types';
import { useTranslation } from 'react-i18next';
import { TextInput, View, StyleProp, ViewStyle, Platform } from 'react-native';

interface IProps {
    searchQuery: string;
    onChangeSearchQuery: (text: string) => void;
    placeholder: string;
    style?: StyleProp<ViewStyle>;
    onFocus?: () => void;
}

/**
 * @author Nitesh Raj Khanal
 * @function @SearchBar
 **/

const SearchBar: FC<IProps> = ({ onChangeSearchQuery, searchQuery, placeholder, style, onFocus, ...rest }) => {
    const { t } = useTranslation(["translations"]);
    const { layout, components, gutters, borders, colors } = useTheme();

    if (!isImageSourcePropType(Images.search) || !isImageSourcePropType(ImagesDark.search)) {
        throw new Error("Image source is not valid");
    }

    return (
        <View
            style={[
                layout.row,
                layout.justifyBetween,
                layout.itemsCenter,
                borders.w_1,
                borders.tertiary,
                borders.rounded_8,
                Platform.OS === "ios" ? gutters.padding_14 : gutters.padding_8,
                style,
                { ...rest }
            ]}
        >
            <TextInput
                autoCapitalize="none"
                returnKeyLabel="Done"
                returnKeyType="done"
                style={[components.urbanist14RegularBlack, layout.flex_1]}
                placeholderTextColor={colors.textInputPlaceholder}
                keyboardAppearance="light"
                placeholder={placeholder}
                value={searchQuery}
                onChangeText={onChangeSearchQuery}
                onFocus={onFocus}
            />
            <View pointerEvents="none">

                <ImageVariant
                    source={Images.search}
                    sourceDark={ImagesDark.search}
                    style={[components.iconSize20]}
                />
            </View>
        </View>
    );
};

export default React.memo(SearchBar);
