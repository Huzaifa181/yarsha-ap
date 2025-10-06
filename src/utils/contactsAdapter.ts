import { Platform } from 'react-native';

let Contacts: any;

if (Platform.OS === 'android') {
  Contacts = require('react-native-contacts/src/NativeContacts').default;
} else {
  Contacts = require('react-native-contacts').default;
}

export default Contacts;