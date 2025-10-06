import { useTheme } from "@/theme";
import { ScrollView, View, Dimensions } from "react-native";
import SkeletonPlaceholder from "react-native-skeleton-placeholder";

const RenderBlinkSkeletonPlaceholder = () => {
    const { gutters } = useTheme();
    const screenWidth = Dimensions.get('window').width;
    const itemSize = (screenWidth / 3) - 16; 

    return (
        <ScrollView style={[gutters.marginVertical_12]}>
            <SkeletonPlaceholder>
                <>
                    {
                        Array.from({ length: 10 }).map((_, rowIndex) => (
                            <View
                                key={rowIndex}
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    marginBottom: 16,
                                }}
                            >
                                {Array.from({ length: 3 }).map((_, colIndex) => (
                                    <SkeletonPlaceholder.Item
                                        key={colIndex}
                                        width={itemSize}
                                        height={itemSize}
                                        borderRadius={8}
                                    />
                                ))}
                            </View>
                        ))}
                </>
            </SkeletonPlaceholder>
        </ScrollView>
    );
};

export default RenderBlinkSkeletonPlaceholder;
