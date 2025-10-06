import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    LayoutChangeEvent,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import emoji from "emoji-datasource";
import { useTheme } from "@/theme";
import { FlashList } from "@shopify/flash-list";

export type EmojiObject = typeof emoji[0];

const Categories = {
    history: { symbol: "🕘", name: "Recently used", key: "history" },
    smileys: { symbol: "😀", name: "Smileys & Emotion", key: "smileys-emotion" },
    people: { symbol: "🧑", name: "People & Body", key: "people-body" },
    animals: { symbol: "🦄", name: "Animals & Nature", key: "animals-nature" },
    food: { symbol: "🍔", name: "Food & Drink", key: "food-drink" },
    activities: { symbol: "⚾️", name: "Activities", key: "activities" },
    places: { symbol: "✈️", name: "Travel & Places", key: "travel-places" },
    objects: { symbol: "💡", name: "Objects", key: "objects" },
    symbols: { symbol: "🔣", name: "Symbols", key: "symbols" },
    flags: { symbol: "🏳️‍🌈", name: "Flags", key: "flags" },
};

const storageKey = "@emoji-selector:HISTORY";

const charFromUtf16 = (utf16: string): string =>
    String.fromCodePoint(...utf16.split("-").map((u) => parseInt(u, 16)));

const charFromEmojiObject = (obj: EmojiObject): string => charFromUtf16(obj.unified);

const filteredEmojis = emoji.filter((e) => !e.obsoleted_by);

const emojiByCategory = (category: string): EmojiObject[] =>
    filteredEmojis.filter((e) => e.category === category);

const sortEmoji = (list: EmojiObject[]): EmojiObject[] =>
    list.sort((a, b) => a.sort_order - b.sort_order);

const categoryKeys = Object.keys(Categories);

interface EmojiSelectorProps {
    theme?: string;
    columns?: number;
    placeholder?: string;
    showTabs?: boolean;
    showSearchBar?: boolean;
    showHistory?: boolean;
    onEmojiSelected: (emoji: string) => void;
}

const EmojiSelector: React.FC<EmojiSelectorProps> = ({
    theme = "#007AFF",
    columns = 6,
    placeholder = "Search Emoji...",
    showTabs = true,
    showSearchBar = true,
    showHistory = false,
    onEmojiSelected,
}) => {
    const { layout, gutters, borders, components } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");
    const [category, setCategory] = useState(Categories.people);
    const [history, setHistory] = useState<EmojiObject[]>([]);
    const [emojiList, setEmojiList] = useState<Record<string, EmojiObject[]>>({});
    const [colSize, setColSize] = useState(0);
    const [isReady, setIsReady] = useState(false);

    const loadHistory = async () => {
        try {
            const result = await AsyncStorage.getItem(storageKey);
            if (result) {
                const parsedHistory = JSON.parse(result);
                setHistory(Array.isArray(parsedHistory) ? parsedHistory : []);
            }
        } catch (error) {
            console.error("Error loading emoji history from AsyncStorage:", error);
            setHistory([]);
        }
    };


    const addToHistory = async (emoji: EmojiObject) => {
        try {
            const existingHistory = await AsyncStorage.getItem(storageKey);
            let updatedHistory: EmojiObject[] = [];
            if (existingHistory) {
                const parsedHistory: EmojiObject[] = JSON.parse(existingHistory);
                if (!parsedHistory.some((item) => item.unified === emoji.unified)) {
                    updatedHistory = [emoji, ...parsedHistory];
                } else {
                    updatedHistory = parsedHistory;
                }
            } else {
                updatedHistory = [emoji];
            }
            await AsyncStorage.setItem(storageKey, JSON.stringify(updatedHistory));
            setHistory(updatedHistory);
        } catch (error) {
            console.error("Error updating emoji history in AsyncStorage:", error);
        }
    };

    const handleTabSelect = (selectedCategory: typeof Categories[keyof typeof Categories]) => {
        setSearchQuery("");
        setCategory(selectedCategory);
    };

    const handleEmojiSelect = (emoji: EmojiObject) => {
        if (showHistory) {
            addToHistory(emoji);
        }
        onEmojiSelected(charFromEmojiObject(emoji));
    };

    const prerenderEmojis = useCallback(() => {
        const emojiData: Record<string, EmojiObject[]> = {};
        categoryKeys.forEach((key) => {
            const categoryName = Categories[key as keyof typeof Categories].name;
            emojiData[categoryName] = sortEmoji(emojiByCategory(categoryName));
        });
        setEmojiList(emojiData);
        setIsReady(true);
    }, [categoryKeys]);

    useEffect(() => {
        if (showHistory) {
            loadHistory();
        }
        prerenderEmojis();
    }, [showHistory, prerenderEmojis]);

    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        const calculatedColSize = Math.floor(width / columns);
        setColSize(calculatedColSize > 0 ? calculatedColSize : 1);
    }, [columns]);

    const filterEmojiData = () => {
        if (!category || !emojiList || !filteredEmojis) return [];

        if (searchQuery) {
            return filteredEmojis
                .filter((e) =>
                    e.short_names.some((name) => name.includes(searchQuery.toLowerCase()))
                )
                .map((emoji) => ({ key: emoji.unified, emoji }));
        }

        const categoryName = category.name;
        const emojiData =
            categoryName === Categories.history.name ? history : emojiList[categoryName] || [];
        return emojiData.map((emoji) => ({ key: emoji.unified, emoji }));
    };


    const renderEmojiCell = ({ item }: { item: { key: string; emoji: EmojiObject } }) => (
        <TouchableOpacity
            style={[layout.justifyCenter, layout.itemsCenter, { width: colSize, height: colSize }]}
            onPress={() => handleEmojiSelect(item.emoji)}
        >
            <Text style={{ fontSize: colSize - 12 }}>{charFromEmojiObject(item.emoji)}</Text>
        </TouchableOpacity>
    );

    const filteredData = useMemo(() => filterEmojiData(), [searchQuery, category, history, emojiList]);

    return (
        <View style={[layout.height300px]} onLayout={handleLayout}>
            {showTabs && (
                <View style={[layout.row]}>
                    {categoryKeys.map((key) => (
                        <TouchableOpacity
                            key={key}
                            style={[
                                layout.itemsCenter, layout.justifyCenter, gutters.padding_10, layout.flex_1, borders.wBottom_2,
                                {
                                    borderBottomColor: category === Categories[key as keyof typeof Categories] ? theme : "#EEEEEE",
                                },
                            ]}
                            onPress={() => handleTabSelect(Categories[key as keyof typeof Categories])}
                        >
                            <Text style={[components.fontSize20]}>{Categories[key as keyof typeof Categories].symbol}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            {showSearchBar && (
                <TextInput
                    style={[gutters.margin_10, gutters.padding_10, borders.w_1, borders.rounded_5, borders.textTertiary]}
                    placeholder={placeholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            )}
            {isReady ? (
                <FlashList
                    data={filteredData}
                    renderItem={renderEmojiCell}
                    numColumns={columns}
                    keyExtractor={(item) => item.key}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    estimatedItemSize={colSize}
                    bounces={false}
                    bouncesZoom={false}
                    scrollEventThrottle={16}
                    removeClippedSubviews={true}
                />
            ) : (
                <ActivityIndicator size="large" color={theme} />
            )}
        </View>
    );
};

export default React.memo(EmojiSelector);
