import { TextStyle } from 'react-native';
import type { FontColors, FontSizes } from '@/types/theme/fonts';
import type { UnionConfiguration } from '@/types/theme/config';
import { config } from '@/theme/_config';

export const generateFontColors = (configuration: UnionConfiguration) => {
	return Object.entries(configuration.fonts.colors ?? {}).reduce(
		(acc, [key, value]) => {
			return Object.assign(acc, {
				[`${key}`]: {
					color: value,
				},
			});
		},
		{} as FontColors,
	);
};

export const generateFontSizes = () => {
	return config.fonts.sizes.reduce((acc, size) => {
		return Object.assign(acc, {
			[`size_${size}`]: {
				fontSize: size,
			},
		});
	}, {} as FontSizes);
};

export const staticFontStyles = {
	bold: {
		fontWeight: 'bold',
	},
	uppercase: {
		textTransform: 'uppercase',
	},
	capitalize: {
		textTransform: 'capitalize',
	},
	alignCenter: {
		textAlign: 'center',
	},
} as const satisfies Record<string, TextStyle>;


export const Urbanist: Record<string, TextStyle> = {
	black: {
		fontFamily: 'Urbanist-Black',
	},
	blackItalic: {
		fontFamily: 'Urbanist-BlackItalic',
	},
	bold: {
		fontFamily: 'Urbanist-Bold',
	},
	boldItalic: {
		fontFamily: 'Urbanist-BoldItalic',
	},
	extraBold: {
		fontFamily: 'Urbanist-ExtraBold',
	},
	extraBoldItalic: {
		fontFamily: 'Urbanist-ExtraBoldItalic',
	},
	extraLight: {
		fontFamily: 'Urbanist-ExtraLight',
	},
	extraLightItalic: {
		fontFamily: 'Urbanist-ExtraLightItalic',
	},
	italic: {
		fontFamily: 'Urbanist-Italic',
	},
	light: {
		fontFamily: 'Urbanist-Light',
	},
	lightItalic: {
		fontFamily: 'Urbanist-LightItalic',
	},
	medium: {
		fontFamily: 'Urbanist-Medium',
	},
	mediumItalic: {
		fontFamily: 'Urbanist-MediumItalic',
	},
	regular: {
		fontFamily: 'Urbanist-Regular',
	},
	semiBold: {
		fontFamily: 'Urbanist-SemiBold',
	},
	semiBoldItalic: {
		fontFamily: 'Urbanist-SemiBoldItalic',
	},
	thin: {
		fontFamily: 'Urbanist-Thin',
	},
	thinItalic: {
		fontFamily: 'Urbanist-ThinItalic',
	},
};