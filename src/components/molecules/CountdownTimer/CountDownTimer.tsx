import { TextVariant } from "@/components/atoms";
import { useTheme } from "@/theme";
import React, {
    useState,
    useEffect,
    useRef,
    forwardRef,
    useImperativeHandle,
} from "react";
import { useTranslation } from "react-i18next";
import { View, ViewStyle, TextStyle } from "react-native";

interface CountDownTimerProps {
    timestamp?: number;
    delay?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    showSecondsOnly?: boolean;
    timerCallback?: (finished: boolean) => void;
    timerOnProgress?: (remainingTime: number) => void;
    containerStyle?: ViewStyle;
    textStyle?: TextStyle;
}

export interface CountDownTimerRef {
    resetTimer: () => void;
}

const CountDownTimer = forwardRef<CountDownTimerRef, CountDownTimerProps>(
    (
        {
            timestamp = 0,
            delay = 1000,
            days = 0,
            hours = 0,
            minutes = 0,
            seconds = 0,
            showSecondsOnly = false,
            timerCallback,
            timerOnProgress,
            containerStyle,
            textStyle,
        },
        ref
    ) => {
        const { t } = useTranslation(["translations"])
        const [timeStamp, setTimeStamp] = useState<number>(timestamp);
        const [sendOnce, setSendOnce] = useState<boolean>(true);
        const [finalDisplayTime, setFinalDisplayTime] = useState<string>("");
        const [isVisible, setIsVisible] = useState<boolean>(true);

        const { layout, components } = useTheme()

        useInterval(() => {
            if (timeStamp > 0) {
                setTimeStamp((prev) => prev - 1);
                timerOnProgress?.(timeStamp - 1);
            } else if (sendOnce) {
                timerCallback?.(true);
                setSendOnce(false);
                setIsVisible(false);
            }

            let delta = timeStamp;
            const calculatedDays = Math.floor(delta / 86400);
            delta -= calculatedDays * 86400;
            const calculatedHours = Math.floor(delta / 3600) % 24;
            delta -= calculatedHours * 3600;
            const calculatedMinutes = Math.floor(delta / 60) % 60;
            delta -= calculatedMinutes * 60;
            const calculatedSeconds = delta % 60;

            let displayTime = "";

            if (showSecondsOnly) {
                displayTime = `${timeStamp}s`;
            } else {
                displayTime = `${calculatedDays > 0 ? `${calculatedDays}:` : ""
                    }${String(calculatedHours).padStart(2, "0")}:${String(
                        calculatedMinutes
                    ).padStart(2, "0")}:${String(calculatedSeconds).padStart(2, "0")}`;
            }

            setFinalDisplayTime(displayTime);
        }, delay);

        useImperativeHandle(ref, () => ({
            resetTimer: () => {
                setTimeStamp(timestamp);
                setSendOnce(true);
                setIsVisible(true);
            },
        }));

        if (!isVisible) {
            return null;
        }

        return (
            <View>
                <View style={[layout.row, containerStyle, layout.itemsSelfCenter]}>
                    <TextVariant style={[textStyle,components.urbanist14RegularEmojiDark]}>{t("resendOTPin")}</TextVariant>
                    <TextVariant style={[textStyle, components.urbanist14RegularPrimary]}>{finalDisplayTime}</TextVariant>
                </View>
            </View>
        );
    }
);

function useInterval(callback: () => void, delay: number) {
    const savedCallback = useRef<() => void>();

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        function tick() {
            savedCallback.current?.();
        }
        if (delay !== null) {
            const id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}

export default CountDownTimer;
