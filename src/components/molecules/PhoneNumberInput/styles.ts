import {StyleSheet, Dimensions, ViewStyle, TextStyle, ImageStyle} from 'react-native';

const {width: viewportWidth, height: viewportHeight} = Dimensions.get('window');

function wp(percentage: number): number {
  const value = (percentage * viewportWidth) / 100;
  return Math.round(value);
}

function hp(percentage: number): number {
  const value = (percentage * viewportHeight) / 100;
  return Math.round(value);
}

interface StylesProps {
  container: ViewStyle;
  flagButtonView: ViewStyle;
  flagButtonExtraWidth: ViewStyle;
  shadow: ViewStyle;
  dropDownImage: ImageStyle;
  textContainer: ViewStyle;
  codeText: TextStyle;
  numberText: TextStyle;
}

const styles = StyleSheet.create<StylesProps>({
  container: {
    width: wp(80),
    backgroundColor: 'white',
    flexDirection: 'row',
    height: hp(5),
    alignItems: 'center',
  },
  flagButtonView: {
    width: wp(20),
    height: '100%',
    minWidth: 32,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagButtonExtraWidth: {
    width: wp(23),
  },
  shadow: {
    shadowColor: 'rgba(0,0,0,0.4)',
    shadowOffset: {
      width: 1,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
  dropDownImage: {
    height: 14,
    width: 12,
  },
  textContainer: {
    flex: 1,
    backgroundColor: '#F8F9F9',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeText: {
    fontSize: 16,
    marginRight: 10,
    fontWeight: '500',
    color: '#000000',
  },
  numberText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
});

export default styles;
