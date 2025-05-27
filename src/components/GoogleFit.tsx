import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import GoogleFit, { Scopes, BucketUnit } from 'react-native-google-fit';
import StepCounter from './StepCounter';

const GoogleFitComponent = () => {
  const [steps, setSteps] = useState<number>(0);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isGoogleFitAvailable, setIsGoogleFitAvailable] = useState<boolean>(true);

  const fetchStepData = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const result = await GoogleFit.getDailyStepCountSamples({
        startDate: startOfDay.toISOString(),
        endDate: today.toISOString(),
        bucketUnit: BucketUnit.DAY,
        bucketInterval: 1,
      });

      console.log('Step data result:', JSON.stringify(result, null, 2));

      if (result && result.length > 0) {
        // estimated_steps 소스에서만 걸음 수 가져오기
        const estimatedSteps = result.find(source => source.source === 'com.google.android.gms:estimated_steps');
        
        if (estimatedSteps && estimatedSteps.steps && estimatedSteps.steps.length > 0) {
          const totalSteps = estimatedSteps.steps.reduce((sum, step) => sum + step.value, 0);
          setSteps(totalSteps);
        } else {
          setSteps(0);
        }
      } else {
        setSteps(0);
      }
    } catch (error) {
      setSteps(0);
    }
  };

  const initializeGoogleFit = async () => {
    try {
      // Google Fit 권한 요청
      const authResult = await GoogleFit.authorize({
        scopes: [
          Scopes.FITNESS_ACTIVITY_READ,
          Scopes.FITNESS_BODY_READ,
        ],
      });

      if (authResult.success) {
        setIsAuthorized(true);
        setIsGoogleFitAvailable(true);
        
        // 권한이 성공하면 데이터 가져오기
        await fetchStepData();
      } else {
        setIsAuthorized(false);
      }
    } catch (error) {
      setIsGoogleFitAvailable(false);
    }
  };

  // 컴포넌트 마운트 시 Google Fit 초기화
  useEffect(() => {
    initializeGoogleFit();
  }, []);

  // 인증이 성공하면 주기적으로 데이터 업데이트
  useEffect(() => {
    if (isAuthorized) {
      const interval = setInterval(fetchStepData, 60000); // 1분마다 업데이트
      return () => clearInterval(interval);
    }
  }, [isAuthorized]);

  if (!isGoogleFitAvailable) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Google Fit 앱이 필요합니다</Text>
        <Text style={styles.description}>
          만보 데이터를 수집하기 위해서는 Google Fit 앱이 필요합니다.
        </Text>
        <Text 
          style={styles.link}
          onPress={() => Linking.openURL('market://details?id=com.google.android.apps.fitness')}
        >
          Google Fit 앱 설치하기
        </Text>
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>대체 만보계</Text>
          <StepCounter />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>오늘의 만보</Text>
      <Text style={styles.steps}>{steps.toLocaleString()} 걸음</Text>
      {!isAuthorized && (
        <Text style={styles.warning}>
          Google Fit 권한이 필요합니다. 앱을 다시 실행해주세요.
        </Text>
      )}
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
  warning: {
    marginTop: 10,
    color: '#FF3B30',
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  link: {
    color: '#007AFF',
    fontSize: 14,
    textDecorationLine: 'underline',
    marginBottom: 20,
  },
  fallbackContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default GoogleFitComponent;
