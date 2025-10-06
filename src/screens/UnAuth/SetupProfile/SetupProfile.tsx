import 'react-native-get-random-values';

import React, { FC, useEffect, useRef, useState } from 'react';
import { Dimensions, View } from 'react-native';
import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { Brand } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { Images, useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import PhoneInput from '@/components/molecules/PhoneNumberInput';
import { SafeScreenNavigationProp } from '@/types';
import LottieView from 'lottie-react-native';
import { useSelector } from '@/hooks';
import { RootState } from '@/store';
import { CountryCode } from '@/data/countryCode';
import { useSendOtpMutation } from '@/hooks/domain';
import { GRPC_STATUS_CODES } from '@/constants';
import 'text-encoding';

interface IProps { }

const SetupProfile: FC<IProps> = (): React.JSX.Element => {
    const { layout, components, gutters, colors, backgrounds, borders } = useTheme();
    const { t } = useTranslation(["translations"]);
    const navigation = useNavigation<SafeScreenNavigationProp>();
    const { height: screenHeight } = Dimensions.get('window');

    const phoneInput = useRef<PhoneInput>(null);
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [isPhoneValid, setIsPhoneValid] = useState<boolean>(true);
    const defaultCountryCode = useSelector((state: RootState) => state.countryCode.countryCode)
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [fullPhoneNumber, setFullPhoneNumber] = useState<{ formattedNumber: string; number: string } | null>(null);
    const [customError, setCustomError] = useState<boolean>(false);

    const [sendOtp, { data, isError, isLoading: isOTPLoading, isSuccess, reset }] = useSendOtpMutation()
    const selectedCountry = CountryCode.find(country => country.code === defaultCountryCode);

    const actualDialCode = selectedCountry?.dial_code || "";

    const handleGetOTP = async () => {
        const isValid = phoneInput.current?.isValidNumber(phoneNumber);
        setIsPhoneValid(!!isValid);
        if (isValid) {
            if (fullPhoneNumber) {
                try {
                    const Body = {
                        PhoneNumber: fullPhoneNumber?.formattedNumber
                    }
                    console.log("fullPhoneNumber?.formattedNumber==>", fullPhoneNumber?.formattedNumber)
                    await sendOtp({ phoneNumber: Body.PhoneNumber }).unwrap();
                } catch (error) {
                    console.error("Error during OTP verification", error);
                }
            }
        } else {
            console.log("Invalid phone number");
        }
    };

    useEffect(() => {
        if (isSuccess) {
            if (data.responseHeader?.status === GRPC_STATUS_CODES.OK) {
                if (data.responseHeader.statusCode === "200") {
                    navigation.navigate("OTPVerificationScreen", {
                        phoneNumber: fullPhoneNumber?.formattedNumber || '',
                        dialCode: actualDialCode,
                        number: fullPhoneNumber?.number || '',
                        countryCode: defaultCountryCode,
                    });
                    reset()
                } else {
                    setCustomError(true);
                    setErrorMessage("Oops! Looks like the OTP got lost in the matrix. Try again after a while!");
                }
            } else {
                console.log("OTP sent successfully", data.responseHeader?.responseDescription);
            }
        } else if (isError) {
            setCustomError(true);
        }
    }, [isSuccess, isError, data])


    console.log("error, isError, customError", errorMessage, isError, customError);

    return (
        <SafeScreen>
            <View style={[gutters.padding_14, layout.flex_1]}>
                <View style={[gutters.marginTop_12, layout.itemsCenter]}>
                    <Brand height={40} width={120} isLoading={false} />
                    <TextVariant style={[components.urbanist30BoldBlack, components.textCenter, gutters.marginTop_24]}>
                        {t("telegramOnSolana")}
                    </TextVariant>
                    <TextVariant style={[components.urbanist16RegularBlack, components.textCenter, gutters.marginTop_8]}>
                        {t("chatSendReceive")}
                    </TextVariant>
                </View>

                <View style={[gutters.marginTop_70]}>
                    <TextVariant style={[components.urbanist14MediumBlack, gutters.marginBottom_10]}>{t("enterPhoneNumber")}</TextVariant>
                    <PhoneInput
                        key={defaultCountryCode}
                        ref={phoneInput}
                        defaultValue={phoneNumber}
                        defaultCode={defaultCountryCode}
                        layout="first"
                        onChangeText={(text) => setPhoneNumber(text.replace(/\s+/g, ''))}
                        onChangeFormattedText={(formattedText) => {
                            setFullPhoneNumber({
                                formattedNumber: formattedText.replace(/\s+/g, ''),
                                number:
                                    phoneInput.current
                                        ?.getNumberAfterPossiblyEliminatingZero()
                                        ?.number.replace(/\s+/g, '') || '',
                            });
                        }}
                        containerStyle={{
                            width: '100%',
                            borderColor: isPhoneValid ? '#e5e5e5' : colors.error,
                            borderWidth: 1,
                            borderRadius: 8,
                            height: screenHeight * 0.065,
                        }}
                        textContainerStyle={[
                            gutters.paddingVertical_4,
                            backgrounds.white,
                            borders.clipBackground,
                            components.phoneNumberInput,
                            { height: screenHeight * 0.06 },
                        ]}
                        textInputStyle={[
                            components.urbanist18RegularBlack,
                            components.letterSpacing1,
                        ]}
                        codeTextStyle={[components.urbanist18RegularBlack]}
                    />


                </View>

                {!isPhoneValid && (
                    <View style={[layout.row, layout.itemsCenter, gutters.marginTop_8]}>
                        <ImageVariant
                            source={Images.warning_red}
                            style={[components.iconSize12]}
                        />
                        <TextVariant style={[components.urbanist14RegularError, gutters.marginLeft_8]}>
                            {t("invalidPhone")}
                        </TextVariant>
                    </View>
                )}

                {(isError || customError) && (
                    <View style={[layout.row, layout.itemsCenter, gutters.marginTop_8]}>
                        <ImageVariant
                            source={Images.warning_red}
                            style={[components.iconSize12]}
                        />
                        <TextVariant style={[components.urbanist14RegularError, gutters.marginLeft_8]}>
                            {errorMessage}
                        </TextVariant>
                    </View>
                )}

                <View style={[gutters.marginTop_40]}>
                    <ButtonVariant
                        style={[isOTPLoading ? components.disabledButton : components.blueBackgroundButton, layout.itemsCenter, gutters.padding_14]}
                        onPress={handleGetOTP}
                    >
                        {isOTPLoading ? <LottieView
                            source={require('@/theme/assets/lottie/loading.json')}
                            style={{ height: 20, width: 20 }}
                            autoPlay
                            loop
                        /> :
                            <TextVariant style={[components.urbanist16SemiBoldWhite]}>
                                {t("getOTP")}
                            </TextVariant>}
                    </ButtonVariant>
                </View>
            </View>
        </SafeScreen>
    );
};

export default React.memo(SetupProfile);