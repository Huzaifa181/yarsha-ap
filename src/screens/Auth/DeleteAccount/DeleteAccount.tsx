import React, { FC, useCallback, useEffect, useState, useRef, useMemo } from 'react'
import { View, TextInput, Modal } from 'react-native'
import { useTranslation } from 'react-i18next'
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from 'react-native-reanimated'

import {
    ButtonVariant,
    ImageVariant,
    InputVariant,
    TextVariant,
} from '@/components/atoms'
import { SafeScreen } from '@/components/template'
import { deleteConsequences, deleteReasons } from '@/data/deleteReason'
import { Images, ImagesDark, useTheme } from '@/theme'
import { SafeScreenNavigationProp } from '@/types'
import { useNavigation } from '@react-navigation/native'
import { useDispatch } from '@/hooks'
import { clearAuthToken, clearSolanaBalance, setAccountDeleted } from '@/store/slices'
import { useDeleteUserMutation } from '@/hooks/domain/delete/useDelete'
import { ActivityIndicator } from 'react-native-paper'
import { getSocket } from '@/services'
import UserRepository from '@/database/repositories/User.repository'
import ChatsRepository from '@/database/repositories/Chats.repository'
import GroupChatRepository from '@/database/repositories/GroupChat.repository'
import MessageRepository from '@/database/repositories/Message.repository'
import FriendsRepository from '@/database/repositories/Friends.repository'
import YarshaContactsRepository from '@/database/repositories/YarshaContacts.Repository'

interface IProps { }

