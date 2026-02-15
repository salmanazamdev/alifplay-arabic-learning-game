
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { saveProgress, loadProgress, DEFAULT_PROGRESS } from './src/utils/storage';
import { useFonts, Cairo_400Regular, Cairo_700Bold, Cairo_600SemiBold } from '@expo-google-fonts/cairo';
import { ErrorBoundary } from './src/components';


export default function App() {
  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_600SemiBold,
    Cairo_700Bold,
  });

  useEffect(() => {
    // Initialize default progress if none exists
    const initializeProgress = async () => {
      const existing = await loadProgress();
      if (!existing) {
        await saveProgress(DEFAULT_PROGRESS);
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
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppNavigator />
        <StatusBar style="auto" />
      </GestureHandlerRootView>
    </ErrorBoundary>
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
