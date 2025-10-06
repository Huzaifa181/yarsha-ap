import { Images, ImagesDark, useTheme } from '@/theme';
import { isImageSourcePropType } from '@/types';
import React, { forwardRef, useState, useCallback } from 'react';
import { Platform, TextInput, TextInputProps, View } from 'react-native';
import ImageVariant from '../ImageVariant/ImageVariant';
import ButtonVariant from '../ButtonVariant/ButtonVariant';

interface IProps extends TextInputProps {
    error?: boolean;
}

/**
 * @author Nitesh Raj Khanal
 * @function InputVariant
 */

const InputVariant = forwardRef<TextInput, IProps>(({ secureTextEntry, error = false, ...props }, ref) => {
    const { layout, components, borders, gutters, colors } = useTheme();
    const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);

    if (!isImageSourcePropType(Images.eye) || !isImageSourcePropType(ImagesDark.eye) ||
        !isImageSourcePropType(Images.eyeOff) || !isImageSourcePropType(ImagesDark.eyeOff)) {
        throw new Error("Image source is not valid");
    }

    const handleToggleVisibility = useCallback(() => {
        setIsPasswordVisible(prev => !prev);
    }, []);

    return (
        <View style={[layout.row, layout.justifyBetween, layout.itemsCenter, borders.w_1, error ? borders.error : borders.tertiary, borders.rounded_8, Platform.OS === "ios" ? gutters.padding_14 : gutters.padding_8]}>
            <TextInput
                ref={ref}
                {...props}
                autoCapitalize='none'
                keyboardAppearance='light'
                secureTextEntry={secureTextEntry && !isPasswordVisible}
                style={[layout.flex_1, components.urbanist14RegularBlack]}
            />
            {secureTextEntry && (
                <ButtonVariant onPress={handleToggleVisibility}>
                    <ImageVariant
                        source={isPasswordVisible ? Images.eyeOff : Images.eye}
                        sourceDark={isPasswordVisible ? ImagesDark.eyeOff : ImagesDark.eye}
                        style={[components.iconSize24]}
                        resizeMode='contain'
                        tintColor={colors.textInputPlaceholder}
                    />
                </ButtonVariant>
            )}
        </View>
    );
});

export default React.memo(InputVariant);
