import {SharedValue, withSpring} from 'react-native-reanimated';

let openCardId: string | null = null;
let openTranslateXRef: SharedValue<number> | null = null;

export const setActiveCard = (id: string, translateX: SharedValue<number>) => {
  if (
    openCardId &&
    openCardId !== id &&
    openTranslateXRef &&
    openTranslateXRef.value !== 0
  ) {
    openTranslateXRef.value = withSpring(0, {
      damping: 20,
      stiffness: 200,
    });
  }

  openCardId = id;
  openTranslateXRef = translateX;
};

export const closeActiveCard = () => {
  if (openCardId && openTranslateXRef) {
    openTranslateXRef.value = withSpring(0, {
      damping: 20,
      stiffness: 200,
    });
  }
};
