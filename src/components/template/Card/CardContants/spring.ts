export const LIGHT_SPRING_CONFIG = {
    damping: 25,
    mass: 1,
    stiffness: 120,
    overshootClamping: false,
    restSpeedThreshold: 0.01,
    restDisplacementThreshold: 0.01,
};

export const MEDIUM_SPRING_CONFIG = {
    damping: 18,
    mass: 1,
    stiffness: 320,
    overshootClamping: true,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
};
