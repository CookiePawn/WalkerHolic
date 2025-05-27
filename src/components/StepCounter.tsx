import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, NativeEventEmitter, NativeModules, Platform, PermissionsAndroid } from 'react-native';

const { StepCounter } = NativeModules;
const eventEmitter = new NativeEventEmitter(StepCounter);

const StepCounterComponent = () => {
  const [steps, setSteps] = useState<number>(0);
  const [totalSteps, setTotalSteps] = useState<number>(0);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BODY_SENSORS,
          PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        ]);
        
        const allGranted = Object.values(granted).every(
          (permission) => permission === PermissionsAndroid.RESULTS.GRANTED
        );
        
        return allGranted;
      } catch (err) {
        console.error('Error requesting permissions:', err);
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    let subscription: any;

    const setupStepCounter = async () => {
      try {
        const hasPermissions = await requestPermissions();
        if (!hasPermissions) {
          console.error('Required permissions not granted');
          return;
        }

        // Start step counter
        await StepCounter.startStepCounter();
        console.log('Step counter started');

        // Get initial steps
        const result = await StepCounter.getSteps();
        setTotalSteps(result.steps);

        // Listen for step updates
        subscription = eventEmitter.addListener('stepCounterUpdate', (event) => {
          setSteps(event.steps);
          setTotalSteps(event.totalSteps);
        });
      } catch (error) {
        console.error('Error setting up step counter:', error);
      }
    };

    setupStepCounter();

    // Cleanup
    return () => {
      if (subscription) {
        subscription.remove();
      }
      StepCounter.stopStepCounter().catch((error: Error) => {
        console.error('Error stopping step counter:', error);
      });
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>오늘의 만보</Text>
      <Text style={styles.steps}>{totalSteps.toLocaleString()} 걸음</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  steps: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default StepCounterComponent; 