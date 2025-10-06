import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { SearchBar, SegmentedControl } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { useSelector } from '@/hooks';
import {
  useCheckYarshaUsersMutation,
  useFetchDeviceContactsQuery,
  useFetchYarshaContactsQuery,
} from '@/hooks/domain';
import { CheckYarshaUserRequest } from '@/pb/users';
import { RootState } from '@/store';
import { Images, ImagesDark, useTheme } from '@/theme';
import { ContactsScreenSpace } from '@/types';
import { heightPercentToDp } from '@/utils';
import { generateRequestHeader } from '@/utils/requestHeaderGenerator';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import {
  BottomSheetDefaultBackdropProps,
} from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { FlashList } from '@shopify/flash-list';
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Linking,
  Platform,
  View,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import PhoneInput from '@/components/molecules/PhoneNumberInput';
import ContactItem from './ContactItem';
import ContactsList from 'react-native-contacts';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';

interface HeaderItem {
  type: 'header';
  title: string;
}

type FlashListItem = ContactsScreenSpace.Contact | HeaderItem;

const Contacts: FC = (): React.JSX.Element => {
  const { t } = useTranslation(['translations']);
  const { height } = Dimensions.get('window');
  const { layout, gutters, backgrounds, borders, components, colors } =
    useTheme();

  const [checkYarshaUsers, { isLoading: isContactsLoading }] =
    useCheckYarshaUsersMutation();
  const {
    data: matchedUsers,
    isLoading: isYarshaContactsLoading,
    refetch: refetchYarshaContacts,
  } = useFetchYarshaContactsQuery({});
  const {
    data: contacts,
    error,
    isLoading: isDeviceContactsLoading,
    refetch: refetchDeviceContacts,
  } = useFetchDeviceContactsQuery({ shouldFetch: true }, { skip: true });

  const phoneInput = useRef<any>(null);
  const defaultCountryCode = useSelector(
    (state: RootState) => state.countryCode.countryCode
  );

  const [contactCreatedAlert, setContactCreatedAlert] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOption, setSelectedOption] =
    useState<'Contacts' | 'Invite'>('Contacts');
  const [newContactData, setNewContactData] = useState<{
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }>({ firstName: '', lastName: '', phoneNumber: '' });

  const [lastAddedNumber, setLastAddedNumber] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const firstNameRef = useRef<any>(
    null
  );
  const lastNameRef = useRef<any>(
    null
  );
  const flashListRef = useRef<FlashList<FlashListItem>>(null);

  const yarshaNumbers = useMemo(() => {
    if (!matchedUsers) return new Set<string>();
    return new Set(
      matchedUsers.map(u =>
        u.phoneNumber.replace(/(?!^\+)[\s\(\)\-\+]/g, '')
      )
    );
  }, [matchedUsers]);

  const isPermissionDeniedError = (err: unknown): boolean =>
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    (err as any).status === 'PERMISSION_DENIED';

  const fetchContacts = useCallback(async () => {
    if (!contacts || !contacts.length) return;

    const header = await generateRequestHeader();
    const phoneNumbersList = contacts.flatMap((c: any) =>
      c.phoneNumbers.map((p: any) => p.number)
    );

    const req: CheckYarshaUserRequest = {
      body: { contactList: phoneNumbersList },
      requestHeader: {
        deviceId: header.DeviceId,
        deviceModel: header.DeviceModel,
        requestId: header.RequestId,
        timestamp: header.Timestamp,
      },
    };

    await checkYarshaUsers(req).unwrap();
    await refetchYarshaContacts();
  }, [contacts, checkYarshaUsers, refetchYarshaContacts]);

  useEffect(() => {
    if (!lastAddedNumber || !matchedUsers) return;
    const inApp = matchedUsers.some(
      (u) => u.phoneNumber === lastAddedNumber
    );
    setSelectedOption(inApp ? 'Contacts' : 'Invite');
    setContactCreatedAlert(true);
    setLastAddedNumber(null);
  }, [matchedUsers, lastAddedNumber]);

  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  useEffect(() => {
    const askPermission = async () => {
      const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.CONTACTS : PERMISSIONS.ANDROID.READ_CONTACTS;
      const result = await check(permission);
      setPermissionStatus(result);
      if (result === RESULTS.GRANTED) {
        await refetchDeviceContacts();
        fetchContacts();
      } else if (result === RESULTS.DENIED) {
        const granted = await request(permission);
        setPermissionStatus(granted);
        if (granted === RESULTS.GRANTED) {
          await refetchDeviceContacts();
          fetchContacts();
        }
      }
    };

    askPermission();
  }, []);

  const saveNewContact = useCallback(async () => {
    const formatted =
      phoneInput.current
        ?.getNumberAfterPossiblyEliminatingZero()
        ?.formattedNumber ?? '';
    const payload = {
      phoneNumbers: [{ label: 'mobile', number: formatted }],
      familyName: newContactData.lastName,
      givenName: newContactData.firstName,
    };
    try {
      await ContactsList.addContact(payload);
      bottomSheetModalRef.current?.dismiss();
      setNewContactData({ firstName: '', lastName: '', phoneNumber: '' });


      await refetchDeviceContacts();
      await fetchContacts();


      setLastAddedNumber(formatted);
    } catch (err) {
      console.error('Error while adding contact', err);
      bottomSheetModalRef.current?.dismiss();
    }
  }, [newContactData, refetchDeviceContacts, fetchContacts]);
  useEffect(() => {
    if (!contactCreatedAlert) return;
    const id = setTimeout(() => setContactCreatedAlert(false), 5000);
    return () => clearTimeout(id);
  }, [contactCreatedAlert]);

  const groupedContacts = useMemo(() => {
    if (!contacts) return [];

    const inviteOnlyContacts = contacts.filter((contact: any) =>
      !contact.phoneNumbers.some((p: any) =>
        yarshaNumbers.has(p.number.replace(/(?!^\+)[\s\(\)\-\+]/g, ''))
      )
    );

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    return alphabet
      .map<FlashListItem[]>(letter => {
        const filtered = inviteOnlyContacts.filter((c: any) =>
          c.givenName?.toUpperCase().startsWith(letter)
        );
        if (filtered.length === 0) return [];

        const mapped = filtered.map((user: any) => {
          const contact: ContactsScreenSpace.CombinedContact = {
            givenName: user.givenName,
            familyName: '',
            recordID: user.recordID,
            middleName: '',
            jobTitle: '',
            emailAddresses: [],
            phoneNumbers: user.phoneNumbers,
            fullName: user.givenName,
            id: user.recordID,
            profilePicture: '',
            username: user.displayName,
            hasThumbnail: false,
            imAddresses: [],
            postalAddresses: [],
            urlAddresses: [],
            thumbnailPath: '',
            address: '',
            phoneNumber: '',
          };
          return contact;
        });

        return [{ type: 'header', title: letter }, ...mapped];
      })
      .flat();
  }, [contacts, yarshaNumbers]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery) return groupedContacts;
    return groupedContacts?.filter(item => {
      const contact = item as ContactsScreenSpace.Contact;
      return (
        contact.givenName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.familyName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [searchQuery, groupedContacts]);

  console.log('matchedUsers', matchedUsers);

  const groupedYarshaUsers = useMemo(() => {
    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    return alpha
      .map<FlashListItem[]>((letter) => {
        const filtered =
          matchedUsers?.filter((u) =>
            u.fullName?.toUpperCase().startsWith(letter)
          ) || [];
        if (!filtered.length) return [];
        const items = filtered.map((u) =>
        ({
          givenName: u.fullName,
          phoneNumbers: [{ number: u.phoneNumber, label: '' }],
          id: u.id,
          profilePicture: u.profilePicture,
          fullName: u.fullName,
          address: u.address,
        } as ContactsScreenSpace.CombinedContact)
        );
        return [{ type: 'header', title: letter }, ...items];
      })
      .flat();
  }, [matchedUsers]);

  const filteredYarshaUsers = useMemo(() => {
    if (!searchQuery) return groupedYarshaUsers;
    return groupedYarshaUsers.filter((item) =>
      item.type === 'header'
        ? false
        : (item as ContactsScreenSpace.Contact).givenName
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, groupedYarshaUsers]);
  const flashListData =
    selectedOption === 'Contacts' ? filteredYarshaUsers : filteredContacts;

  console.log('flashListData', filteredYarshaUsers);

  const renderItem = useCallback(
    ({ item }: { item: FlashListItem }) => {
      if (item.type === 'header') {
        return (
          <View
            style={[
              backgrounds.white,
              gutters.padding_10,
              components.borderBottom,
            ]}
          >
            <TextVariant>{item.title}</TextVariant>
          </View>
        );
      }
      return (
        <ContactItem
          item={item as ContactsScreenSpace.Contact}
          option={selectedOption}
        />
      );
    },
    [selectedOption]
  );

  const handleOptionChange = useCallback(
    (opt: string) => {
      if (opt !== selectedOption) {
        setSelectedOption(opt as 'Contacts' | 'Invite');
        flashListRef.current?.scrollToOffset({ offset: 0, animated: false });
      }
    },
    [selectedOption]
  );

  const snapPoints = useMemo(
    () => [heightPercentToDp('45'), heightPercentToDp('45')],
    []
  );
  const renderBackdrop = useCallback(
    (props: BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop appearsOnIndex={0} disappearsOnIndex={-1} {...props} />
    ),
    []
  );
  const handleOpenBottomSheet = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);


  return (
    <KeyboardAvoidingView
      style={[layout.flex_1]}
      {...(Platform.OS === 'ios' ? { behavior: 'padding' } : {})}
    >
      <View style={[layout.flex_1]}>
        <SafeScreen>
          <View style={{ height: '100%' }}>
            <View style={[gutters.paddingHorizontal_14]}>
              <SearchBar
                searchQuery={searchQuery}
                onChangeSearchQuery={setSearchQuery}
                placeholder={t('nameOrWalletAddress')}
              />
            </View>
            <View>
              {contactCreatedAlert && (
                <View
                  style={[
                    layout.row,
                    layout.fullWidth,
                    layout.itemsCenter,
                    layout.justifyCenter,
                    backgrounds.primary,
                    gutters.paddingVertical_8,
                    layout.z10,
                  ]}
                >
                  <ImageVariant
                    source={Images.contactCreated}
                    sourceDark={Images.contactCreated}
                    style={[components.iconSize14, gutters.marginRight_6]}
                  />
                  <TextVariant
                    style={[
                      components.textCenter,
                      components.urbanist14RegularWhite,
                    ]}
                  >
                    {t('contactCreated')}
                  </TextVariant>
                </View>
              )}
            </View>
            <View style={[layout.fullHeight, gutters.padding_14, layout.flex_1]}>
              <View style={[gutters.marginTop_10, layout.fullWidth]}>
                <SegmentedControl
                  options={['Contacts', 'Invite']}
                  selectedOption={selectedOption}
                  onOptionPress={handleOptionChange}
                />
              </View>
              {(permissionStatus === RESULTS.BLOCKED || permissionStatus === RESULTS.DENIED) && (
                <View style={[layout.itemsSelfCenter, layout.justifyCenter, layout.flex0_7, gutters.marginHorizontal_20]}>
                  <TextVariant style={[components.urbanist24BoldBlack, components.textCenter]}>
                    {t('contactNotAccessible')}
                  </TextVariant>
                  <TextVariant style={[components.urbanist16RegularLight, components.textCenter, gutters.marginTop_10]}>
                    {t('toShowContacts')}
                  </TextVariant>
                </View>
              )}
              {!(permissionStatus === RESULTS.BLOCKED || permissionStatus === RESULTS.DENIED) && (
                <FlashList
                  ref={flashListRef}
                  showsVerticalScrollIndicator={false}
                  data={flashListData}
                  renderItem={renderItem}
                  keyExtractor={(item, idx) =>
                    item.type === 'header'
                      ? `header-${item.title}`
                      : `${(item as ContactsScreenSpace.Contact).recordID}-${idx}`
                  }
                  stickyHeaderIndices={
                    flashListData?.map((item, idx) => (item.type === 'header' ? idx : null))
                      .filter((i) => i !== null) as number[]
                  }
                  estimatedItemSize={300}
                  contentContainerStyle={{ paddingBottom: 100 }}
                  ListEmptyComponent={() => (
                    <View style={[gutters.marginTop_250, layout.itemsCenter]}>
                      {(isContactsLoading ||
                        isYarshaContactsLoading ||
                        isDeviceContactsLoading) ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <TextVariant style={[components.urbanist16RegularDark]}>
                          {t('noContactFound')}
                        </TextVariant>
                      )}
                    </View>
                  )}
                />
              )}
              {isPermissionDeniedError(error) && (
                <View
                  style={[
                    {
                      zIndex: 1000,
                      shadowColor: '#184BFF',
                      shadowOffset: { width: 0, height: 5 },
                      shadowOpacity: 0.3,
                      shadowRadius: 7,
                      elevation: 12,
                    },
                    backgrounds.primary,
                    layout.absolute,
                    layout.bottom120,
                    layout.right20,
                    borders.rounded_500,
                    layout.height50px,
                    layout.width50px,
                    layout.justifyCenter,
                    layout.itemsCenter,
                  ]}
                >
                  <ButtonVariant hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} onPress={handleOpenBottomSheet}>
                    <ImageVariant
                      style={[components.iconSize24]}
                      source={Images.addContact}
                      sourceDark={ImagesDark.addContact}
                    />
                  </ButtonVariant>
                </View>
              )}
            </View>
          </View>
        </SafeScreen>
      </View>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={index}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        backgroundStyle={[backgrounds.white, borders.roundedTop_20]}
        handleIndicatorStyle={[layout.width40, backgrounds.cream]}
      >
        <BottomSheetView
          style={[
            layout.itemsSelfCenter,
            layout.fullWidth,
            gutters.paddingHorizontal_14,
          ]}
        >
          <TextVariant style={[components.urbanist20BoldBlack, gutters.marginBottom_20]}>
            {t('newContact')}
          </TextVariant>
          <View style={[gutters.marginBottom_12]}>
            <TextVariant style={[components.urbanist16RegularDark, gutters.marginBottom_10]}>
              {t('firstName')}
            </TextVariant>
            <BottomSheetTextInput
              ref={firstNameRef}
              returnKeyType="next"
              onFocus={() => firstNameRef.current?.focus()}
              onBlur={() => firstNameRef.current?.blur()}
              onSubmitEditing={() => lastNameRef.current?.focus()}
              placeholder={t('enterFirstName')}
              placeholderTextColor={colors.placeholderTextColor}
              value={newContactData.firstName}
              onChangeText={(text) => setNewContactData({ ...newContactData, firstName: text })}
              style={[
                { height: 50 },
                components.urbanist18RegularBlack,
                borders.w_1,
                borders.tertiary,
                borders.rounded_8,
                Platform.OS === 'ios' ? gutters.padding_14 : gutters.padding_8,
              ]}
            />
          </View>
          <View style={[gutters.marginBottom_12]}>
            <TextVariant style={[components.urbanist16RegularDark, gutters.marginBottom_10]}>
              {t('lastName')}
            </TextVariant>
            <BottomSheetTextInput
              ref={lastNameRef}
              returnKeyType="next"
              onFocus={() => lastNameRef.current?.focus()}
              onBlur={() => lastNameRef.current?.blur()}
              onSubmitEditing={() => lastNameRef.current?.blur()}
              placeholder={t('enterLastName')}
              placeholderTextColor={colors.placeholderTextColor}
              value={newContactData.lastName}
              onChangeText={(text) => setNewContactData({ ...newContactData, lastName: text })}
              style={[
                { height: 50 },
                components.urbanist18RegularBlack,
                borders.w_1,
                borders.tertiary,
                borders.rounded_8,
                Platform.OS === 'ios' ? gutters.padding_14 : gutters.padding_8,
              ]}
            />
          </View>
          <View style={[gutters.marginBottom_12]}>
            <TextVariant style={[components.urbanist16RegularDark, gutters.marginBottom_10]}>
              {t('phoneNumber')}
            </TextVariant>
            <PhoneInput
              ref={phoneInput}
              defaultValue={newContactData.phoneNumber}
              defaultCode={defaultCountryCode}
              placeholder={t('phonePlaceHolder')}
              layout="first"
              onChangeText={(text) => setNewContactData({ ...newContactData, phoneNumber: text })}
              containerStyle={{
                width: '100%',
                borderColor: '#e5e5e5',
                borderWidth: 1,
                borderRadius: 8,
              }}
              textContainerStyle={[
                gutters.paddingVertical_12,
                backgrounds.white,
                borders.clipBackground,
                components.phoneNumberInput,
              ]}
              textInputStyle={[components.urbanist18RegularBlack, components.letterSpacing1]}
              codeTextStyle={[components.urbanist18RegularBlack]}
            />
          </View>
          <ButtonVariant
            style={[components.blueBackgroundButton, layout.itemsCenter, gutters.padding_14, gutters.marginVertical_12]}
            onPress={saveNewContact}
          >
            <TextVariant style={[components.urbanist16SemiBoldWhite]}>
              {t('createContact')}
            </TextVariant>
          </ButtonVariant>
          <View style={[layout.height30]} />
        </BottomSheetView>
      </BottomSheetModal>
    </KeyboardAvoidingView>
  );
};

export default React.memo(Contacts);