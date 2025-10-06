import React, { useEffect } from 'react';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withRepeat,
	withTiming,
	Easing,
} from 'react-native-reanimated';
import { ImageVariant } from '@/components/atoms';
import { Images, ImagesDark, useTheme } from '@/theme';
import { isImageSourcePropType } from '@/types/guards/image';
import { BrandSpace } from '@/types';

/**
 * @author Nitesh Raj Khanal
 * @function @Brand
 **/

const Brand = ({
	height = 200,
	width = 200,
	mode = 'contain',
	isLoading,
}: BrandSpace.Props) => {
	const { layout } = useTheme();
	const scale = useSharedValue(1);

	useEffect(() => {
		if (isLoading) {
			scale.value = withRepeat(
				withTiming(1.1, {
					duration: 500,
					easing: Easing.inOut(Easing.ease),
				}),
				-1,
				true,
			);
		} else {
			scale.value = withTiming(1, {
				duration: 500,
				easing: Easing.inOut(Easing.ease),
			});
		}
	}, [isLoading]);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ scale: scale.value }],
		};
	});

	if (
		!isImageSourcePropType(Images.brand) ||
		!isImageSourcePropType(ImagesDark.brand)
	) {
		throw new Error('Image source is not valid');
	}

	return (
		<Animated.View
			testID="brand-img-wrapper"
			style={[{ height, width }, animatedStyle, { alignItems: 'center'}]}
		>
			<ImageVariant
				testID="brand-img"
				style={[layout.fullHeight, layout.fullWidth]}
				source={Images.brand}
				sourceDark={ImagesDark.brand}
				resizeMode={mode}
			/>
		</Animated.View>
	);
};

export default Brand;
``;
