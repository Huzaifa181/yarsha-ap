import { PlatformPermissions } from "@/types";
import log from "@/utils/logger";
import { PERMISSION_TYPE, Permissions, REQUEST_PERMISSION_TYPE } from "@/utils/permissionHandler";
import { useState, useEffect } from "react";
import { Platform } from "react-native";
import ReactNativeBiometrics, { BiometryTypes } from "react-native-biometrics";
import DeviceInfo from "react-native-device-info";
import { Permission } from "react-native-permissions";

type UseBiometricsReturnType = {
  checkSensor: () => Promise<string>;
  openScanner: (callback: (message: string) => void) => void;
  isBiometricEnrolled: () => Promise<boolean>;
  canOpenScanner: boolean;
};

const useBiometrics = (): UseBiometricsReturnType => {
  const rnBiometrics = new ReactNativeBiometrics();
  const [canOpenScanner, setCanOpenScanner] = useState<boolean>(false);

  useEffect(() => {
    const faceIdPermission = REQUEST_PERMISSION_TYPE.faceid[
      Platform.OS as keyof PlatformPermissions
    ] as Permission;

    const checkFaceIdPermission = async () => {
      try {
        const isEmulator = await DeviceInfo.isEmulator();
        const rnBiometrics = new ReactNativeBiometrics();
        const {available, biometryType} =
          await rnBiometrics.isSensorAvailable();

        if (Platform.OS === 'ios' && !isEmulator) {
          const response = await Permissions.checkPermission(
            PERMISSION_TYPE.faceid,
          );
          if (!response) {
            const resp = await Permissions.requestPermission(faceIdPermission);
            setCanOpenScanner(resp);
          } else {
            setCanOpenScanner(true);
          }
        } else if (Platform.OS === 'ios' && isEmulator) {
          setCanOpenScanner(true);
        } else if (Platform.OS === 'android') {
          // console.log('available===>', available);
          if (available) {
            // console.log(`Biometric hardware available: ${biometryType}`);

            if (available && biometryType === BiometryTypes.TouchID) {
              setCanOpenScanner(true);
            } else if (available && biometryType === BiometryTypes.FaceID) {
              setCanOpenScanner(true);
            } else if (available && biometryType === BiometryTypes.Biometrics) {
              setCanOpenScanner(true);
            } else {
              // console.log('Biometrics not supported on android');
            }
          } else {
            // console.log(
            //   'No biometric hardware available on this Android device',
            // );
            setCanOpenScanner(false);
          }
        }
      } catch (err) {
        log.error('Error while checking/requesting Face ID permission:', err);
        setCanOpenScanner(false);
      }
    };

    checkFaceIdPermission();
  }, []);

  const openScanner = (callback: (message: string) => void): void => {
    if (canOpenScanner) {
      rnBiometrics
        .simplePrompt({
          promptMessage: "Confirm your fingerprint",
          fallbackPromptMessage: "Use your device credentials",
        })
        .then((result) => {
          if (result.success) {
            callback("Authentication successful");
          } else {
            callback("Authentication failed");
          }
        })
        .catch((error) => {
          callback("Authentication error: " + (error as Error).message);
        });
    } else {
      callback("Scanner not available or permission denied.");
    }
  };

  const checkSensor = (): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const { biometryType } = await rnBiometrics.isSensorAvailable();

        if (Platform.OS === 'ios') {
          if (biometryType === BiometryTypes.TouchID) {
            resolve("Touch ID");
          } else if (biometryType === BiometryTypes.FaceID) {
            resolve("Face ID");
          } else {
            reject("Biometrics not available");
          }
        }

        if (Platform.OS === 'android') {
          if (biometryType === BiometryTypes.Biometrics) {
            resolve("Fingerprint");
          } else {
            reject("Biometrics not available");
          }
        }
      } catch (error) {
        reject("Error checking biometrics: " + (error as Error).message);
      }
    });
  };

  const isBiometricEnrolled = (): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
      try {
        const { biometryType } = await rnBiometrics.isSensorAvailable();
        if (biometryType) {
          const { keysExist } = await rnBiometrics.biometricKeysExist();

          if (!keysExist) {
            const { publicKey } = await rnBiometrics.createKeys();
            resolve(!!publicKey);
          } else {
            resolve(true);
          }
        } else {
          resolve(false);
        }
      } catch (error) {
        reject("Error checking biometric enrollment: " + (error as Error).message);
      }
    });
  };

  return { checkSensor, openScanner, isBiometricEnrolled, canOpenScanner };
};

export default useBiometrics;
