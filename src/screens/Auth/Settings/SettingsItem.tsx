import React, { FC, useCallback, useEffect, useState } from 'react';
import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { Images, ImagesDark, useTheme } from '@/theme';
import { PlatformPermissions, SafeScreenNavigationProp, SectionItem } from '@/types';
import { useNavigation } from '@react-navigation/native';
import { Switch } from '@/components/molecules';
import { reduxStorage } from '@/store';
import { APP_SECRETS } from '@/secrets';
import { setIsBiometricEnabledInState, setIsBiometricEnrolled } from '@/store/slices';
import { useDispatch } from '@/hooks';
import { PERMISSION_TYPE, Permissions, REQUEST_PERMISSION_TYPE } from '@/utils/permissionHandler';
import { Alert, Platform, View } from 'react-native';
import { Permission } from 'react-native-permissions';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import DeviceInfo from 'react-native-device-info';
import { ActivityIndicator } from 'react-native-paper';

interface IProps {
  item: SectionItem;
  versionNumber: string;
  handleLogout?: () => void;
  isLoggingOut?: boolean;
}

const SectionListItem: FC<IProps> = ({
  item,
  versionNumber,
  handleLogout,
  isLoggingOut,
}): React.JSX.Element | null => {
  const { layout, gutters, components, colors } = useTheme();
  const navigation = useNavigation<SafeScreenNavigationProp>();

  const dispatch = useDispatch()

  const [isBiometricsEnabled, setIsBiometricsEnabled] =
    useState<boolean>(false);

  const handlePress = useCallback(async () => {
    if (item.key === 'Log Out') {
      handleLogout?.();
    } else if (item.key === 'Security & Privacy') {
      navigation.navigate('SecurityAndPrivacyScreen');
    } else if (item.key === 'Terms & Conditions') {
      navigation.navigate('TermsAndCondition');
    } else if (item.key === 'Privacy Policy') {
      navigation.navigate('PrivacyPolicy');
    } else if (item.key === "Delete Your Yarsha Account") {
      navigation.navigate('DeleteAccount');
    } else {
      item.onPress?.();
    }
  }, [item.key, navigation, handleLogout]);

  useEffect(() => {
    const checkBiometricState = async () => {
      const stored = await reduxStorage.getItem(APP_SECRETS.BIO_METRICS_ENABLED);
      const isEnabled = stored === 'true';
      setIsBiometricsEnabled(isEnabled);
      dispatch(setIsBiometricEnabledInState(isEnabled));
    };

    checkBiometricState();
  }, []);

  const authenticateBiometrics = async (rnBiometrics: ReactNativeBiometrics) => {
    try {
      const result = await rnBiometrics.simplePrompt({
        promptMessage: "Confirm your fingerprint",
        fallbackPromptMessage: "Use your device credentials",
      });

      if (result.success) {
        const newState = !isBiometricsEnabled;
        setIsBiometricsEnabled(newState);
        dispatch(setIsBiometricEnabledInState(newState))

        await reduxStorage.setItem(
          APP_SECRETS.BIO_METRICS_ENABLED,
          newState.toString(),
        );

        dispatch(setIsBiometricEnrolled(true));
      } else {
        dispatch(setIsBiometricEnrolled(false));
      }
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };


  const toggleBiometrics = async () => {
    const faceIdPermission = REQUEST_PERMISSION_TYPE.faceid[
      Platform.OS as keyof PlatformPermissions
    ] as Permission;

    const isEmulator = await DeviceInfo.isEmulator();
    const rnBiometrics = new ReactNativeBiometrics();
    const { available, biometryType } =
      await rnBiometrics.isSensorAvailable();
    const { keysExist } = await rnBiometrics.biometricKeysExist();

    if (!available) {
      Alert.alert(
        "Biometric Setup Required",
        "Biometric authentication is unavailable. Please register a fingerprint in your device settings.",
        [{ text: "OK" }]
      );
      return;
    }
    if (!keysExist) {
      if (Platform.OS === "android") {
        try {
          const result = await rnBiometrics.createKeys();
          if (result.publicKey) {
            await authenticateBiometrics(rnBiometrics);
          }
        } catch (error) {
          console.error("Error creating biometric keys:", error);
        }
      } else if (Platform.OS === "ios") {
        Alert.alert(
          "Biometric Setup Required",
          "Please register Face ID or Touch ID in your device settings.",
          [{ text: "OK" }]
        );
      }
      return;
    }

    if (Platform.OS === 'ios' && !isEmulator) {
      const response = await Permissions.checkPermission(
        PERMISSION_TYPE.faceid,
      );
      if (!response) {
        const resp = await Permissions.requestPermission(faceIdPermission);

        if (resp) {
          rnBiometrics
            .simplePrompt({
              promptMessage: "Confirm your fingerprint",
              fallbackPromptMessage: "Use your device credentials",
            })
            .then((result) => {
              if (result.success) {
                const newState = !isBiometricsEnabled;
                setIsBiometricsEnabled(newState);
                dispatch(setIsBiometricEnabledInState(newState))

                reduxStorage.setItem(
                  APP_SECRETS.BIO_METRICS_ENABLED,
                  newState.toString(),
                );
                dispatch(setIsBiometricEnrolled(true));
              } else {
                dispatch(setIsBiometricEnrolled(false));
              }
            })
            .catch((error) => {
              console.log("Authentication error: " + (error as Error).message);
            });
        }
      } else {
        rnBiometrics
          .simplePrompt({
            promptMessage: "Confirm your fingerprint",
            fallbackPromptMessage: "Use your device credentials",
          })
          .then((result) => {
            if (result.success) {
              const newState = !isBiometricsEnabled;
              setIsBiometricsEnabled(newState);
              dispatch(setIsBiometricEnabledInState(newState))

              reduxStorage.setItem(
                APP_SECRETS.BIO_METRICS_ENABLED,
                newState.toString(),
              );
              dispatch(setIsBiometricEnrolled(true));
            } else {
              dispatch(setIsBiometricEnrolled(false));
            }
          })
          .catch((error) => {
            console.log("Authentication error: " + (error as Error).message);
          });

      }
    } else if (Platform.OS === 'ios' && isEmulator) {
    } else if (Platform.OS === 'android') {
      if (available) {
        if (available && biometryType === BiometryTypes.TouchID) {
          rnBiometrics
            .simplePrompt({
              promptMessage: "Confirm your fingerprint",
              fallbackPromptMessage: "Use your device credentials",
            })
            .then((result) => {
              if (result.success) {
                const newState = !isBiometricsEnabled;
                setIsBiometricsEnabled(newState);
                dispatch(setIsBiometricEnabledInState(newState))

                reduxStorage.setItem(
                  APP_SECRETS.BIO_METRICS_ENABLED,
                  newState.toString(),
                );
                dispatch(setIsBiometricEnrolled(true));
              } else {
                dispatch(setIsBiometricEnrolled(false));
              }
            })
            .catch((error) => {
              console.log("Authentication error: " + (error as Error).message);
            });
        } else if (available && biometryType === BiometryTypes.FaceID) {
          if (!keysExist) {
            rnBiometrics
              .simplePrompt({
                promptMessage: "Confirm your fingerprint",
                fallbackPromptMessage: "Use your device credentials",
              })
              .then((result) => {
                if (result.success) {
                  const newState = !isBiometricsEnabled;
                  setIsBiometricsEnabled(newState);
                  dispatch(setIsBiometricEnabledInState(newState))

                  reduxStorage.setItem(
                    APP_SECRETS.BIO_METRICS_ENABLED,
                    newState.toString(),
                  );
                  dispatch(setIsBiometricEnrolled(true));
                } else {
                  dispatch(setIsBiometricEnrolled(false));
                }
              })
              .catch((error) => {
                console.log("Authentication error: " + (error as Error).message);
              });
          }
        } else if (available && biometryType === BiometryTypes.Biometrics) {
          rnBiometrics
            .simplePrompt({
              promptMessage: "Confirm your fingerprint",
              fallbackPromptMessage: "Use your device credentials",
            })
            .then((result) => {
              if (result.success) {
                const newState = !isBiometricsEnabled;
                setIsBiometricsEnabled(newState);
                dispatch(setIsBiometricEnabledInState(newState));

                reduxStorage.setItem(
                  APP_SECRETS.BIO_METRICS_ENABLED,
                  newState.toString(),
                );
                dispatch(setIsBiometricEnrolled(true));
              } else {
                dispatch(setIsBiometricEnrolled(false));
              }
            })
            .catch((error) => {
              console.log("Authentication error: " + (error as Error).message);
            });

        } else {
          console.log('Biometrics not supported on android');
        }
      } else {
        console.log(
          'No biometric hardware available on this Android device',
        );
      }
    }
  };

  return (
    <ButtonVariant
      disabled={!!item.value || item.key === 'Enable Biometrics' || isLoggingOut}
      onPress={handlePress}
      style={[
        layout.row,
        layout.justifyBetween,
        layout.itemsCenter,
        (item.key === "Enable Biometrics" || item.key === "Notifications") ? gutters.marginVertical_8 : gutters.marginVertical_10,
      ]}>
      <View style={[layout.row, layout.itemsCenter]}>
        <ImageVariant
          source={item.key === "Recent Logins" ? Images.list
            : item.key === "Enable Biometrics" ? Images.biometrics :
              item.key === "Notifications" ? Images.bell :
                item.key === "Terms & Conditions" ? Images.terms_and_conditions :
                  item.key === "Privacy Policy" ? Images.terms_and_conditions :
                    item.key === "Support" ? Images.support :
                      item.key === "About Yarsha" ? Images.about_yarsha :
                        item.key === "Delete Your Yarsha Account" ? Images.delete :
                          Images.logout
          }
          sourceDark={item.key === "Recent Logins" ? ImagesDark.list
            : item.key === "Enable Biometrics" ? ImagesDark.biometrics :
              item.key === "Notifications" ? ImagesDark.bell :
                item.key === "Terms & Conditions" ? Images.terms_and_conditions :
                  item.key === "Privacy Policy" ? Images.terms_and_conditions :
                    item.key === "Support" ? Images.support :
                      item.key === "About Yarsha" ? Images.about_yarsha : item.key === "Delete Your Yarsha Account" ? Images.delete :
                        Images.logout
          }
          tintColor={item.key === 'Log Out' ? colors.error : colors.dark}
          style={[components.iconSize24, gutters.marginRight_8]}
          resizeMode='contain'
        />
        <TextVariant
          style={
            [
              components.urbanist20BoldBlack,
              item.key === 'Log Out' && { color: colors.error },
            ]
          }>
          {item.key}
        </TextVariant>
      </View>
      {
        item.value ? (
          <TextVariant style={[components.urbanist14RegularLight]}>
            {item.key === 'App Version' ? `v.${versionNumber}` : item.value}
          </TextVariant>
        ) : item.key === 'Enable Biometrics' ? (
          <Switch isEnabled={isBiometricsEnabled} onToggle={toggleBiometrics} />
        ) : item.key === 'Notifications' ? (
          <Switch isEnabled={isBiometricsEnabled} onToggle={() => { }} />
        ) : item.key === 'Log Out' ? null : (
          <ButtonVariant>
            <ImageVariant
              source={Images.right_arrow_settings_icon}
              sourceDark={ImagesDark.right_arrow_settings_icon}
              tintColor={colors.dark}
              style={[components.iconSize16, gutters.marginRight_10,]}
              resizeMode='contain'
            />
          </ButtonVariant>
        )
      }
    </ButtonVariant >
  );
};

export default React.memo(SectionListItem);
