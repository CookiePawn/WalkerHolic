import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, NativeModules, NativeEventEmitter, AppState } from 'react-native';
import { addData } from '@/services';
import { Collection } from '@/models';

const { StepCounter } = NativeModules;

interface StepData {
  steps: number;
  date: string;
}

const StepCounterComponent: React.FC = () => {
  const [todaySteps, setTodaySteps] = useState<number>(0);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const user = { uid: '1234567890' };

  useEffect(() => {
    // 초기 걸음 수 가져오기
    getInitialSteps();
    
    // 걸음 수 추적 시작
    startStepTracking();

    // AppState 리스너 설정
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        getInitialSteps(); // 앱이 포그라운드로 돌아올 때 걸음 수 업데이트
      }
    });
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      stopStepTracking();
      subscription.remove();
    };
  }, []);

  const getInitialSteps = async () => {
    try {
      const result = await StepCounter.getTodaySteps();
      console.log('Initial steps:', JSON.stringify(result, null, 2));
      setTodaySteps(result.steps);
    } catch (error) {
      console.error('초기 걸음 수 가져오기 실패:', error);
    }
  };

  const startStepTracking = async () => {
    try {
      await StepCounter.startStepCounter();
      setIsTracking(true);
      
      // 걸음 수 업데이트를 위한 이벤트 리스너 설정
      const eventEmitter = new NativeEventEmitter(StepCounter);
      const subscription = eventEmitter.addListener('stepCounterUpdate', (data: StepData) => {
        console.log('Step update:', JSON.stringify(data, null, 2));
        setTodaySteps(data.steps);
        // Firestore에 데이터 저장
        saveStepsToFirestore(data);
      });

      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      return () => {
        subscription.remove();
      };
    } catch (error) {
      console.error('걸음 수 추적 시작 실패:', error);
    }
  };

  const stopStepTracking = async () => {
    try {
      await StepCounter.stopStepCounter();
      setIsTracking(false);
    } catch (error) {
      console.error('걸음 수 추적 중지 실패:', error);
    }
  };

  const saveStepsToFirestore = async (data: StepData) => {
    try {
      await addData(Collection.Step, {
        userUid: user?.uid,
        steps: data.steps,
        date: data.date,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Firestore 저장 실패:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>오늘의 걸음 수</Text>
      <Text style={styles.steps}>{todaySteps.toLocaleString()} 걸음</Text>
      <Text style={styles.status}>
        {isTracking ? '걸음 수 추적 중...' : '걸음 수 추적 중지됨'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  steps: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginVertical: 20,
  },
  status: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default StepCounterComponent;
