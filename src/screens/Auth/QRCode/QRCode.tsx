import React, { FC, useCallback, useRef, useState } from 'react'
import { View } from 'react-native'
import { SafeScreen } from '@/components/template'
import QRCode from 'react-native-qrcode-svg';
import { useSelector } from '@/hooks';
import { RootState } from '@/store';
import { isImageSourcePropType } from '@/types';
import { Images, ImagesDark, useTheme } from '@/theme';
import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { useTranslation } from 'react-i18next';
import { shortenAddress } from '@/utils/shortenAddress';
import Clipboard from '@react-native-clipboard/clipboard';
import { Snackbar } from 'react-native-paper';
import Share from 'react-native-share';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import Svg from 'react-native-svg';
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser';

interface IProps { }

/**
* @author Nitesh Raj Khanal
* @function @QRCode
* @returns JSX.Element
**/


const QRCodeScreen: FC<IProps> = (props): JSX.Element => {

    const { layout, gutters, components, backgrounds } = useTheme()

    const { t } = useTranslation(["translations"])

    const { data: latestUser } = useFetchLatestUserQuery();

    const [snackBarVisible, setSnackBarVisible] = useState<boolean>(false);
    const [busy, setBusy] = useState<boolean>(false);
    const [imageSaved, setImageSaved] = useState<boolean>(false);

    const qrCodeRef = useRef<Svg | null>(null);


    if (
        !isImageSourcePropType(Images.solCrypto) ||
        !isImageSourcePropType(ImagesDark.solCrypto) ||
        !isImageSourcePropType(Images.walletCopy) ||
        !isImageSourcePropType(ImagesDark.walletCopy)
    ) {
        throw new Error("Image source is not valid")
    }

    const qrData = `${latestUser?.address}`

    const onToggleSnackBar = () => setSnackBarVisible(!snackBarVisible);

    const onDismissSnackBar = () => setSnackBarVisible(false);

    const copyToClipboard = useCallback(() => {
        Clipboard.setString(qrData);
        onToggleSnackBar()
    }, [qrData, snackBarVisible]);


    const saveQrToDisk = useCallback((): Promise<string> => {
        return new Promise((resolve, reject) => {
            const filePath = `${RNFS.CachesDirectoryPath}/${latestUser?.fullName}YarshaQrCode.png`;

            RNFS.exists(filePath)
                .then((exists) => {
                    if (exists) {
                        setImageSaved(true);
                        resolve(filePath);
                    } else {
                        if (qrCodeRef.current) {
                            setBusy(true);
                            qrCodeRef.current.toDataURL((data: string) => {
                                RNFS.writeFile(filePath, data, 'base64')
                                    .then(() => {
                                        return CameraRoll.saveToCameraRoll(filePath, 'photo');
                                    })
                                    .then(() => {
                                        setBusy(false);
                                        setImageSaved(true);
                                        resolve(filePath);
                                    })
                                    .catch((error) => {
                                        setBusy(false);
                                        console.error('Error saving QR code to disk: ', error);
                                        reject(error);
                                    });
                            });
                        } else {
                            reject(new Error('QR code reference is null'));
                        }
                    }
                })
                .catch((error) => {
                    console.error('Error checking file existence: ', error);
                    reject(error);
                });
        });
    }, [latestUser, qrCodeRef.current]);




    const shareTheQr = useCallback(() => {
        saveQrToDisk()
            .then((filePath) => {
                const shareOptions = {
                    title: 'Share QR Code',
                    url: 'file://' + filePath,
                    type: 'image/png',
                    message: "Here is my Wallet QR code!"
                };

                Share.open(shareOptions)
                    .then((res) => {
                        console.log('Share success:', res);
                    })
                    .catch((err) => {
                        if (err) console.error('Error sharing:', err);
                    });
            })
            .catch((error) => {
                console.error('Error in saving or sharing QR code:', error);
            });
    }, [saveQrToDisk]);


    return (
        <SafeScreen>
            <View style={[gutters.padding_14, layout.justifyBetween, layout.flex_1]}>
                <View style={[layout.justifyCenter, layout.itemsCenter, gutters.marginTop_40]}>
                    <QRCode
                        value={qrData}
                        logo={Images.solCrypto}
                        logoSize={50}
                        logoMargin={2}
                        logoBackgroundColor='white'
                        size={300}
                        logoBorderRadius={10}
                        getRef={(ref) => qrCodeRef.current = ref}
                    />
                    <View style={[layout.justifyCenter, layout.itemsCenter, gutters.marginTop_24]}>
                        <TextVariant style={[components.urbanist20BoldBlack]}>{t("yourSolanaAddress")}</TextVariant>
                        <View style={[gutters.paddingHorizontal_48, gutters.marginTop_14]}>
                            <TextVariant style={[components.urbanist14RegularBlack, components.textCenter]}>{t("useThisAddress")}</TextVariant>
                        </View>
                    </View>
                </View>
                <View>
                    <ButtonVariant onPress={copyToClipboard} style={[layout.row, components.blueBorderButton, layout.itemsCenter, gutters.padding_14, gutters.marginBottom_10, layout.justifyCenter]}>
                        <TextVariant style={[components.urbanist16SemiBoldPrimary, components.textCenter]}>{shortenAddress(latestUser?.address)}</TextVariant>
                        <ImageVariant
                            source={Images.walletCopy}
                            sourceDark={ImagesDark.walletCopy}
                            style={[gutters.marginLeft_8, components.iconSize18]}
                        />
                    </ButtonVariant>
                    <ButtonVariant onPress={shareTheQr} style={[components.blueBackgroundButton, gutters.padding_14]}>
                        <TextVariant style={[components.urbanist16SemiBoldWhite, components.textCenter]}>{t("share")}</TextVariant>
                    </ButtonVariant>
                </View>
            </View>
            <Snackbar
                visible={snackBarVisible}
                onDismiss={onDismissSnackBar}
                duration={10000}
                style={[components.blueBackgroundButton, gutters.marginBottom_14]}
            >
                <View style={[layout.itemsCenter]}>
                    <TextVariant style={[components.urbanist16SemiBoldWhite]}>{t("copiedToClipboard")}</TextVariant>
                </View>
            </Snackbar>
        </SafeScreen>
    )
}

export default React.memo(QRCodeScreen)