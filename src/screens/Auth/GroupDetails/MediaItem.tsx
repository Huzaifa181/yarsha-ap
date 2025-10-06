import React, { FC } from 'react';
import { View, Image, Text } from 'react-native';



interface IMediaItemProps {
    mediaSource: { uri: string };
    itemSize: number;
}

const MediaItem: FC<IMediaItemProps> = ({ mediaSource, itemSize }) => {
    return (
        <View style={{ alignItems: 'center' }}>
            <Image source={mediaSource} style={{ width: itemSize, height: itemSize, marginBottom: 5 }} />
        </View>
    );
};


export default MediaItem;
