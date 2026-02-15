import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import SplashScreen from '../screens/SplashScreen';
import MemoryGameScreen from '../screens/MemoryGameScreen';
import PronunciationScreen from '../screens/PronunciationScreen';
import ImageMatchScreen from '../screens/ImageMatchScreen';
import QuizScreen from '../screens/QuizScreen';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  MemoryGame: undefined;
  Pronunciation: undefined;
  ImageMatch: undefined;
  Quiz: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#F8F9FA' },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="MemoryGame" component={MemoryGameScreen} />
        <Stack.Screen name="Pronunciation" component={PronunciationScreen} />
        <Stack.Screen name="ImageMatch" component={ImageMatchScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
