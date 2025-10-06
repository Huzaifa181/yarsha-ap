import React, {
    forwardRef,
    useImperativeHandle,
    useRef,
    ReactNode,
    useCallback,
} from 'react';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';

export interface BottomSheetManagerRef {
    open: () => void;
    close: () => void;
}

interface BottomSheetManagerProps {
    onAction: (action: string) => void;
    children?: ReactNode;
}

export const BottomSheetManager = forwardRef<BottomSheetManagerRef, BottomSheetManagerProps>(
    ({ onAction, children }, ref) => {
        const sheetRef = useRef<BottomSheetModal>(null);

        useImperativeHandle(ref, () => ({
            open: () => sheetRef.current?.present(),
            close: () => sheetRef.current?.dismiss(),
        }));

        const renderBackdrop = useCallback(
            (
                props: React.JSX.IntrinsicAttributes & BottomSheetDefaultBackdropProps,
            ) => (
                <BottomSheetBackdrop
                    appearsOnIndex={0}
                    disappearsOnIndex={-1}
                    {...props}
                />
            ),
            [],
        );

        return (
            <BottomSheetModal
                ref={sheetRef}
                index={0}
                snapPoints={['25%']}
                backdropComponent={renderBackdrop}
                enableDismissOnClose
                enablePanDownToClose={true}
            >
                <BottomSheetView style={{ flex: 1,}}>
                    {children}
                </BottomSheetView>
            </BottomSheetModal>
        );
    }
);
