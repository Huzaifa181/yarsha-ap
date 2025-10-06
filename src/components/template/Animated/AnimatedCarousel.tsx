import { TextVariant } from '@/components/atoms';
import { useTheme } from '@/theme';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text } from 'react-native';
import PagerView from 'react-native-pager-view';
import { PageIndicator } from 'react-native-page-indicator';

interface PinnedListProps {
	setActiveIndex: (index: number) => void;
	pinnedMessage: any;
}

const PinnedList: FC<PinnedListProps> = (
	{ setActiveIndex, pinnedMessage }
) => {
	const { backgrounds, components, gutters, layout } = useTheme();
	const { t } = useTranslation(["translations"])

	return (
		<PagerView onPageSelected={(event) => {
			const index = event.nativeEvent.position;
			setActiveIndex(index);
		}} style={[backgrounds.botCommandsBg, styles.pagerView]} initialPage={0} orientation={"vertical"}>
			{
				pinnedMessage?.map((chat: any, index: number) => (
					<View key={index} style={[backgrounds.botCommandsBg, gutters.paddingVertical_10]}>
						<TextVariant style={[components.urbanist16BoldPrimary]}>{t("pinnedMessage")} #{`${index+1}`}</TextVariant>
						<TextVariant numberOfLines={1} style={[components.urbanist16RegularLight]}>{chat?.content}</TextVariant>
					</View>
				))
			}
		</PagerView>
	);
};

const styles = StyleSheet.create({
	pagerView: {
		flex: 1,
		position: "absolute",
		top: 0,
		bottom: 0,
		left: 40,
		right: 0,
		zIndex: 1000,
		height: 70,
		width: "80%"
	},
});

export default PinnedList;