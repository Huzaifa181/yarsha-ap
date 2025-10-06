import React from 'react';
import { View } from 'react-native';
import { Images, ImagesDark, useTheme } from '@/theme';
import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { SafeScreenNavigationProp } from '@/types';
import { getInitials, getRandomColor } from '@/utils';
import { useNavigation } from '@react-navigation/native';
import FastImage from '@d11/react-native-fast-image';


interface TokenCardProps {
    item: any;
    option: string;
    routeParams: {
        chatId?: string;
        type?: string;
        receivers?: any;
        groupDetail?: any
    };
}

/**
 * @author Nitesh Raj Khanal
 * @function @TokenCard
 * @returns JSX.Element
 **/

const TokenCard: React.FC<TokenCardProps> = ({ item, option, routeParams }): JSX.Element => {
    const { layout, gutters, components, borders, backgrounds } = useTheme();
    const navigation = useNavigation<SafeScreenNavigationProp>();

    const { backgroundColor } = React.useMemo(() => getRandomColor(), [item]);

    console.log("routeParams in token card===>", routeParams)
    const navigateToUserContact = () => {
        if (routeParams?.receivers?.length > 0) {
            navigation.navigate("EnterAmountScreen", {
                chatType: routeParams?.type || "",
                token: {
                    ...item
                },
                receivers: routeParams?.receivers || [],
                groupDetail: routeParams?.groupDetail || null,
            });
        }
        else
            navigation.navigate("TokenContactsScreen", {
                token: {
                    ...item
                }
            })
    }
    return (
        <ButtonVariant onPress={navigateToUserContact} style={[layout.row, layout.itemsCenter, gutters.paddingVertical_12, gutters.paddingHorizontal_12, gutters.marginHorizontal_10, gutters.marginVertical_5, backgrounds.gray50, borders.rounded_8]}>
            {item.logo ? (
                <FastImage
                    source={{ uri: item.logo }}
                    style={[
                        components.imageSize48,
                        gutters.marginRight_10,
                        borders.rounded_500,
                    ]}
                />
            ) : (
                <View
                    style={[
                        components.imageSize48,
                        gutters.marginRight_6,
                        borders.rounded_500,
                        { backgroundColor },
                        layout.itemsCenter,
                        layout.justifyCenter,
                    ]}
                >
                    <TextVariant style={[components.urbanist24BoldWhite]}>
                        {getInitials(`${item?.name}`)}
                    </TextVariant>
                </View>
            )}
            <View style={[layout.row, layout.justifyBetween, layout.flex_1]}>
                <View>
                    <TextVariant style={[components.urbanist16SemiBoldDark]}>
                        {`${item.name || "Unknown"}`.trim()}
                    </TextVariant>

                    <TextVariant style={[components.urbanist14RegularcodeDark]}>
                        {item.symbol}
                    </TextVariant>

                </View>
                <View>
                    <TextVariant style={[components.urbanist16SemiBoldDark]}>
                        {`${(item.balance || 0).toFixed(3)}`}
                    </TextVariant>

                    {/* <View style={[layout.row, layout.itemsCenter, layout.justifyStart]}>
                        <ImageVariant
                            source={Images.up}
                            sourceDark={ImagesDark.up}
                            style={[components.iconSize20]}
                            resizeMode='cover'
                        />
                        <TextVariant style={[components.urbanist12BoldIncrease]}>3.4%</TextVariant>
                    </View> */}

                </View>
            </View>

        </ButtonVariant>
    );
};

export default React.memo(TokenCard);
