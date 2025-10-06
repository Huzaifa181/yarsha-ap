import { ImageVariant, TextVariant } from '@/components/atoms';
import { SafeScreen } from '@/components/template';
import { Images, useTheme } from '@/theme';
import React, { FC } from 'react';
import { ScrollView, View } from 'react-native';

const PrivacyPolicy: FC = () => {
        const { components, gutters } = useTheme();
        return (
                <SafeScreen>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[gutters.marginHorizontal_20]}>
                                <ImageVariant
                                        style={{ width: 150, height: 100, alignSelf: 'center', marginVertical: 10 }}
                                        resizeMode="contain"
                                        source={Images.brand}
                                />

                                {section('Yarsha Privacy Policy', `
Yarsha ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the Yarsha mobile application. By using Yarsha, you consent to the practices described in this policy.
We collect information that you voluntarily provide during your use of the app, including your phone number and any direct communication with our team. Yarsha enables end-to-end encrypted chat; your messages are encrypted client-side and are not stored or accessible by Yarsha servers.
If you are using an Android device, we may collect internet activity, biometric identifiers, images, audio, video, access to external storage, camera usage, your contact list, and push notification tokens. For iOS users, the app may collect camera and contact access, Face ID authentication, location data if permission is granted, photo library access, Apple Music usage where applicable, microphone input, internet activity, and push notification tokens. This data is used solely to power core app features, diagnostics, and security, and not for advertising purposes.
We use your information to enable encrypted messaging, token transactions, notifications, bug tracking, app optimization, and secure access. We do not sell or share your personal data with advertisers or third-party marketing platforms. Your data is used exclusively to operate and improve Yarsha.
As Yarsha facilitates blockchain-based interactions via Solana Blinks, your wallet address and token transactions are executed on the public Solana blockchain. These actions are permanent and outside of our control. You are responsible for verifying any on-chain actions before confirming them. We do not have access to reverse, modify, or delete blockchain data.
To provide and maintain Yarsha’s core infrastructure, we rely on third-party services that may process limited user data for performance, analytics, or communication. These integrations include Firebase Analytics for usage metrics, Firebase Crashlytics for crash reporting, Twilio for SMS-based verification, Sentry for application monitoring, and Google Cloud Storage (Multi-Region US) for secure data storage. Each service operates under its own privacy policy and adheres to industry security standards.
We implement appropriate security measures to protect the personal data we process, but no method of internet transmission or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
We retain your data only as long as necessary to fulfill the purposes described in this policy, unless a longer retention period is required or permitted by law. You can manage permissions for the camera, location, microphone, contacts, and other features directly through your device settings. Disabling certain permissions may affect your ability to use parts of the app.
Yarsha is not intended for use by individuals under the age of 18. We do not knowingly collect data from children. If we become aware that such information has been collected, we will promptly delete it.
We may occasionally update this Privacy Policy to reflect changes to our practices or legal requirements. When we do, we will revise the “Last Updated” date above. Continued use of Yarsha after updates constitutes your acceptance of the revised policy.
If you have questions or concerns about this Privacy Policy, you can contact us at: contact@yarsha.app`)}
                        </ScrollView>
                </SafeScreen>
        );
};

const section = (title: string, body: string) => {
        const { components, gutters } = useTheme();
        return (
                <View style={[gutters.marginTop_15]}>
                        <TextVariant style={[components.urbanist18BoldBlack]}>{title}</TextVariant>
                        <TextVariant style={[components.urbanist16RegularBlack, gutters.marginTop_5]}>
                                {body.trim()}
                        </TextVariant>
                </View>
        );
};

export default PrivacyPolicy;