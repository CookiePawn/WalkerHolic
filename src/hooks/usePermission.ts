import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  checkMultiple,
  Permission,
  check,
  request,
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

  const requestAllPermissions = async () => {
    if (Platform.OS !== 'android') {
      setPermissionsGranted(true);
      return true;
    }

    try {
      // 각 권한을 순차적으로 확인하고 요청
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
