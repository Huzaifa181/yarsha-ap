import React, { FC, JSX, useEffect, useState } from 'react'
import { SafeScreen } from '@/components/template'
import { SearchBar } from '@/components/molecules'
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser'
import { Images, useTheme } from '@/theme'
import { groupTransactionsByDate } from '@/utils/getTransactionUtilityByDate'
import {
    getSignatures,
    getTransactionDetails,
    TransformedTransaction,
    transformTransactionData,
} from '@/utils/walletSignatures'
import FastImage from '@d11/react-native-fast-image'
import { PublicKey } from '@solana/web3.js'
import { useTranslation } from 'react-i18next'
import {
    View,
    Text,
    SectionList,
    ListRenderItem,
} from 'react-native'
import { ImageVariant, TextVariant } from '@/components/atoms'
import { shortenAddress } from '@/utils/shortenAddress'
import { formatSmartTimestamp } from '@/utils'

interface IProps { }

type TransactionSection = {
    title: string
    data: TransformedTransaction[]
}

/**
 * @author Nitesh Raj Khanal
 * @function @History
 * @returns React.JSX.Element
 **/

const History: FC<IProps> = (props): React.JSX.Element => {
    const { layout, gutters, borders, components, backgrounds } = useTheme()
    const { t } = useTranslation(['translations'])

    const [searchQuery, setSearchQuery] = useState<string>('')
    const [transactions, setTransactions] = useState<TransactionSection[]>([])

    const { data: currentUser } = useFetchLatestUserQuery()

    useEffect(() => {
        const fetchSignaturesAndDetails = async () => {
            if (!currentUser?.address) return

            try {
                const publicKey = new PublicKey(currentUser.address)
                const signatures = await getSignatures(publicKey, 20)

                const detailedTransactions = await Promise.all(
                    signatures.map(async (sig) => {
                        const details = await getTransactionDetails(sig.signature)
                        return { signature: sig.signature, details }
                    }),
                )

                const structuredData = detailedTransactions
                    .map((tx) => transformTransactionData(tx, currentUser.address))
                    .filter((tx): tx is TransformedTransaction => tx !== null && tx !== undefined)

                const sectionedData = groupTransactionsByDate(structuredData)
                console.log('Sectioned Data:', sectionedData)
                setTransactions(sectionedData)
            } catch (error) {
                console.error('❌ Error fetching transaction details:', error)
            }
        }

        fetchSignaturesAndDetails()
    }, [currentUser?.address])

    const renderItem: ListRenderItem<TransformedTransaction> = ({ item }) => (
        <View style={[gutters.marginVertical_4,]}>
            <View style={[layout.row, layout.fullWidth, layout.justifyBetween, layout.itemsCenter]}>
                <View style={[layout.row, layout.itemsCenter]}>
                    <FastImage
                        source={{ uri: item.icon }}
                        style={[components.imageSize52, borders.rounded_10]}
                        resizeMode="contain"
                    />
                    <View style={[gutters.gap_8, gutters.marginLeft_10]}>
                        <View style={[layout.row, layout.itemsCenter]}>
                            <TextVariant style={[components.urbanist16SemiBoldDark]}>{item.type}</TextVariant>
                            {
                                item.type === "Sent" && (
                                    <ImageVariant
                                        source={Images.transactionComplete}
                                        sourceDark={Images.transactionComplete}
                                        style={[components.iconSize14, gutters.marginLeft_6]}
                                    />
                                )
                            }
                        </View>
                        <TextVariant style={[components.urbanist14RegularLight]}>{shortenAddress(item.counterparty)}</TextVariant>
                    </View>
                </View>
                <View style={[layout.row, layout.itemsCenter, layout.justifyBetween, gutters.marginLeft_10,]}>


                    <View style={[gutters.gap_8]}>
                        <View style={[layout.row, layout.itemsCenter]}>
                            <ImageVariant
                                source={Images.solanaDark}
                                sourceDark={Images.solanaDark}
                                style={[components.iconSize18, gutters.marginRight_6]}
                                resizeMode='contain'
                            />
                            <TextVariant style={[item.type === "Received" ? components.urbanist18BoldIncrease : components.urbanist18BoldDecrease]}>{item.displayAmount}</TextVariant>
                        </View>
                        <TextVariant style={[components.urbanist14RegularLight, components.textRight]}>
                            {formatSmartTimestamp(item.timestamp)}
                        </TextVariant>
                    </View>
                </View>
            </View>

        </View>
    )

    const renderSectionHeader = ({ section }: { section: TransactionSection }) => (
        <View style={[backgrounds.white, gutters.paddingVertical_10]}>
            <TextVariant style={[components.urbanist16RegularDark]}>
                {section.title}
            </TextVariant>
        </View>
    )

    return (
        <SafeScreen>
            <View style={[layout.flex_1, gutters.paddingHorizontal_14]}>
                <SearchBar
                    placeholder={t('search')}
                    searchQuery={searchQuery}
                    onChangeSearchQuery={(value) => setSearchQuery(value)}
                />

                <SectionList
                    sections={transactions}
                    keyExtractor={(item) => item.signature}
                    renderItem={renderItem}
                    scrollEventThrottle={16}
                    renderSectionHeader={renderSectionHeader}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    style={[layout.flex_1]}
                />
            </View>
        </SafeScreen>
    )
}

export default React.memo(History)
