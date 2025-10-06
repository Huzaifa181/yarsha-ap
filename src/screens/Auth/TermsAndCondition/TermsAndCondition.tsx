import { ImageVariant, TextVariant } from '@/components/atoms';
import { SafeScreen } from '@/components/template';
import { Images, useTheme } from '@/theme';
import React, { FC } from 'react';
import { ScrollView, View, Text } from 'react-native';

const TermsAndCondition: FC = () => {
    const { components, gutters } = useTheme();

    return (
        <SafeScreen>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[gutters.marginHorizontal_20]}>
                <ImageVariant
                    style={{ width: 150, height: 100, alignSelf: 'center', marginVertical: 10 }}
                    resizeMode="contain"
                    source={Images.brand}
                />

                <TextVariant style={[components.urbanist16RegularBlack, { textAlign: 'center', marginBottom: 15 }]}>
                    Welcome to Yarsha. By using this app, you agree to the following terms:
                </TextVariant>

                {section('Acceptance of Terms', `
By accessing or using Yarsha (“we,” “us,” or “the App”), you agree to be bound by these Terms of Service (“Terms”). If you do not agree, please do not use Yarsha. Yarsha is a beta chat application that enables secure messaging and allows users to send, receive, and store Solana-based tokens by interacting with Blinks (Solana on-chain action links) via chat.
        `)}

                {section('Who Can Use Yarsha', `
You must be at least 18 years old, or the legal age of majority in your jurisdiction, to use Yarsha. By using the App, you confirm that you meet this requirement.
        `)}

                {section('Account Registration, Use & Responsibility', `
You may be required to register for an account using your phone number. You agree to provide accurate and complete information and to keep this information up to date. You are responsible for maintaining the confidentiality of your account and any associated credentials. You are solely liable for all activities that occur under your account.
        `)}

                {section('Wallet Creation and Management', `
When you verify your phone number via OTP, Yarsha automatically generates a Solana wallet. Your private key is encrypted using AES-256 and securely stored—only the encrypted version is saved. Yarsha does not have access to the decrypted private key. You are responsible for your device and backup credentials. Loss of access may result in permanent loss of assets. All transactions are irreversible and occur on the Solana blockchain.
        `)}

                {section('What You Cannot Do', `
Do not use Yarsha to spam, impersonate, harass, promote illegal or violent content, exploit vulnerabilities, or violate laws. We may suspend or disable violators.
        `)}

                {section('Core Features', `
Yarsha enables end-to-end encrypted chat, Solana token transfers, on-chain actions via Blinks, token-enabled groups, and airdrop distributions.
        `)}

                {section('Blockchain Disclaimer', `
All Solana blockchain actions are irreversible. Yarsha is not responsible for user mistakes, lost funds, or Solana network issues. Always double-check addresses and actions before confirming.
        `)}

                {section('Third-Party Integrations', `
Yarsha uses third-party services for diagnostics and communication: Firebase (Analytics, Crashlytics), Twilio, Sentry, and Google Cloud. These may collect limited usage data as part of essential operations.
        `)}

                {section('Data Collection', `
Depending on your OS, Yarsha may access internet, camera, biometrics, contacts, location, etc., to provide essential features. We do not sell your data. Data is used only for functionality, diagnostics, and security.
        `)}

                {section('Beta Software Notice', `
Yarsha is in beta. Features may break or change. We do not guarantee uptime or performance and are not liable for losses during the beta period.
        `)}

                {section('Updates to These Terms', `
These Terms may change. We’ll notify you of material updates. Continued use after updates indicates acceptance.
        `)}

                {section('Termination of Service', `
We may suspend or terminate access at any time, especially for harmful behavior or Terms violations.
        `)}

                {section('Contact', `
If you have any questions, reach us at: contact@yarsha.app
        `)}

                {section('Privacy Policy Summary', `
We encrypt your messages client-side, and they are not stored on our servers. We only collect necessary device permissions and usage data for app functionality. Your data is never sold or shared with advertisers. Blockchain actions are public and irreversible. We implement strong security but cannot guarantee 100% protection.
        `)}
            </ScrollView>
        </SafeScreen>
    );
};

// Reusable section block
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

export default TermsAndCondition;