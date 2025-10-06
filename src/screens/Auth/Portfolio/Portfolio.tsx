import React, { FC, useState, useCallback } from 'react';
import { View, Platform, KeyboardAvoidingView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { TextVariant } from '@/components/atoms';
import { SafeScreen } from '@/components/template';
import {  useTheme } from '@/theme';
import { SafeScreenRouteProp } from '@/types';
import TokenCard from './TokenCard';
import { useRoute } from '@react-navigation/native';
import { useSelector } from '@/hooks';
import { RootState } from '@/store';


const Portfolio: FC = (): JSX.Element => {
    const { t } = useTranslation(['translations']);
    const { layout, gutters } = useTheme();
    const [selectedOption, setSelectedOption] = useState('Portfolio');
    const route = useRoute<SafeScreenRouteProp & { params: { 
        chatId?: string;
        type?: string;
        receivers?: any[];
        groupDetail?: any
        } }>();

    const renderItem = useCallback(
        ({ item }: { item: any }) => {
            return <TokenCard item={item as any} option={selectedOption} routeParams={route.params} />;
        },
        [selectedOption]
    );

    const balance = useSelector((state:RootState)=>state.solanaBalance.balance)

    return (
        <KeyboardAvoidingView
            style={[layout.flex_1]}
            {...(Platform.OS === 'ios' && { behavior: 'padding' })}
        >
            <SafeScreen>
                <View style={{ height: '100%' }}>
                    <View style={[layout.fullHeight, gutters.padding_14, layout.flex_1]}>
                        <FlashList
                            showsVerticalScrollIndicator={false}
                            data={[{"balance": balance, "decimals": 9, "logo": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png", "mint": "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr", "name": "Solana", "symbol": "SOL", "usdValue": 0},...[]]}
                            renderItem={renderItem}
                            keyExtractor={(item, index) => `token-${item.symbol}-${index}`}
                            estimatedItemSize={300}
                            contentContainerStyle={{
                                paddingBottom: 100
                            }}
                            ListEmptyComponent={() => {
                                return (
                                    <View>
                                        <TextVariant>{t("noContactFound")}</TextVariant>
                                    </View>
                                )
                            }}
                        />
                    
                    </View>
                </View>
            </SafeScreen>

        </KeyboardAvoidingView>
    );
};

export default React.memo(Portfolio);
