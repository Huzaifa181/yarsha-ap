import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { MultiMediaMenu } from '@/data';
import { useTheme } from '@/theme';
import React, { FC } from 'react';
import { View, StyleSheet, Dimensions, FlatList } from 'react-native';

interface IProps {
    docPicker: () => void;
    blinksPicker: () => void;
    photosPicker: () => void;
    gifPicker: () => void;
    cameraPicker: () => void;
    videosPicker: () => void;
}

/**
 * @author Nitesh Raj Khanal
 * @function @MultiMediaPicker
 **/

const MultiMediaPicker: FC<IProps> = ({ docPicker, blinksPicker, cameraPicker, gifPicker, photosPicker, videosPicker }) => {
    const { layout, gutters, backgrounds, components, borders } = useTheme();

    const containerWidth = Dimensions.get('window').width;
    const numColumns = 4;
    const itemWidth = containerWidth / numColumns;


    const tapMultiMediaAction = (multiMediaType: string) => {
        if (multiMediaType === 'documents') {
            docPicker();
        } else if (multiMediaType === "blinks") {
            blinksPicker();
        } else if (multiMediaType === "photos") {
            photosPicker();
        } else if (multiMediaType === "gif") {
            gifPicker();
        } else if (multiMediaType === "camera") {
            cameraPicker();
        } else if (multiMediaType === "videos") {
            videosPicker();
        } else {
            console.log('Invalid');
        }
    }


    return (
        <View style={[layout.flex0_6, backgrounds.multiMediaPickerBg, layout.itemsCenter, layout.justifyCenter
            // gutters.paddingTop_50
        ]}>
            <FlatList
                scrollEnabled={false}
                numColumns={numColumns}
                data={MultiMediaMenu}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={[layout.justifyCenter, layout.flex_1]}
                renderItem={({ item }) => {
                    return (
                        <View style={[layout.itemsCenter, layout.justifyCenter, gutters.marginVertical_10, { width: itemWidth }]}>
                            <ButtonVariant
                                onPress={() => tapMultiMediaAction(item.key)}
                            >
                                <View style={[borders.rounded_500,
                                backgrounds.white,
                                layout.itemsCenter,
                                layout.justifyCenter,
                                components.imageSize56]}>
                                    <ImageVariant
                                        source={item.icon}
                                        sourceDark={item.iconDark}
                                        style={[components.imageSize48]}
                                    />
                                </View>
                                <TextVariant style={[components.textCenter, components.urbanist12RegularBlack, gutters.marginTop_10]}>{item.title}</TextVariant>
                            </ButtonVariant>
                        </View>
                    );
                }}
            />
        </View>
    );
};

export default MultiMediaPicker;
