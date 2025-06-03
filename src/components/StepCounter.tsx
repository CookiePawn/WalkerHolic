import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, NativeModules, NativeEventEmitter, AppState, FlatList } from 'react-native';
import { updateDocument, getCollectionData } from '@/services';
import { Collection } from '@/models';

const { StepCounter } = NativeModules;

interface StepData {
  steps: number;
  date: string;
  timestamp: string;
}

interface StepHistoryItem {
  id: string;
  steps: number;
  date: string;
  timestamp: string;
}

const StepCounterComponent: React.FC = () => {
  const [todaySteps, setTodaySteps] = useState<number>(0);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [stepHistory, setStepHistory] = useState<StepHistoryItem[]>([]);
  const user = { uid: '1234567890' };

  // 걸음 수 저장 함수
  const saveStepsToFirestore = async (steps: number) => {
    if (!user?.uid) return;
    
    const date = new Date().toISOString().split('T')[0];
    const data = {
      userUid: user.uid,
      date: date,
      steps: steps,
      timestamp: new Date().toISOString()
    };

    try {
      await updateDocument(Collection.Step, data);
      // 저장 후 히스토리 새로고침
      fetchStepHistory();
    } catch (error) {
      console.error('Error saving steps:', error);
    }
  };

  // 걸음 수 히스토리 가져오기
  const fetchStepHistory = async () => {
    try {
      const data = await getCollectionData(Collection.Step);
      // 현재 사용자의 데이터만 필터링하고 날짜순으로 정렬
      const userData = data
        .filter((item: any) => item.userUid === user.uid)
        .sort((a: any, b: any) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ) as StepHistoryItem[];
      setStepHistory(userData);
    } catch (error) {
      console.error('Error fetching step history:', error);
    }
  };

  // 걸음 수 가져오기 및 저장
  const getAndSaveSteps = async () => {
    try {
      const result = await StepCounter.getTodaySteps();
      console.log('Got steps:', result);
      setTodaySteps(result.steps);
      await saveStepsToFirestore(result.steps);
    } catch (error) {
      console.error('걸음 수 가져오기 실패:', error);
    }
  };

  useEffect(() => {
    // 초기 걸음 수 가져오기 및 저장
    getAndSaveSteps();
    // 걸음 수 히스토리 가져오기
    fetchStepHistory();
    
    // 걸음 수 추적 시작
    startStepTracking();

    // AppState 리스너 설정
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        console.log('App came to foreground');
        getAndSaveSteps(); // 앱이 포그라운드로 돌아올 때 걸음 수 업데이트 및 저장
      }
    });
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      stopStepTracking();
      subscription.remove();
    };
  }, []);

  const startStepTracking = async () => {
    try {
      await StepCounter.startStepCounter();
      setIsTracking(true);
      
      // 걸음 수 업데이트를 위한 이벤트 리스너 설정
      const eventEmitter = new NativeEventEmitter(StepCounter);
      const subscription = eventEmitter.addListener('stepCounterUpdate', (data: StepData) => {
        console.log('Step update:', JSON.stringify(data, null, 2));
        setTodaySteps(data.steps);
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

  const renderHistoryItem = ({ item }: { item: StepHistoryItem }) => (
    <View style={styles.historyItem}>
      <Text style={styles.historyDate}>{item.date}</Text>
      <Text style={styles.historySteps}>{item.steps.toLocaleString()} 걸음</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.todayContainer}>
        <Text style={styles.title}>오늘의 걸음 수</Text>
        <Text style={styles.steps}>{todaySteps.toLocaleString()} 걸음</Text>
        <Text style={styles.status}>
          {isTracking ? '걸음 수 추적 중...' : '걸음 수 추적 중지됨'}
        </Text>
      </View>

      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>이전 기록</Text>
        <FlatList
          data={stepHistory}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          style={styles.historyList}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    padding: 20,
    backgroundColor: '#fff',
  },
  todayContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
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
  historyContainer: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  historyDate: {
    fontSize: 16,
    color: '#333',
  },
  historySteps: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
});

export default StepCounterComponent;

