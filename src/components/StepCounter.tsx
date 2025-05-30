import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, NativeEventEmitter, NativeModules, Platform, PermissionsAndroid, ScrollView, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY } from '../constants/storage-key';
import { Step } from '@/models';

const { StepCounter } = NativeModules;
const eventEmitter = new NativeEventEmitter(StepCounter);

const StepCounterComponent = () => {
  const [steps, setSteps] = useState<number>(0);
  const [totalSteps, setTotalSteps] = useState<number>(0);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [stepHistory, setStepHistory] = useState<Step[]>([]);
  const lastStepCount = useRef<number>(0);
  const isFirstUpdate = useRef<boolean>(true);
  const appState = useRef(AppState.currentState);

  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
  };

  const loadStepData = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY.STEP_COUNTER);
      if (data) {
        const stepData: Step[] = JSON.parse(data);
        const today = getCurrentDate();
        const todayData = stepData.find(item => item.date === today);
        
        if (todayData) {
          setTotalSteps(todayData.count);
        } else {
          setTotalSteps(0);
        }
        setStepHistory(stepData);
      }
    } catch (error) {
      console.error('Error loading step data:', error);
    }
  };

  const saveStepData = async (newSteps: number) => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY.STEP_COUNTER);
      const stepData: Step[] = data ? JSON.parse(data) : [];
      const today = getCurrentDate();
      
      const todayIndex = stepData.findIndex(item => item.date === today);
      if (todayIndex !== -1) {
        stepData[todayIndex].count = newSteps;
      } else {
        stepData.push({ date: today, count: newSteps });
      }

      await AsyncStorage.setItem(STORAGE_KEY.STEP_COUNTER, JSON.stringify(stepData));
      setStepHistory(stepData);
    } catch (error) {
      console.error('Error saving step data:', error);
    }
  };

  const checkAndResetIfNewDay = async () => {
    const today = getCurrentDate();
    if (currentDate && currentDate !== today) {
      console.log('New day detected, resetting step counter');
      
      try {
        // 현재 저장된 데이터 가져오기
        const data = await AsyncStorage.getItem(STORAGE_KEY.STEP_COUNTER);
        const stepData: Step[] = data ? JSON.parse(data) : [];
        
        // 새로운 날짜의 데이터가 이미 있는지 확인
        const todayDataExists = stepData.some(item => item.date === today);
        
        // 새로운 날짜의 데이터가 없다면 추가
        if (!todayDataExists) {
          stepData.push({ date: today, count: 0 });
          await AsyncStorage.setItem(STORAGE_KEY.STEP_COUNTER, JSON.stringify(stepData));
          setStepHistory(stepData);
          console.log('New day record added to AsyncStorage');
        }
        
        // 상태 초기화
        setTotalSteps(0);
        setSteps(0);
        isFirstUpdate.current = true;
      } catch (error) {
        console.error('Error handling new day:', error);
      }
    }
    setCurrentDate(today);
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
    let dateCheckInterval: NodeJS.Timeout;

    const setupStepCounter = async () => {
      try {
        const hasPermissions = await requestPermissions();
        if (!hasPermissions) {
          console.error('Required permissions not granted');
          return;
        }

        // Initialize current date
        setCurrentDate(getCurrentDate());
        
        // Load saved step data
        await loadStepData();

        // Start step counter
        await StepCounter.startStepCounter();
        console.log('Step counter started');

        // Listen for step updates
        subscription = eventEmitter.addListener('stepCounterUpdate', (event) => {
          const currentSteps = event.totalSteps;
          
          if (isFirstUpdate.current) {
            lastStepCount.current = currentSteps;
            isFirstUpdate.current = false;
            console.log('Initial step count:', lastStepCount.current);
          } else {
            const stepDifference = currentSteps - lastStepCount.current;
            if (stepDifference > 0) {
              const newTotalSteps = totalSteps + stepDifference;
              setSteps(stepDifference);
              setTotalSteps(newTotalSteps);
              saveStepData(newTotalSteps);
              lastStepCount.current = currentSteps;
            }
          }
        });

        // Check for date change every second
        dateCheckInterval = setInterval(() => {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentSecond = now.getSeconds();
          
          // 자정(00:00:00)을 체크
          if (currentHour === 0 && currentMinute === 0 && currentSecond === 0) {
            console.log('Midnight detected, resetting step counter');
            checkAndResetIfNewDay();
          }
        }, 1000); // 1초마다 체크

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
      if (dateCheckInterval) {
        clearInterval(dateCheckInterval);
      }
      StepCounter.stopStepCounter().catch((error: Error) => {
        console.error('Error stopping step counter:', error);
      });
    };
  }, [totalSteps]);

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