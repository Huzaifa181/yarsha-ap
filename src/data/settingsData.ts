import {Section} from '@/types';

export const sections: Section[] = [
  {
    title: 'Application Settings',
    data: [
      {
        key: 'Enable Biometrics',
        onPress: () => console.log('Security & Privacy pressed'),
      },
      {
        key: 'Notifications',
        onPress: () => console.log('Manage Accounts pressed'),
      },
      {
        key: 'Recent Logins',
        onPress: () => console.log('Manage Accounts pressed'),
      },
    ],
  },
  {
    title: 'Application Info',
    data: [
      {
        key: 'Terms & Conditions',
        onPress: () => console.log('App Version pressed'),
      },
      {
        key: 'Privacy Policy',
        onPress: () => console.log('App Version pressed'),
      },
      {
        key: 'Support',
        onPress: () => console.log('App Version pressed'),
      },
      {
        key: 'About Yarsha',
        onPress: () => console.log('App Version pressed'),
      },
    ],
  },
  {
    title: 'Account',
    data: [
      {
        key: 'Delete Your Yarsha Account',
        onPress: () => {},
      },
      {
        key: 'Log Out',
        onPress: () => {},
      },
    ],
  },
];
