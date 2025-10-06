import {PERMISSIONS} from 'react-native-permissions';

export type PlatformPermissions = {
  ios: (typeof PERMISSIONS.IOS)[keyof typeof PERMISSIONS.IOS];
  android?: (typeof PERMISSIONS.ANDROID)[keyof typeof PERMISSIONS.ANDROID];
};

export type RequestPermissionType = {
  camera: PlatformPermissions;
  photo: PlatformPermissions;
  contacts: PlatformPermissions;
  faceid: PlatformPermissions;
};

export type PermissionType = {
  camera: keyof RequestPermissionType;
  photo: keyof RequestPermissionType;
  contacts: keyof RequestPermissionType;
  faceid: keyof RequestPermissionType;
};
