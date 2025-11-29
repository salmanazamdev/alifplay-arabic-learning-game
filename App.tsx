
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { saveProgress, loadProgress, UserProgress } from './src/utils/storage';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';


export default function App() {
  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_700Bold,
  });

  useEffect(() => {
    // Initialize default progress if none exists
    const initializeProgress = async () => {
      const existing = await loadProgress();
      if (!existing) {
        const defaultProgress: UserProgress = {
          starsEarned: 0,
          levelsCompleted: [],
          badges: [],
          tracingCompleted: [],
          pronunciationScore: 0,
          imageMatchScore: 0,
          quizScore: 0,
        };
        await saveProgress(defaultProgress);
      }
    };
    initializeProgress();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FFD93D" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator />
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
