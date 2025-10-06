import {
  heightPercentToDp,
  heightToDp,
  moderateScale,
  widthToDp,
} from '@/utils';
import {ViewStyle} from 'react-native';

export default {
  maxHeight50: {
    maxHeight: 50,
  },
  height60:{
    height: 60,
  },
  maxHeight60: {
    maxHeight: 60,
  },
  maxHeight70: {
    maxHeight: 70,
  },
  maxHeight150: {
    maxHeight: 150,
  },
  flex0_6: {
    flex: 0.6,
  },
  flex0_7: {
    flex: 0.7,
  },
  flexGrow: {
    flexGrow: 1,
  },
  flexShrink1: {
    flexShrink: 1,
  },
  flexShrink0: {
    flexShrink: 0,
  },
  col: {
    flexDirection: 'column',
  },
  colReverse: {
    flexDirection: 'column-reverse',
  },
  wrap: {
    flexWrap: 'wrap',
  },
  row: {
    flexDirection: 'row',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  itemsCenter: {
    alignItems: 'center',
  },
  itemsSelfCenter: {
    alignSelf: 'center',
  },
  itemsStart: {
    alignItems: 'flex-start',
  },
  itemsStretch: {
    alignItems: 'stretch',
  },
  itemsEnd: {
    alignItems: 'flex-end',
  },
  alignSelfItemsEnd: {
    alignSelf: 'flex-end',
  },
  alignSelfItemsStart: {
    alignSelf: 'flex-start',
  },
  alignBetween: {
    alignSelf: 'stretch',
  },
  justifyCenter: {
    justifyContent: 'center',
  },
  justifyAround: {
    justifyContent: 'space-around',
  },
  justifyBetween: {
    justifyContent: 'space-between',
  },
  justifyEnd: {
    justifyContent: 'flex-end',
  },
  justifyEvenly: {
    justifyContent: 'space-evenly',
  },
  justifyStart: {
    justifyContent: 'flex-start',
  },
  /* Sizes Layouts */
  flex_1: {
    flex: 1,
  },
  fullWidth: {
    width: '100%',
  },
  fullHeight: {
    height: '100%',
  },
  /* Positions */
  relative: {
    position: 'relative',
  },
  absolute: {
    position: 'absolute',
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  topNeg45: {
    top: -45,
  },
  topNeg40: {
    top: -40,
  },
  topNeg35: {
    top: -35,
  },
  topNeg34: {
    top: -34,
  },
  topNeg33: {
    top: -33,
  },
  topNeg32: {
    top: -32,
  },
  topNeg31: {
    top: -31,
  },
  topNeg30: {
    top: -30,
  },
  topNeg29: {
    top: -29,
  },
  topNeg28: {
    top: -28,
  },
  topNeg27: {
    top: -27,
  },
  topNeg26: {
    top: -26,
  },
  topNeg25: {
    top: -25,
  },
  top0: {
    top: 0,
  },
  bottom0: {
    bottom: 0,
  },
  top20Percentage: {
    top: heightPercentToDp('20'),
  },
  top21Percentage: {
    top: heightPercentToDp('21'),
  },
  top2105Percentage: {
    top: heightPercentToDp('21.5'),
  },
  top22Percentage: {
    top: heightPercentToDp('22'),
  },
  top23Percentage: {
    top: heightPercentToDp('23'),
  },
  top26percentage: {
    top: heightPercentToDp('26'),
  },
  top27percentage: {
    top: heightPercentToDp('27'),
  },
  top28percentage: {
    top: heightPercentToDp('28'),
  },
  left0: {
    left: 0,
  },
  left10: {
    left: 10,
  },
  right0: {
    right: 0,
  },
  z1: {
    zIndex: 1,
  },
  z10: {
    zIndex: 10,
  },
  z100: {
    zIndex: 100,
  },
  width80: {
    width: '80%',
  },
  width85: {
    width: '85%',
  },
  minWidth30: {
    minWidth: '25%',
  },
  border1: {
    borderWidth: moderateScale(0.5),
  },
  height6: {
    height: 6,
  },
  height120: {
    height: 120,
  },
  width115: {
    width: 115,
  },
  overflowHidden: {
    overflow: 'hidden',
  },
  borderDotted: {
    borderStyle: 'dotted',
  },
  borderDashed: {
    borderStyle: 'dashed',
  },
  height250: {
    height: 250,
  },
  width250: {
    width: 250,
  },
  height152: {
    height: 152,
  },
  width152: {
    width: 152,
  },
  right10: {
    right: 10,
  },
  right20: {
    right: 20,
  },
  bottom15: {
    bottom: 15,
  },
  bottom20: {
    bottom: 20,
  },
  bottom40: {
    bottom: 40,
  },
  bottom60: {
    bottom: 60,
  },
  bottom70: {
    bottom: 70,
  },
  bottom90: {
    bottom: 90,
  },
  bottom120: {
    bottom: 120,
  },
  bottom160: {
    bottom: 160,
  },
  width40: {
    width: 40,
  },
  height40: {
    height: 40,
  },
  zNeg10: {
    zIndex: -10,
  },
  z0: {
    zIndex: 0,
  },
  z2: {
    zIndex: 2,
  },
  height40p: {
    height: '40%',
  },
  height45p: {
    height: '45%',
  },
  height45px: {
    height: heightToDp(45),
  },
  height50px: {
    height: heightToDp(50),
  },
  height90px: {
    height: 90,
  },
  height80px: {
    height: 80,
  },
  height70px: {
    height: heightToDp(70),
  },
  height90p: {
    height: '90%',
  },
  width45px: {
    width: 45,
  },
  width45p: {
    width: '45%',
  },
  width50px: {
    width: widthToDp(50),
  },
  width48: {
    width: 48,
  },
  height48: {
    height: 48,
  },
  width50p: {
    width: '50%',
  },
  width70px: {
    width: 70,
  },
  width70p: {
    width: '70%',
  },
  width75p: {
    width: '75%',
  },
  width80p: {
    width: '80%',
  },
  width90p: {
    width: '90%',
  },
  height15: {
    height: 15,
  },
  width15: {
    width: 15,
  },
  height20: {
    height: 20,
  },
  width20: {
    width: 20,
  },
  height30: {
    height: 30,
  },
  width30: {
    width: 30,
  },
  width35: {
    width: 35,
  },
  height80: {
    height: 80,
  },
  height70:{
    height: 70,
  },
  width80px: {
    width: 80,
  },
  height30px: {
    height: 30,
  },
  width30px: {
    width: 30,
  },
  width55px: {
    width: 55,
  },
  height55px: {
    height: 55,
  },
  width175px: {
    width: 175,
  },
  height175px: {
    height: 175,
  },
  bottom_neg25: {
    bottom: -25,
  },
  height300px: {
    height: 300,
  },
  width300px: {
    width: 300,
  },
  height330px: {
    height: 330,
  },
  width330px: {
    width: 330,
  },
  width190px: {
    width: 190,
  },
  height190px: {
    height: 190,
  },
  height100px: {
    height: 100,
  },
  width100px: {
    width: 100,
  },
  absoluteFillObject: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
} as const satisfies Record<string, ViewStyle>;
