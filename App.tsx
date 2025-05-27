import React from 'react';
import { MainStack } from '@/navigate';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';


const App = () => {
  return (
    <GestureHandlerRootView>
      <NavigationContainer>
        <MainStack />
      </NavigationContainer>
    </GestureHandlerRootView>
  )
  
};

export default App;