const DeleteAccount: FC<IProps> = () => {
    const { components, gutters, layout, backgrounds, colors } = useTheme()
    const { t } = useTranslation('translations')
    const navigation = useNavigation<SafeScreenNavigationProp>()
    const dispatch = useDispatch()

    const [deleteUser, { isLoading }] = useDeleteUserMutation()

    const [steps, setSteps] = useState<number>(1)
    const [deleteReason, setDeleteReason] = useState<string>('')
    const [deleteText, setDeleteText] = useState<string>('')
    const [selectedReasons, setSelectedReasons] = useState<number[]>([])
    const [isAnimating, setIsAnimating] = useState<boolean>(false)
    const [presentModal, setPresentModal] = useState<boolean>(false)

    const deleteReasonInputRef = useRef<TextInput>(null)
    const deleteTextInputRef = useRef<TextInput>(null)

    const opacity = useSharedValue(1)

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }))
    const isOtherSelected = useMemo(() => selectedReasons.includes(5), [selectedReasons])

    const toggleReason = useCallback((id: number) => {
        setSelectedReasons(prev =>
            prev.includes(id)
                ? prev.filter(rid => rid !== id)
                : [...prev, id]
        )
    }, [])

    const switchStep = useCallback(
        (newStep: number) => {
            setIsAnimating(true)
            opacity.value = withTiming(0, { duration: 200 }, () => {
                runOnJS(setSteps)(newStep)
                opacity.value = withTiming(1, { duration: 200 }, () => {
                    runOnJS(setIsAnimating)(false)
                })
            })
        },
        [opacity]
    )

    const nextStepAction = useCallback(async () => {
        if (isAnimating) return
        if (steps === 1) switchStep(2)
        else if (steps === 2) switchStep(3)
        else if (steps === 3) {

            const selectedReasonTexts = deleteReasons
                .filter(r => selectedReasons.includes(r.id) && r.reason !== 'Other')
                .map(r => r.reason)

            const finalReasons = [...selectedReasonTexts]

            if (selectedReasons.includes(5) && deleteReason.trim()) {
                finalReasons.push(deleteReason.trim())
            }

            try {
                await deleteUser({ reason: finalReasons }).unwrap()
                const socket = getSocket();
                socket?.disconnect();
                dispatch(clearAuthToken());
                dispatch(clearSolanaBalance());
                await UserRepository.clearAllUsers();
                await ChatsRepository.deleteAllGroupChats();
                await GroupChatRepository.deleteAllGroupChats();
                await MessageRepository.deleteAllMessages();
                await FriendsRepository.deleteAllFriends();
                await YarshaContactsRepository.deleteAllContacts();
                setPresentModal(true)
            } catch (error) {
                console.error('Delete failed:', error)
            }
        }

    }, [steps, switchStep, isAnimating])

    const cancelAction = useCallback(() => {
        if (isAnimating) return
        if (steps === 1) {
            setDeleteReason('')
            setDeleteText('')
            setSelectedReasons([])
            navigation.goBack()
        } else if (steps === 2) switchStep(1)
        else if (steps === 3) switchStep(2)
    }, [steps, switchStep, isAnimating])

    const handleDeleteReasonChange = useCallback((text: string) => {
        setDeleteReason(text)
    }, [])

    const handleDeleteTextChange = useCallback((text: string) => {
        setDeleteText(text)
    }, [])

    const StepOne = () => (
        <View style={[gutters.padding_14, layout.flex_1]}>
            <TextVariant style={[components.urbanist26BoldBlack]}>
                {t('whyAreYouLeaving')}
            </TextVariant>

            <TextVariant
                style={[gutters.marginVertical_10, components.urbanist16RegularLight]}
            >
                {t('selectOneOrMoreReasons')}
            </TextVariant>

            {deleteReasons.map((item) => {
                const isSelected = selectedReasons.includes(item.id)
                return (
                    <ButtonVariant
                        key={item.id}
                        onPress={() => toggleReason(item.id)}
                        style={[gutters.paddingVertical_8, layout.row, layout.itemsCenter]}
                    >
                        <ImageVariant
                            source={isSelected ? Images.checkContact : Images.uncheckedContact}
                            sourceDark={isSelected ? Images.checkContact : Images.uncheckedContact}
                            style={[components.iconSize24, gutters.marginRight_8]}
                        />
                        <TextVariant style={[components.urbanist16RegularLight]}>
                            {item.reason}
                        </TextVariant>
                    </ButtonVariant>
                )
            })}

            <InputVariant
                ref={deleteReasonInputRef}
                placeholder={t('enterYourReason')}
                placeholderTextColor={'#B7B7B7'}
                onChangeText={handleDeleteReasonChange}
                value={deleteReason}
                multiline={false}
                numberOfLines={1}
                style={[layout.height60, gutters.marginTop_10]}
                editable={!isAnimating && isOtherSelected}
                autoFocus={steps === 1 && isOtherSelected}
            />

        </View>
    )

    const StepTwo = () => (
        <View style={[gutters.padding_14, layout.flex_1]}>
            <TextVariant style={[components.urbanist26BoldBlack]}>
                {t('deleteYourYarshaAccount')}
            </TextVariant>

            <TextVariant
                style={[gutters.marginVertical_10, components.urbanist16RegularLight]}
            >
                {t('deleteYourYarshaAccountDescription')}
            </TextVariant>

            {deleteConsequences.map((item, index) => (
                <View
                    key={index}
                    style={[gutters.paddingVertical_8, layout.row, layout.itemsCenter]}
                >
                    <ImageVariant
                        source={Images.crossRed}
                        sourceDark={Images.crossRed}
                        style={[components.iconSize24, gutters.marginRight_8]}
                    />
                    <TextVariant style={[components.urbanist16RegularLight]}>
                        {item.reason}
                    </TextVariant>
                </View>
            ))}
        </View>
    )

    const StepThree = () => (
        <View style={[gutters.padding_14, layout.flex_1]}>
            <TextVariant style={[components.urbanist26BoldBlack]}>
                {t('deleteAccount')}
            </TextVariant>

            <TextVariant
                style={[gutters.marginVertical_10, components.urbanist16RegularLight]}
            >
                {t('areYourSureYouWantToDelete')}
            </TextVariant>

            <TextVariant
                style={[components.urbanist16RegularDark, gutters.marginBottom_10]}
            >
                {t('toConfirmTypeDelete')}
            </TextVariant>

            <InputVariant
                ref={deleteTextInputRef}
                placeholder="DELETE"
                placeholderTextColor={'#B7B7B7'}
                onChangeText={handleDeleteTextChange}
                value={deleteText}
                multiline={false}
                numberOfLines={1}
                style={[layout.height60, gutters.marginTop_10]}
                editable={!isAnimating}
                autoFocus={steps === 3}
            />
        </View>
    )

    const renderStep = () => {
        if (steps === 1) return <StepOne />
        if (steps === 2) return <StepTwo />
        return <StepThree />
    }

    const isStep1Invalid = steps === 1 && selectedReasons.length === 0
    const isStep3Invalid = steps === 3 && deleteText !== 'DELETE'
    const isDisabled = isStep1Invalid || isStep3Invalid || isLoading

    useEffect(() => {
        if (!presentModal) return

        const proceedAfterDispatch = async () => {
            await new Promise(resolve => setTimeout(resolve, 2000))

            await dispatch(setAccountDeleted(true))

            navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
            })

            setPresentModal(false)
        }

        proceedAfterDispatch()
    }, [presentModal, dispatch, navigation])



    return (
        <SafeScreen>
            <Modal
                animationType="slide"
                transparent={true}
                visible={presentModal}
                onRequestClose={() => {
                    setPresentModal(!presentModal);
                }}>
                <View style={[backgrounds.white, layout.flex_1, layout.itemsCenter, layout.justifyCenter, gutters.paddingHorizontal_20]}>
                    <ImageVariant
                        source={Images.actionCompleted}
                        sourceDark={ImagesDark.actionCompleted}
                        style={[layout.height55px, layout.width55px, gutters.marginBottom_20]}
                    />
                    <TextVariant style={[components.urbanist26BoldBlack, components.textCenter]}>{t("accountDeleted")}</TextVariant>
                    <TextVariant style={[components.urbanist16RegularLight, components.textCenter, gutters.marginTop_10]}>{t("accountDeletedDescription")}</TextVariant>
                </View>
            </Modal>

            <Animated.View style={[layout.flex_1, animatedStyle]}>
                {renderStep()}
            </Animated.View>

            <View style={[layout.flex_1, layout.justifyEnd]}>
                <ButtonVariant
                    disabled={isDisabled}
                    onPress={nextStepAction}
                    style={[
                        isDisabled
                            ? components.disabledButton
                            : components.redBackgroundButton,
                        gutters.paddingVertical_14,
                        layout.itemsCenter,
                        gutters.marginHorizontal_14,
                    ]}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color={colors.white} />
                    ) : (<TextVariant style={[components.urbanist16SemiBoldWhite]}>
                        {steps !== 3 ? t('continueToDelete') : t('delete')}
                    </TextVariant>)}
                </ButtonVariant>

                <ButtonVariant onPress={cancelAction}>
                    <TextVariant
                        style={[
                            components.urbanist16SemiBoldTextLight,
                            components.textCenter,
                            gutters.paddingVertical_14,
                            gutters.marginHorizontal_14,
                            gutters.marginTop_10,
                        ]}
                    >
                        {steps === 1 ? t('cancel') : t('goBack')}
                    </TextVariant>
                </ButtonVariant>
            </View>
        </SafeScreen >
    )
}

export default React.memo(DeleteAccount)
