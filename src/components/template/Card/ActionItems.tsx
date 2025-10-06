import { StyleSheet } from "react-native";
import Reanimated, { SharedValue, useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { memo, useMemo, useState } from "react";
import { Images, useTheme } from "@/theme";
import { ButtonVariant, ImageVariant } from "@/components/atoms";

export type TAction = {
  id: string;
  Icon: any;
  ActiveIcon: any;
  color: string;
  pinned?: boolean;
  muted?: boolean;
};

const ACTIONS: TAction[] = [
  { id: 'mute', Icon: Images.mute, ActiveIcon: Images.unmute_home, color: '#F19B33' },
  {
    id: 'thrash',
    Icon: Images.thrash,
    ActiveIcon: Images.thrash,
    color: '#FF3737',
  },
  { id: 'pin', Icon: Images.pin, ActiveIcon: Images.unpin, color: '#00C900' },
];

const buttonWidth = 80;
type Props = {
  prog: SharedValue<number>;
  drag: SharedValue<number>;
  parentDrag: SharedValue<number>;
  handleActionPress: any;
  pinned?: boolean;
  muted?: boolean;
};

const ActionItems = ({ drag, parentDrag, handleActionPress,muted,pinned }: Props) => {
  console.log("muted or pinned", muted, pinned);
  const styles = useMemo(() => createStyles(ACTIONS.length), [ACTIONS.length]);
  const [selectedAction, setSelectedAction] = useState<null | TAction>(null);
  const { layout, components } =
    useTheme();
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: drag.value + (buttonWidth * ACTIONS.length) }],
    };
  });

  // Do not remove this. We use this to tell the parent when the user is dragging.
  const animatedProps = useAnimatedProps(() => {
    parentDrag.value = drag.value;
    return {}
  },
    [],
  );


  const handlePress = (action: TAction) => {
    setSelectedAction(action);
    if (typeof handleActionPress === 'function') {
      handleActionPress(action);
    } else {
      console.error('handleActionPress is not a function');
    }
  };

  return (
    <Reanimated.View style={[styles.container, animatedStyle]}>
      {ACTIONS.map((action, index) => (
        <ButtonVariant
          key={action.id}
          style={[
            layout.row,
            layout.itemsCenter,
            layout.justifyCenter,
            layout.width80px,
            {borderRightWidth: index === ACTIONS.length - 1 ? 0 : 1, borderRightColor: '#E5E5E5'},
            { backgroundColor: action.color, borderTopRightRadius: index === ACTIONS.length - 1 ? 10 : 0, borderBottomRightRadius: index === ACTIONS.length - 1 ? 10 : 0, borderTopLeftRadius: index === 0 ? 10 : 0, borderBottomLeftRadius: index === 0 ? 10 : 0 },
          ]}
          onPress={() => handlePress(action)}
        >
          <ImageVariant
            source={
              action.id === 'mute'
                ? muted
                  ? action.ActiveIcon
                  : action.Icon
                : action.id === 'pin'
                  ? pinned
                    ? action.ActiveIcon
                    : action.Icon
                  : action.Icon
            }
            style={[components.iconSize28]}
            resizeMode="contain"
          />
        </ButtonVariant>
      ))}
    </Reanimated.View>
  );
};

const createStyles = (actionButtonsCount: number) =>
  StyleSheet.create({
    container: {
      width: buttonWidth * actionButtonsCount,
      flexDirection: 'row',
    },
  });

export default memo(ActionItems);