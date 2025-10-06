import {
  check,
  PERMISSIONS,
  RESULTS,
  request,
  Permission,
} from 'react-native-permissions';
import {Alert, Linking, Platform} from 'react-native';
import {
  PermissionType,
  PlatformPermissions,
  RequestPermissionType,
} from '@/types';

const PLATFORM_CAMERA_PERMISSIONS: PlatformPermissions = {
  ios: PERMISSIONS.IOS.CAMERA,
  android: PERMISSIONS.ANDROID.CAMERA,
};

const PLATFORM_FACEID_PERMISSIONS: PlatformPermissions = {
  ios: PERMISSIONS.IOS.FACE_ID,
};

const PLATFORM_PHOTO_PERMISSIONS: PlatformPermissions = {
  ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
  android:
    Platform.Version && Number(Platform.Version) >= 33
      ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
      : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
};

const PLATFORM_CONTACTS_PERMISSIONS: PlatformPermissions = {
  ios: PERMISSIONS.IOS.CONTACTS,
  android: PERMISSIONS.ANDROID.READ_CONTACTS,
};

const REQUEST_PERMISSION_TYPE: RequestPermissionType = {
  camera: PLATFORM_CAMERA_PERMISSIONS,
  photo: PLATFORM_PHOTO_PERMISSIONS,
  contacts: PLATFORM_CONTACTS_PERMISSIONS,
  faceid: PLATFORM_FACEID_PERMISSIONS,
};

const PERMISSION_TYPE: PermissionType = {
  camera: 'camera',
  photo: 'photo',
  contacts: 'contacts',
  faceid: 'faceid',
};

class AppPermission {
  handlePermissionResult = (result: string): string => {
    switch (result) {
      case RESULTS.GRANTED:
        return 'Granted';
      case RESULTS.LIMITED:
        return 'Limited';
      case RESULTS.DENIED:
        return 'Denied';
      case RESULTS.BLOCKED:
        return 'Blocked';
      default:
        return 'Unknown';
    }
  };

  checkPermission = async (
    type: keyof RequestPermissionType,
  ): Promise<boolean> => {
    if (!(type in REQUEST_PERMISSION_TYPE) || !Platform.OS) {
      return true;
    }

    const permissions = REQUEST_PERMISSION_TYPE[type][
      Platform.OS as keyof PlatformPermissions
    ] as Permission;
    if (!permissions) {
      return true;
    }

    try {
      const result = await check(permissions);
      const permissionStatus = this.handlePermissionResult(result);

      console.log('permission status =>', permissionStatus);

      if (permissionStatus === 'Granted') {
        return true;
      } else if (
        permissionStatus === 'Denied' ||
        permissionStatus === 'Limited'
      ) {
        return this.requestPermission(permissions);
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  checkMultiple = async (
    permissions: Array<keyof RequestPermissionType>,
  ): Promise<boolean> => {
    const results = [];
    for (const permission of permissions) {
      const permissionResult = REQUEST_PERMISSION_TYPE[permission][
        Platform.OS as keyof PlatformPermissions
      ] as Permission;
      if (permissionResult) {
        results.push(await this.checkPermission(permission));
      }
    }

    return results.every(result => result === true);
  };

  requestPermission = async (permissions: Permission): Promise<boolean> => {
    try {
      const result = await request(permissions);
      console.log('result of request permission =>', result);

      const permissionStatus = this.handlePermissionResult(result);

      switch (permissionStatus) {
        case 'Granted':
          console.log('Permission granted');
          return true;

        case 'Denied':
          console.log('Permission denied');
          // Optionally, you can show a message or prompt the user to open settings.
          Alert.alert(
            'Permission Denied',
            'Please allow the permission in your device settings to use this feature.',
            [
              {text: 'Okay', style: 'cancel'},
            ],
          );
          return false;

        case 'Blocked':
          console.log('Permission blocked');
          Alert.alert(
            'Permission Blocked',
            'This permission has been blocked. Please enable it from your device settings to use this feature.',
            [
              {text: 'Okay', style: 'cancel'},
            ],
          );
          return false;

        case 'Limited':
          console.log('Permission granted with limited access');
          // Handle limited permission case (for instance, contacts access with restrictions).
          // You may decide whether to proceed with limited access or not.
          return true;

        default:
          console.log('Unknown permission status');
          return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  };

  requestMultiple = async (
    permissions: Array<keyof RequestPermissionType>,
  ): Promise<boolean> => {
    const results = [];
    for (const permission of permissions) {
      const permissionResult = REQUEST_PERMISSION_TYPE[permission][
        Platform.OS as keyof PlatformPermissions
      ] as Permission;
      if (permissionResult) {
        results.push(await this.requestPermission(permissionResult));
      }
    }

    return results.every(result => result === true);
  };
}

const Permissions = new AppPermission();
export {Permissions, PERMISSION_TYPE, REQUEST_PERMISSION_TYPE};

export const checkAndRequestPermission = async (
  permission: Permission,
  deniedAlertTitle: string,
  deniedAlertMessage: string,
): Promise<boolean> => {
  const result = await check(permission);

  if (result === RESULTS.GRANTED) {
    return true;
  }

  if (result === RESULTS.DENIED) {
    const requestResult = await request(permission);
    if (requestResult === RESULTS.GRANTED) {
      return true;
    }
  }

  Alert.alert(deniedAlertTitle, deniedAlertMessage, [
    {text: 'OK', style: 'cancel'},
  ]);
  return false;
};
