import { ButtonVariant, TextVariant } from '@/components/atoms';
import { useTheme } from '@/theme';
import { SafeScreenNavigationProp } from '@/types';
import FastImage from '@d11/react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import React, { FC } from 'react'
import { View, StyleSheet } from 'react-native'

interface IProps {
    botId: string;
    botName: string;
    botIcon?: string;
    botDescription: string;
    category?: string;
    username?: string;
    botBio?: string;
    descriptions?:string[];
}

/**
* @author Nitesh Raj Khanal
* @function @Bots
**/

const Bots: FC<IProps> = (props) => {
    const { layout, gutters, borders, components } = useTheme()

    const navigation = useNavigation<SafeScreenNavigationProp>();

    const botAction = () => {
        navigation.navigate("BotMessage", {
            botId: props.botId,
            name: props.botName,
            type: "bot",
            profilePicture: props.botIcon,
            botDescription: props.botDescription,
            botBio: props.botBio,
            category: props.category,
            username: props.username,
            descriptions: props.descriptions
        })
    }
    
    return (
        <ButtonVariant onPress={botAction} style={[layout.row, layout.itemsCenter, gutters.marginBottom_10]}>
            <FastImage
                source={{ uri: props.botIcon }}
                style={StyleSheet.flatten([layout.width48, layout.height48, borders.rounded_500])}
            />
            <View style={[gutters.marginLeft_10]}>
                <TextVariant style={[components.urbanist16BoldDark]}>{props.botName}</TextVariant>
                <TextVariant style={[components.urbanist14MediumcancelText, gutters.marginTop_4]}>{props.username}</TextVariant>
            </View>
        </ButtonVariant>
    )
}

export default React.memo(Bots)