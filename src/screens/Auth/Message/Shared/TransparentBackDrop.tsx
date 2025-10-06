import React from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

const TransparentBackdrop = ({ animatedIndex, style, onPress }: BottomSheetBackdropProps & { onPress: () => void }) => {
    return (
        <Pressable
            style={[style, { backgroundColor: 'transparent', flex: 1 }]}
            onPress={onPress}
        >
            <View style={{ flex: 1 }} />
        </Pressable>
    );
};

export default TransparentBackdrop;
