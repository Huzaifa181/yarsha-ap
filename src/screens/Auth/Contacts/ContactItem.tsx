import React, {JSX, useCallback} from 'react';
import {Linking, Platform, View} from 'react-native';
import {useTheme} from '@/theme';
import {ButtonVariant, ImageVariant, TextVariant} from '@/components/atoms';
import {ContactsScreenSpace, SafeScreenNavigationProp} from '@/types';
import {getInitials, getRandomColor} from '@/utils';
import {useTranslation} from 'react-i18next';
import {shortenAddress} from '@/utils/shortenAddress';
import {useNavigation} from '@react-navigation/native';
import FastImage from '@d11/react-native-fast-image';

interface ContactItemProps {
  item: ContactsScreenSpace.Contact;
  option: string;
}

/**
 * @author Nitesh Raj Khanal
 * @function @ContactItem
 * @returns JSX.Element
 **/

const ContactItem: React.FC<ContactItemProps> = ({
  item,
  option,
}): JSX.Element => {
  const {layout, gutters, components, borders} = useTheme();

  const {t} = useTranslation(['translations']);
  const navigation = useNavigation<SafeScreenNavigationProp>();

  const {backgroundColor} = React.useMemo(
    () => getRandomColor(),
    [item.givenName],
  );

  const handleInvitePress = useCallback((phoneNumber: string) => {
    const messageContent = `Let’s chat on Yarsha! It’s a fast, secure, and innovative Web3 chat app built on the Solana blockchain. With Yarsha, you can send "blinks," transfer money seamlessly, and connect with the Web3 community.

Get started now at Link goes here

Discover the future of communication with Yarsha!`;

    const phoneUrl = Platform.select({
      ios: `sms:${phoneNumber}?body=${encodeURIComponent(messageContent)}`,
      android: `sms:${phoneNumber}?body=${encodeURIComponent(messageContent)}`,
    });

    if (phoneUrl) {
      Linking.openURL(phoneUrl).catch(err =>
        console.error('Failed to open SMS app:', err),
      );
    }
  }, []);

  const handleMessageClick = useCallback(
      (    contact: any) => {
      navigation.navigate('PrivateMessageScreen', {
        messageId: item.id || '',
        type: 'individual',
        profilePicture: item.profilePicture,
        lastActive: 0,
        name: contact.fullName || '', 
      });
      // console.log('check the contact :', contact);
    },
    [navigation, item],
  );

  const renderContactDetails = (
    phoneNumber?: {label: string; number: string},
    disabled: boolean = false,
  ) => (
    <ButtonVariant
      disabled={disabled}
      style={[layout.row, layout.itemsCenter, gutters.paddingVertical_10]}>
      {item.hasThumbnail ? (
        <FastImage
          source={{uri: item.thumbnailPath}}
          style={[
            components.imageSize48,
            gutters.marginRight_10,
            borders.rounded_500,
          ]}
        />
      ) : (
        <View
          style={[
            components.imageSize48,
            gutters.marginRight_6,
            borders.rounded_500,
            {backgroundColor},
            layout.itemsCenter,
            layout.justifyCenter,
          ]}>
          <TextVariant style={[components.urbanist24BoldWhite]}>
            {getInitials(`${item.givenName} ${item.familyName}`)}
          </TextVariant>
        </View>
      )}
      <View>
        <TextVariant style={[components.urbanist16SemiBoldDark]}>
          {`${item.givenName || 'Unknown'} ${item.familyName || ''}`.trim()}
        </TextVariant>
        {phoneNumber ? (
          <TextVariant style={[components.urbanist14RegularcodeDark]}>
            {phoneNumber.number}
          </TextVariant>
        ) : (
          <TextVariant style={[components.urbanist14RegularcodeDark]}>
            {item.familyName || 'Unknown'}
          </TextVariant>
        )}
      </View>
    </ButtonVariant>
  );

  const renderYarshaUsers = () => (
    <ButtonVariant
      onPress={() => handleMessageClick(item)}
      style={[layout.row, layout.itemsCenter, gutters.paddingVertical_10]}>
      {item.profilePicture ? (
        <FastImage
          source={{uri: item.profilePicture}}
          style={[
            components.imageSize48,
            gutters.marginRight_10,
            borders.rounded_500,
          ]}
        />
      ) : (
        <View
          style={[
            components.imageSize48,
            gutters.marginRight_6,
            borders.rounded_500,
            {backgroundColor},
            layout.itemsCenter,
            layout.justifyCenter,
          ]}>
          <TextVariant style={[components.urbanist24BoldWhite]}>
            {getInitials(`${item?.fullName}`)}
          </TextVariant>
        </View>
      )}
      <View>
        <TextVariant style={[components.urbanist16SemiBoldDark]}>
          {`${item.fullName || 'Unknown'}`.trim()}
        </TextVariant>

        <TextVariant style={[components.urbanist14RegularcodeDark]}>
          {shortenAddress(item.address)}
        </TextVariant>
      </View>
    </ButtonVariant>
  );

  if (option === 'Contacts') {
    return renderYarshaUsers();
  } else {
    return (
      <>
        {item.phoneNumbers.map((phoneNumber, index) => (
          <View
            key={`${item.recordID}-${index}`}
            style={[layout.row, layout.itemsCenter, layout.justifyBetween]}>
            <View style={[layout.width70p]}>
            {renderContactDetails(phoneNumber, true)}
            </View>

            <ButtonVariant
              style={[
                borders.rounded_500,
                borders.w_1,
                gutters.paddingVertical_4,
                gutters.paddingHorizontal_10,
                borders.dark,
              ]}
              onPress={() => handleInvitePress(item.phoneNumbers[0]?.number)}>
              <TextVariant style={[components.urbanist14RegularBlack]}>
                {t('invite')}
              </TextVariant>
            </ButtonVariant>
          </View>
        ))}
      </>
    );
  }
};

export default React.memo(ContactItem);
