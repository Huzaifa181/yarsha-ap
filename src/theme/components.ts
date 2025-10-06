import {ImageStyle, StyleSheet, TextStyle, ViewStyle} from 'react-native';
import type {ComponentTheme} from '@/types/theme/theme';
import {Urbanist} from './fonts';
import {heightToDp, moderateScale, widthToDp} from '@/utils';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";

interface AllStyle
  extends Record<string, AllStyle | ImageStyle | TextStyle | ViewStyle> {}

export default ({layout, backgrounds, fonts, colors}: ComponentTheme) => {
  return {
    buttonCircle: {
      ...layout.justifyCenter,
      ...layout.itemsCenter,
      ...backgrounds.purple100,
      ...fonts.gray400,
      height: 70,
      width: 70,
      borderRadius: 35,
    },
    circle250: {
      borderRadius: 140,
      height: 250,
      width: 250,
    },
    textCenter: {
      textAlign: 'center',
    },
    textLeft: {
      textAlign: 'left',
    },
    textRight: {
      textAlign: 'right',
    },
    urbanist10BoldInactive: {
      ...Urbanist.bold,
      fontSize: RFPercentage(1.0),
      color: colors.inactive,
    },
    urbanist10BoldActive: {
      ...Urbanist.bold,
      fontSize: RFPercentage(1.0),
      color: colors.active,
    },
    urbanist12RegularWhite: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.2),
      color: colors.white,
    },
    urbanist12RegularMessageReceived: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.2),
      color: colors.messageReceviedTime,
    },
    urbanist12BoldInactive: {
      ...Urbanist.bold,
      fontSize: RFPercentage(1.2),
      color: colors.inactive,
    },
    urbanist12BoldActive: {
      ...Urbanist.bold,
      fontSize: RFPercentage(1.2),
      color: colors.active,
    },
    urbanist10SemiboldPrimary: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(1.0),
      color: colors.primary,
    },
    urbanist10BoldIncrease: {
      ...Urbanist.bold,
      fontSize: RFPercentage(1.0),
      color: colors.increase,
    },
    urbanist10SemiboldLightText: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(1.0),
      color: colors.lightText,
    },
    urbanist10SemiboldmessageSenderText: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(1.0),
      color: colors.messageSenderText,
    },
    urbanist10RegularmessageSenderText: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.0),
      color: colors.messageSenderText,
    },
    urbanist12SemiBoldBlack: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(1.2),
      color: colors.dark,
    },
    urbanist12BoldIncrease: {
      ...Urbanist.bold,
      fontSize: RFPercentage(1.2),
      color: colors.increase,
    },
    urbanist12BoldDecrease: {
      ...Urbanist.bold,
      fontSize: RFPercentage(1.2),
      color: colors.decrease,
    },
    urbanist12RegularBlack: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.2),
      color: colors.dark,
    },
    urbanist12RegularDate: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.2),
      color: colors.date,
    },
    urbanist12RegularError: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.2),
      color: colors.error,
    },
    urbanist12RegularPrimary: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.2),
      color: colors.primary,
    },
    urbanist12RegularwalletAddressPlaceholder: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.2),
      color: colors.walletAddressPlaceholder,
    },
    urbanist12SemiboldWhite: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(1.2),
      color: colors.white,
    },
    urbanist13RegularBlack: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.3),
      color: colors.dark,
    },
    urbanist14RegularBlack: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.4),
      color: colors.dark,
    },
    urbanist14textInputPlaceholder: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.4),
      color: colors.textInputPlaceholder,
    },
    urbanist14SemiboldLightText: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(1.4),
      color: colors.lightText,
    },
    urbanist14RegularEmojiDark: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.4),
      color: colors.emojiDark,
    },
    urbanist14RegularError: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.4),
      color: colors.error,
    },
    urbanist14RegularPrimary: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.4),
      color: colors.primary,
    },
    urbanist14RegularcodeDark: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.4),
      color: colors.codeDark,
      opacity: 0.6,
    },
    urbanist14RegularLight: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.4),
      color: colors.textLight,
    },
    urbanist16RegularLight: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.6),
      color: colors.textLight,
    },
    urbanist14RegularWhite: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.4),
      color: colors.white,
    },
    urbanist14RegularSecondary: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.4),
      color: colors.textSecondary,
    },
    urbanist14RegularMessageSenderText: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.4),
      color: colors.messageSenderText,
    },
    urbanist14RegularTertiary: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.4),
      color: colors.textTertiary,
    },
    urbanist14MediumBlack: {
      ...Urbanist.medium,
      fontSize: RFPercentage(1.4),
      color: colors.dark,
    },
    urbanist14MediumPrimary: {
      ...Urbanist.medium,
      fontSize: RFPercentage(1.4),
      color: colors.primary,
    },
    urbanist14MediumcancelText: {
      ...Urbanist.medium,
      fontSize: RFPercentage(1.4),
      color: colors.cancelText,
    },
    urbanist14RegularcancelText: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.4),
      color: colors.cancelText,
    },
    urbanist14BoldBlack: {
      ...Urbanist.bold,
      fontSize: RFPercentage(1.4),
      color: colors.dark,
    },
    urbanist14SemiBoldPrimary: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(1.4),
      color: colors.primary,
    },
    urbanist1BoldPrimary: {
      ...Urbanist.bold,
      fontSize: RFPercentage(1.4),
      color: colors.primary,
    },
    urbanist14SemiBoldWhite: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(1.4),
      color: colors.white,
    },
    urbanist14SemiBoldBlack: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(1.4),
      color: colors.dark,
    },
    urbanist14SemiBoldmessageSender: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.4),
      color: colors.messageSenderText,
    },
    urbanist16RegularWhite: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.6),
      color: colors.white,
    },
    urbanist16SemiBoldPlaceholder: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(1.6),
      color: colors.textInputPlaceholder,
    },
    urbanist16RegularPlaceholder: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(1.6),
      color: colors.textInputPlaceholder,
    },
    urbanist16SemiBoldWhite: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(1.6),
      color: colors.white,
    },
    urbanist16messageSender: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(1.6),
      color: colors.messageSenderText,
    },
    urbanist16SemiBoldPrimary: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(1.6),
      color: colors.primary,
    },
    urbanist16SemiBoldDark: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(1.6),
      color: colors.dark,
    },
    urbanist16RegularMessageSendText: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.6),
      color: colors.messageSenderText,
    },
    urbanist16SemiBoldTextLight: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(1.6),
      color: colors.textLight,
    },
    urbanist16SemiBoldInactive: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(1.6),
      color: colors.inactiveSegment,
    },
    urbanist16RegulartextInputPlaceholder: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.6),
      color: colors.textInputPlaceholder,
    },
    urbanist16BoldDark: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(1.6),
      color: colors.dark,
    },
    urbanist16BoldPrimary: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(1.6),
      color: colors.primary,
    },
    urbanist16BoldBoldPrimary: {
      ...Urbanist.bold,
      fontSize: RFPercentage(1.6),
      color: colors.primary,
    },
    urbanist18RegularBlack: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.8),
      color: colors.dark,
    },
    urbanist18BoldBlack: {
      ...Urbanist.bold,
      fontSize: RFPercentage(1.8),
      color: colors.dark,
    },
    urbanist18BoldIncrease: {
      ...Urbanist.bold,
      fontSize: RFPercentage(1.8),
      color: colors.increase,
    },
    urbanist18BoldDecrease: {
      ...Urbanist.bold,
      fontSize: RFPercentage(1.8),
      color: colors.decrease,
    },
    urbanist18BoldWhite: {
      ...Urbanist.bold,
      fontSize: RFPercentage(2),
      color: colors.white,
    },
    urbanist18SemiBoldDark: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(2),
      color: colors.dark,
    },
    urbanist18SemiBoldPrimary: {
      ...Urbanist.semiBold,
      fontSize: RFPercentage(2),
      color: colors.primary,
    },
    urbanist18BoldPrimary: {
      ...Urbanist.bold,
      fontSize: RFPercentage(2),
      color: colors.primary,
    },
    urbanist18RegularLightText: {
      ...Urbanist.regular,
      fontSize: RFPercentage(2),
      color: colors.lightText,
    },
    urbanist20MediumBlack: {
      ...Urbanist.medium,
      fontSize: RFPercentage(2),
      color: colors.dark,
    },
    urbanist20MediumDarkSecondary: {
      ...Urbanist.medium,
      fontSize: RFPercentage(2),
      color: colors.darkSecondary,
    },
    urbanist20RegularDark: {
      ...Urbanist.regular,
      fontSize: RFPercentage(2),
      color: colors.dark,
    },
    urbanist20BoldBlack: {
      ...Urbanist.bold,
      fontSize: RFPercentage(2),
      color: colors.dark,
    },
    urbanist20BoldPrimary: {
      ...Urbanist.bold,
      fontSize: RFPercentage(2),
      color: colors.primary,
    },
    urbanist20BoldtextInputPlaceholder: {
      ...Urbanist.bold,
      fontSize: RFPercentage(2),
      color: colors.textInputPlaceholder,
    },
    urbanist20BoldWhite: {
      ...Urbanist.bold,
      fontSize: RFPercentage(2),
      color: colors.white,
    },
    urbanist20RegulartextInputPlaceholder: {
      ...Urbanist.regular,
      fontSize: RFPercentage(2),
      color: colors.textInputPlaceholder,
    },
    urbanist24BoldBlack: {
      ...Urbanist.bold,
       fontSize: RFPercentage(2.4),
      color: colors.dark,
    },
    urbanist24semiBoldBlack: {
      ...Urbanist.semiBold,
       fontSize: RFPercentage(2.4),
      color: colors.dark,
    },
    urbanist24RegularBlack: {
      ...Urbanist.regular,
       fontSize: RFPercentage(2.4),
      color: colors.dark,
    },
    urbanist24BoldWhite: {
      ...Urbanist.bold,
       fontSize: RFPercentage(2.4),
      color: colors.white,
    },
    urbanist26BoldBlack: {
      ...Urbanist.bold,
       fontSize: RFPercentage(2.6),
      color: colors.dark,
    },    
    urbanist30BoldBlack: {
      ...Urbanist.bold,
      fontSize: RFPercentage(3.0),
      color: colors.dark,
    },
    urbanist48RegularBlack: {
      ...Urbanist.regular,
      fontSize: RFPercentage(4.8),
      color: colors.dark,
    },
    urbanist40RegularWhite: {
      ...Urbanist.regular,
      fontSize: RFPercentage(4.0),
      color: colors.white,
    },
    urbanist48RegularWhite: {
      ...Urbanist.regular,
      fontSize: RFPercentage(4.8),
      color: colors.white,
    },
    urbanist16RegularBlack: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.6),
      color: colors.textLight,
    },
    urbanist16RegularDark: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.6),
      color: colors.dark,
    },
    urbanist12RegularDark: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.2),
      color: colors.dark,
    },
    urbanist16RegularRed: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.6),
      color: colors.error,
    },
    urbanist16RegularPrimary: {
      ...Urbanist.regular,
      fontSize: RFPercentage(1.6),
      color: colors.primary,
    },
    blueBackgroundButton: {
      backgroundColor: colors.primary,
      borderRadius: moderateScale(8),
    },
    redBackgroundButton: {
      backgroundColor: colors.red,
      borderRadius: moderateScale(8),
    },
    disabledButton: {
      backgroundColor: colors.textInputPlaceholder,
      borderRadius: moderateScale(8),
    },
    blueBorderButton: {
      borderWidth: moderateScale(1),
      borderColor: colors.primary,
      borderRadius: moderateScale(8),
    },
    iconDown: {height: 8.3, width: 12.5},
    iconSize20: {
      height: heightToDp(20),
      width: widthToDp(20),
    },
    iconSize10: {
      height: heightToDp(10),
      width: widthToDp(10),
    },
    iconHeight15width4:{
      height: heightToDp(15),
      width: widthToDp(4),
    },
    iconHeight2width4:{
      height: heightToDp(2),
      width: widthToDp(4),
    },
    iconSize12: {
      height: heightToDp(12),
      width: widthToDp(12),
    },
    iconSize14: {
      height: heightToDp(14),
      width: widthToDp(14),
    },
    iconSize16: {
      height: heightToDp(16),
      width: widthToDp(16),
    },
    iconSize18: {
      height: heightToDp(18),
      width: widthToDp(18),
    },
    iconSize22: {
      height: heightToDp(22),
      width: widthToDp(22),
    },
    iconSize24: {
      height: heightToDp(24),
      width: widthToDp(24),
    },
    iconSize28: {
      height: heightToDp(28),
      width: widthToDp(28),
    },
    iconSize32: {
      height: heightToDp(32),
      width: widthToDp(32),
    },
    iconSize34: {
      height: heightToDp(34),
      width: widthToDp(34),
    },
    iconSize35: {
      height: heightToDp(35),
      width: widthToDp(35),
    },
    iconSize37: {
      height: heightToDp(37),
      width: widthToDp(37),
    },
    iconSize38: {
      height: heightToDp(38),
      width: widthToDp(38),
    },
    iconSize40: {
      height: heightToDp(40),
      width: widthToDp(40),
    },
    imageSize48: {
      height: heightToDp(48),
      width: widthToDp(48),
    },
    imageSize52: {
      height: heightToDp(52),
      width: widthToDp(52),
    },
    imageSize56: {
      height: heightToDp(56),
      width: widthToDp(56),
    },
    imageSize80: {
      height: heightToDp(80),
      width:  widthToDp(80),
    },
    imageSize90: {
      height: heightToDp(90),
      width: widthToDp(90),
    },
    imageSize150: {
      height: heightToDp(150),
      width: widthToDp(150),
    },
    overlayContent: {
      ...StyleSheet.absoluteFillObject,
      ...layout.z2,
      ...layout.justifyCenter,
      ...layout.itemsCenter,
    },
    absoluteBlur: {
      ...StyleSheet.absoluteFillObject,
      ...layout.z1,
      borderRadius: 10,
      borderWidth: 0.5,
      borderColor: colors.tertiary,
    },
    blackBackground: {
      backgroundColor: colors.white,
      ...StyleSheet.absoluteFillObject,
      ...layout.z0,
      opacity: 0.7,
      borderRadius: 10,
    },
    headerBottom: {
      borderBottomWidth: 0.5,
      borderBottomColor: colors.secondary,
    },
    messageExpanded: {
      borderBottomWidth: 0.5,
      borderBottomColor: colors.secondary,
    },
    messageSendBar: {
      borderTopWidth: 0.5,
      borderTopColor: colors.secondary,
    },
    borderTopRight8: {
      borderTopRightRadius: 8,
    },
    borderTopRight20: {
      borderTopRightRadius: 20,
    },
    borderTopLeft20: {
      borderTopLeftRadius: 20,
    },
    borderBottomRight20: {
      borderBottomRightRadius: 20,
    },
    borderBottomLeft20: {
      borderBottomLeftRadius: 20,
    },
    borderRadius14: {
      borderRadius: 14,
    },
    borderTopLeftRadius14: {
      borderTopLeftRadius: 14,
    },
    borderTopRightRadius14: {
      borderTopRightRadius: 14,
    },
    borderBottomLeftRadius14: {
      borderBottomLeftRadius: 14,
    },
    borderBottomRightRadius14: {
      borderBottomRightRadius: 14,
    },
    borderBottom: {
      borderBottomWidth: 0.5,
      borderColor: colors.tertiary,
    },
    sendAmountTopBorder: {
      borderTopWidth: 1,
      borderColor: `${colors.sendAmountBottomBorder}40`,
    },
    borderRadius8: {
      borderRadius: 800,
    },
    borderRadiusTop: {
      borderTopEndRadius: 5,
      borderTopStartRadius: 10,
    },
    borderRadiusBottom: {
      borderBottomEndRadius: 20,
      borderBottomStartRadius: 10,
    },
    activeTabStyle: {
      borderRadius: 500,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}20`,
      paddingHorizontal: 15,
      paddingVertical: 10,
    },
    inactiveTabStyle: {
      borderRadius: 500,
      borderWidth: 1,
      borderColor: colors.cream,
      paddingHorizontal: 15,
      paddingVertical: 10,
    },
    borderBottom02: {
      borderBottomWidth: 0.2,
    },
    unreadBackground: {
      backgroundColor: `${colors.primary}20`,
    },
    switch: {
      transform: [{scaleX: 0.7}, {scaleY: 0.7}],
    },
    switchContainer: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconOverlay: {
      position: 'absolute',
    },
    leftNeg_14: {
      marginLeft: -14,
    },
    leftNeg_8: {
      marginLeft: -8,
    },
    fontSize20: {
      fontSize: 20,
    },
    letterSpacing1: {
      letterSpacing: 1,
    },
    phoneNumberInput: {
      borderLeftWidth: 1,
      borderTopRightRadius: 10,
      borderBottomRightRadius: 10,
    },
    edgeSwipeArea: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 30,
      backgroundColor: 'transparent',
      zIndex: 10,
    },
    indicator: {
      position: 'absolute',
      bottom: 0,
      height: 2,
      backgroundColor: colors.primary,
    },
  } as const satisfies AllStyle;
};
