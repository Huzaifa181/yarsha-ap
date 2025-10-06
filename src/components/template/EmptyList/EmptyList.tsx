import React, { FC } from 'react'
import { View } from 'react-native'
import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms'
import { Images, ImagesDark, useTheme } from '@/theme'
import { isImageSourcePropType, SafeScreenNavigationProp } from '@/types'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'

interface IProps { }

/**
* @author Nitesh Raj Khanal
* @function @EmptyList
**/

const EmptyList: FC<IProps> = (props) => {

    const { components, layout, gutters, backgrounds, borders } = useTheme()

    const { t } = useTranslation(["translations"])

    const navigation = useNavigation<SafeScreenNavigationProp>()

    if (!isImageSourcePropType(Images.message_empty) || !isImageSourcePropType(ImagesDark.message_empty)) {
        throw new Error("Image source is not valid")
    }

    return (
        <View style={[layout.flex_1, layout.itemsCenter, layout.justifyCenter, gutters.marginBottom_40]}>
            <ImageVariant
                source={Images.message_empty}
                sourceDark={ImagesDark.message_empty}
                style={[components.imageSize150]}
            />
            <TextVariant style={[components.urbanist20MediumDarkSecondary, components.textCenter, gutters.marginVertical_16]}>{t("dontHaveChats")}</TextVariant>
            <TextVariant style={[components.urbanist18RegularLightText, components.textCenter]}>{t("dontHaveChatsDescription")}</TextVariant>
            <ButtonVariant onPress={() => navigation.navigate("SearchScreen")} style={[gutters.marginTop_16, gutters.paddingHorizontal_20, gutters.paddingVertical_12, backgrounds.primary, borders.rounded_8]}>
                <TextVariant style={[components.urbanist16SemiBoldWhite]}>{t("startChatting")}</TextVariant>
            </ButtonVariant>
        </View>
    )
}


export default React.memo(EmptyList)