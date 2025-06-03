import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  checkMultiple,
  Permission,
  check,
  request,
  checkNotifications,
  requestNotifications,
} from 'react-native-permissions';

const ANDROID_PERMISSIONS = [
  PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION,
  PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
  PERMISSIONS.ANDROID.BODY_SENSORS,
  PERMISSIONS.ANDROID.BODY_SENSORS_BACKGROUND,
] as Permission[];

export const usePermission = () => {
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>(false);

  const checkAndRequestPermission = async (permission: Permission) => {
    try {
      const result = await check(permission);

      if (result !== RESULTS.GRANTED) {
        const requestResult = await request(permission);
        return requestResult === RESULTS.GRANTED;
      }

      return true;
    } catch (error) {
      if (__DEV__) console.error(`Error checking/requesting permission ${permission}:`, error);
      return false;
    }
  };

  const checkAndRequestNotificationPermission = async () => {
    try {
      const { status } = await checkNotifications();
      
      if (status !== RESULTS.GRANTED) {
        const { status: requestStatus } = await requestNotifications(['alert', 'sound']);
        return requestStatus === RESULTS.GRANTED;
      }

      return true;
    } catch (error) {
      if (__DEV__) console.error('Error checking/requesting notification permission:', error);
      return false;
    }
  };

  const requestAllPermissions = async () => {
    if (Platform.OS !== 'android') {
      setPermissionsGranted(true);
      return true;
    }

    try {
      // 알림 권한 확인 및 요청 (Android 13 이상)
      if (Number(Platform.Version) >= 33) {
        const notificationGranted = await checkAndRequestNotificationPermission();
        if (!notificationGranted) {
          setPermissionsGranted(false);
          return false;
        }
      }

      // 나머지 권한 확인 및 요청
      for (const permission of ANDROID_PERMISSIONS) {
        const granted = await checkAndRequestPermission(permission);
        if (!granted) {
          setPermissionsGranted(false);
          return false;
        }
      }

      setPermissionsGranted(true);
      return true;
    } catch (error) {
      setPermissionsGranted(false);
      return false;
    }
  };

  const checkPermissions = async () => {
    if (Platform.OS !== 'android') {
      setPermissionsGranted(true);
      return true;
    }

    try {
      // 알림 권한 확인 (Android 13 이상)
      if (Number(Platform.Version) >= 33) {
        const { status: notificationStatus } = await checkNotifications();
        if (notificationStatus !== RESULTS.GRANTED) {
          setPermissionsGranted(false);
          return false;
        }
      }

      // 나머지 권한 확인
      const results = await checkMultiple(ANDROID_PERMISSIONS);
      
      const allGranted = Object.values(results).every(
        (result) => result === RESULTS.GRANTED
      );
      
      setPermissionsGranted(allGranted);
      return allGranted;
    } catch (error) {
      if (__DEV__) console.error('Error checking permissions:', error);
      return false;
    }
  };

  useEffect(() => {
    requestAllPermissions();
  }, []);

  return { permissionsGranted, requestPermissions: requestAllPermissions };
};
