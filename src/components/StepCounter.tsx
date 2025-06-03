import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, NativeEventEmitter, NativeModules, Platform, PermissionsAndroid, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY } from '../constants/storage-key';
import { Step } from '@/models';

const { StepCounter } = NativeModules;
const eventEmitter = new NativeEventEmitter();

const StepCounterComponent = () => {
  const [steps, setSteps] = useState<number>(0);
  const [totalSteps, setTotalSteps] = useState<number>(0);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [stepHistory, setStepHistory] = useState<Step[]>([]);

  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
  };

  const loadStepData = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY.STEP_COUNTER);
      if (data) {
        const stepData: Step[] = JSON.parse(data);
        setStepHistory(stepData);
      }
    } catch (error) {
      console.error('Error loading step data:', error);
    }
  };

  const saveStepData = async (newSteps: number, date: string) => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY.STEP_COUNTER);
      const stepData: Step[] = data ? JSON.parse(data) : [];
      
      const todayIndex = stepData.findIndex(item => item.date === date);
      if (todayIndex !== -1) {
        stepData[todayIndex].count = newSteps;
      } else {
        stepData.push({ date, count: newSteps });
      }

      await AsyncStorage.setItem(STORAGE_KEY.STEP_COUNTER, JSON.stringify(stepData));
      setStepHistory(stepData);
    } catch (error) {
      console.error('Error saving step data:', error);
    }
  };

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

        // Load saved step data
        await loadStepData();

        // Get initial steps
        const todaySteps = await StepCounter.getTodaySteps();
        setSteps(todaySteps.steps);
        setTotalSteps(todaySteps.steps);
        setCurrentDate(todaySteps.date);

        // Start step counter
        await StepCounter.startStepCounter();
        console.log('Step counter started');

        // Listen for step updates
        subscription = eventEmitter.addListener('stepCounterUpdate', (event) => {
          console.log('Step counter update received:', event);
          setSteps(event.todaySteps);
          setTotalSteps(event.todaySteps);
          setCurrentDate(event.date);
          saveStepData(event.todaySteps, event.date);
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

  const renderStepHistory = () => {
    return stepHistory
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((step, index) => (
        <View key={index} style={styles.historyItem}>
          <Text style={styles.historyDate}>{step.date}</Text>
          <Text style={styles.historySteps}>{step.count.toLocaleString()} 걸음</Text>
        </View>
      ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.currentSteps}>
        <Text style={styles.title}>오늘의 만보</Text>
        <Text style={styles.steps}>{totalSteps.toLocaleString()} 걸음</Text>
      </View>
      
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>걸음 수 기록</Text>
        <ScrollView style={styles.historyList}>
          {renderStepHistory()}
        </ScrollView>
      </View>
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
  currentSteps: {
    marginBottom: 20,
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
  historyContainer: {
    marginTop: 20,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  historyList: {
    maxHeight: 300,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
  },
  historySteps: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
});

export default StepCounterComponent; 