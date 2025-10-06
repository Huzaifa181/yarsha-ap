import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { CountDownTimer } from "@/components/molecules";
import { CountDownTimerRef } from '@/components/molecules/CountdownTimer/CountDownTimer';
import { SafeScreen } from '@/components/template';
import { CHAT_PAGINATION_LIMIT } from '@/constants';
import GroupChatRepository from '@/database/repositories/GroupChat.repository';
import { useSendOtpMutation } from '@/hooks/domain';
import { useUpdateUserPrivateKeyMutation } from '@/hooks/domain/db-user/useDbUser';
import { useFetchUserMutation } from '@/hooks/domain/fetch-user/useFetchUser';
import { useUpdateUserMutation } from '@/hooks/domain/update-user/useUpdateUser';
import { useVerifyOtpMutation } from '@/hooks/domain/verify-otp/useVerifyOtp';
import { APP_SECRETS } from '@/secrets';
import ChatStreamService from '@/services/streamingService/ChatStreamService';
import { AppDispatch, reduxStorage } from '@/store';
import { setAuthToken, } from '@/store/slices';
import { Images, useTheme } from '@/theme';
import { SafeScreenNavigationProp, SafeScreenRouteProp } from '@/types';
import { generateRequestHeader } from '@/utils/requestHeaderGenerator';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import React, { FC, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';
import DeviceInfo from 'react-native-device-info';
import 'react-native-get-random-values';
import OTPVerify from 'react-native-otp-verify';
import SmsRetriever from 'react-native-sms-retriever';
import { useDispatch } from 'react-redux';

const CELL_COUNT = 6;

const OTPVerificationScreen: FC = (): React.JSX.Element => {
  const dispatch = useDispatch<AppDispatch>()
  const { params } = useRoute<SafeScreenRouteProp & { params: { phoneNumber: string, dialCode: string, number: string, countryCode: string } }>();
  const [verifyOtp, { isLoading: isVerifyOtpLoading }] = useVerifyOtpMutation();
  const [updateUser, { isLoading: isUserUpdateLoading }] = useUpdateUserMutation();
  const [fetchUser, { isLoading: isUserFetchLoading }] = useFetchUserMutation();
  const [sendOtp, { data, isError: isOtpSendingError, isLoading: isOTPLoading, isSuccess, reset }] = useSendOtpMutation()
  const [updateUserPrivateKey] = useUpdateUserPrivateKeyMutation();

  const { phoneNumber, number, dialCode } = params;

  const { layout, components, gutters, colors } = useTheme();
  const { t } = useTranslation(["translations"]);
  const navigation = useNavigation<SafeScreenNavigationProp>();

  const [isError, setIsError] = useState<boolean>(false);
  const [value, setValue] = useState<string>('');
  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({ value, setValue });

  const refTimer = useRef<CountDownTimerRef>(null);

  const [timerEnd, setTimerEnd] = useState(false);

  const timerOnProgressFunc = (remainingTimeInSecs: number) => {
    console.log("On Progress tracker :", remainingTimeInSecs);
  };

  const timerCallbackFunc = (timerFlag: boolean) => {
    setTimerEnd(timerFlag);
    console.warn("Alert the user when timer runs out...");
  };

  const startListeningForOTP = async () => {
    try {
      const registered = await SmsRetriever.startSmsRetriever();
      if (registered) {
        SmsRetriever.addSmsListener(event => {
          const message = event.message;

          if (message) {
            const otp = extractOTP(message);
            if (otp) {
              setValue(otp);
            }
          }

          SmsRetriever.removeSmsListener();
        });
      } else {
        console.log('SMS Retriever could not be started');
      }
    } catch (error) {
      console.error('Error starting SMS Retriever:', error);
    }
  };

  const extractOTP = (message: string) => {
    const regex = /Your Yarsha verification code is:\s(\d{6})/;
    const match = message.match(regex);
    return match ? match[1] : null;
  };

  useEffect(() => {
    startListeningForOTP();

    OTPVerify.getHash()
      .then(hash => console.log('OTP Hash:', hash))
      .catch(console.error);

    OTPVerify.getOtp()
      .then(() => {
        OTPVerify.addListener(message => {
          console.log("setting value 1", message);
          if (message) {
            const otp = extractOTP(message);
            if (otp) {
              setValue(otp);
            }
          }
        }
        )
      })
      .catch(console.error);

    return () => {
      OTPVerify.removeListener();
    };
  }, []);

  const resendOTP = async () => {
    try {
      const Body = {
        PhoneNumber: phoneNumber
      }
      await sendOtp({ phoneNumber: Body.PhoneNumber }).unwrap();
    } catch (error) {
      console.error("Error during OTP verification", error);
    }
  };

  const handleVerifyCode = async () => {
    try {
      let fcmToken;
      await reduxStorage.getItem(APP_SECRETS.REGISTERED_FCM_TOKEN).then((tokenFromStorage: string) => {
        console.log("tokenFromStorage", tokenFromStorage)
        fcmToken = tokenFromStorage || "";
      }
      ).catch((error: unknown) => {
        console.log("error while getting fcm token from storage", error);
      })

      let deviceId = await DeviceInfo.getUniqueId();
      GroupChatRepository.deleteAllGroupChats()
      const RequestHeader = await generateRequestHeader();
      const Body = {
        PhoneNumber: phoneNumber,
        Otp: value
      }
      const response = await verifyOtp({
        otp: Body.Otp, phoneNumber: Body.PhoneNumber,
        fcmData: {
          deviceModel: DeviceInfo.getModel(),
          deviceId: deviceId,
          token: fcmToken || ""
        }
      }).unwrap();
      console.log("response after otp verification", response)
      if (response["ResponseHeader"]["StatusCode"] == "200") {
        const responsePayload = response["Response"];
        dispatch(setAuthToken(responsePayload["Token"]));
        await reduxStorage.setItem(APP_SECRETS.ACCESS_TOKEN, responsePayload["Token"]);

        const fetchUserBody = {
          "UserId": responsePayload["User"]["Id"]
        }

        const fetchUserPayload = {
          RequestHeader: RequestHeader,
          Body: fetchUserBody
        }
        console.log("Request Body for fetch user", fetchUserPayload)
        const fetchUserResponse = await fetchUser({ userId: fetchUserPayload.Body.UserId, authToken: responsePayload["Token"] }).unwrap();
        console.log("fetchUserResponse", fetchUserResponse)
        if (fetchUserResponse["ResponseHeader"]["StatusCode"] == "200") {
          let fcmToken;
          if (fetchUserResponse["Response"]["FullName"]) {
            console.log("fetchUserResponse", fetchUserResponse)
            await reduxStorage.getItem(APP_SECRETS.REGISTERED_FCM_TOKEN).then((tokenFromStorage: string) => {
              console.log("tokenFromStorage", tokenFromStorage)
              fcmToken = tokenFromStorage || "";
            }
            ).catch((error: unknown) => {
              console.log("error while getting fcm token from storage", error);
            })

            let deviceId = await DeviceInfo.getUniqueId();

            const UpdateProfileBody = {
              "FcmToken": {
                Model: DeviceInfo.getModel(),
                DeviceId: deviceId,
                Token: fcmToken || "",
              },
              "User": {
                "Number": number,
                "CountryCode": dialCode,
              }
            }
            const updateProfilePayload = {
              RequestHeader: RequestHeader,
              Body: UpdateProfileBody,
              AccessToken: responsePayload["Token"]
            }

            console.log("token", responsePayload["Token"])
            console.log("updateProfilePayload", updateProfilePayload)
            const returnedResponse = await updateUser(updateProfilePayload).unwrap();
            console.log("returnedResponse", returnedResponse)
            await updateUserPrivateKey({
              userId: fetchUserResponse.Response.Id,
              privateKey: response.Response.PrivateKey,
            });
            await reduxStorage.setItem(APP_SECRETS.IS_PROFILE_SETUP, "true");
            const groupChatRequestPayload = {
              RequestHeader: RequestHeader,
              AccessToken: responsePayload["Token"],
              Body: {
                page: "1",
                limit: CHAT_PAGINATION_LIMIT
              }
            }
            const streamService = ChatStreamService.getInstance();
            streamService.startStream();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{
                  name: 'Auth',
                  state: {
                    routes: [{
                      name: "BottomTab",
                      state: {
                        routes: [{
                          name: "ChatsScreen"
                        }]
                      }
                    }]
                  }
                }],
              }),
            );
          } else
            navigation.navigate("CreateProfileScreen", {
              authToken: responsePayload["Token"],
              address: responsePayload["User"]["Address"],
              id: responsePayload["User"]["Id"],
              phoneNumber: responsePayload["User"]["PhoneNumber"],
            });
        } else {
          setIsError(true);
        }
      }
    } catch (error) {
      console.error("Error during OTP verification", error);
    }
  };



  return (
    <SafeScreen>
      <View style={[gutters.padding_14, layout.flex_1]}>
        <TextVariant style={[components.urbanist30BoldBlack, gutters.marginTop_16]}>
          Enter Code
        </TextVariant>
        <TextVariant style={[components.urbanist16RegularBlack, gutters.marginTop_12]}>
          Please check <TextVariant style={{ color: colors.primary }}>{phoneNumber}</TextVariant> for a message from Yarsha and enter your code below.
        </TextVariant>

        <View style={[gutters.marginTop_50]}>
          <CodeField
            ref={ref}
            {...props}
            value={value}
            onChangeText={setValue}
            cellCount={CELL_COUNT}
            rootStyle={{ justifyContent: 'space-between' }}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            renderCell={({ index, symbol, isFocused }) => (
              <View
                key={index}
                style={[
                  {
                    width: 50,
                    height: 50,
                    borderWidth: 2,
                    borderColor: isFocused ? colors.primary : colors.secondary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 8,
                  },
                ]}
                onLayout={getCellOnLayoutHandler(index)}
              >
                <TextVariant style={{ fontSize: 24 }}>{symbol || (isFocused ? <Cursor /> : null)}</TextVariant>
              </View>
            )}
          />
          {isError ? <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
            <ImageVariant
              source={Images.warning_red}
              style={[components.iconSize12, gutters.marginRight_6]}
            />
            <TextVariant style={{ color: colors.error, fontFamily: "Urbanist-Medium", letterSpacing: 0.5 }}>
              {`Unable to verify OTP. Please try again`}
            </TextVariant>
          </View> : null}
        </View>

        <View style={[gutters.marginTop_40]}>
          <ButtonVariant
            disabled={isVerifyOtpLoading || isUserFetchLoading || isUserUpdateLoading}
            style={[(isVerifyOtpLoading || isUserFetchLoading || isUserUpdateLoading) ? components.disabledButton : components.blueBackgroundButton, layout.itemsCenter, gutters.padding_14]}
            onPress={handleVerifyCode}
          >{(isVerifyOtpLoading || isUserFetchLoading || isUserUpdateLoading) ? <LottieView
            source={require('@/theme/assets/lottie/loading.json')}
            style={{ height: 20, width: 20 }}
            autoPlay
            loop
          /> :
            <TextVariant style={[components.urbanist16SemiBoldWhite]}>
              {t("verify")}
            </TextVariant>
            }
          </ButtonVariant>
        </View>
        <View style={[gutters.marginTop_2]}>

          <View style={[gutters.marginTop_20]}>
            <CountDownTimer
              ref={refTimer}
              timestamp={120}
              showSecondsOnly={true}
              timerOnProgress={timerOnProgressFunc}
              timerCallback={timerCallbackFunc}
            />
            <ButtonVariant
              onPress={() => {
                refTimer.current?.resetTimer();
                resendOTP();
                setTimerEnd(false);
              }}
              disabled={!timerEnd}
              style={[
                layout.itemsSelfCenter,
                gutters.marginTop_10,
              ]}
            >
              <TextVariant
                style={[
                  components.urbanist14SemiBoldPrimary,
                  !timerEnd && { color: colors.gray400 },
                ]}
              >
                {t("resendOTP")}
              </TextVariant>
            </ButtonVariant>

          </View>
        </View>
      </View>
    </SafeScreen>
  );
};

export default React.memo(OTPVerificationScreen);