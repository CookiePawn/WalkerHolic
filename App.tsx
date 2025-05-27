import React from 'react';
import { MainStack } from '@/navigate';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { usePermission } from '@/hooks/usePermission';

const App = () => {
  const { permissionsGranted, requestPermissions } = usePermission();

  const handlePermissionRequest = async () => {
    console.log('Permission request button pressed');
    try {
      const result = await requestPermissions();
      console.log('Permission request result:', result);
      if (!result) {
        Alert.alert(
          '권한 필요',
          '앱의 기능을 사용하기 위해서는 모든 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
          [
            {
              text: '확인',
              style: 'default',
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('오류', '권한 요청 중 오류가 발생했습니다.');
    }
  };

  if (!permissionsGranted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>권한이 필요합니다</Text>
          <Text style={styles.permissionText}>
            만보 데이터를 수집하기 위해 다음 권한이 필요합니다:
          </Text>
          <Text style={styles.permissionItem}>• 활동 인식</Text>
          <Text style={styles.permissionItem}>• 위치 정보</Text>
          <Text style={styles.permissionItem}>• 센서 데이터</Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={handlePermissionRequest}
            activeOpacity={0.7}
          >
            <Text style={styles.permissionButtonText}>권한 요청하기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <MainStack />
        </NavigationContainer>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionItem: {
    fontSize: 16,
    marginBottom: 10,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;