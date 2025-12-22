import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';
import { Wifi, WifiOff } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { Colors, FontSize, FontWeight, Spacing, Shadows } from '../constants';

const TracingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const webviewRef = useRef<WebView | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check internet connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const audioMap: Record<string, any> = {
    'ا': require('../../assets/audio/alif.mp3'),
    'ب': require('../../assets/audio/baa.mp3'),
    'ت': require('../../assets/audio/taa.mp3'),
    'ث': require('../../assets/audio/thaa.mp3'),
    'ج': require('../../assets/audio/jeem.mp3'),
    'ح': require('../../assets/audio/haa.mp3'),
    'خ': require('../../assets/audio/khaa.mp3'),
    'د': require('../../assets/audio/dal.mp3'),
    'ذ': require('../../assets/audio/thal.mp3'),
    'ر': require('../../assets/audio/raa.mp3'),
    'ز': require('../../assets/audio/zay.mp3'),
    'س': require('../../assets/audio/seen.mp3'),
    'ش': require('../../assets/audio/sheen.mp3'),
    'ص': require('../../assets/audio/sad.mp3'),
    'ض': require('../../assets/audio/dad.mp3'),
    'ط': require('../../assets/audio/tah.mp3'),
    'ظ': require('../../assets/audio/zah.mp3'),
    'ع': require('../../assets/audio/ain.mp3'),
    'غ': require('../../assets/audio/ghain.mp3'),
    'ف': require('../../assets/audio/faa.mp3'),
    'ق': require('../../assets/audio/qaf.mp3'),
    'ك': require('../../assets/audio/kaf.mp3'),
    'ل': require('../../assets/audio/lam.mp3'),
    'م': require('../../assets/audio/meem.mp3'),
    'ن': require('../../assets/audio/noon.mp3'),
    'ه': require('../../assets/audio/haa2.mp3'),
    'و': require('../../assets/audio/waw.mp3'),
    'ي': require('../../assets/audio/yaa.mp3'),
  };

  const playArabicSound = async (char: string) => {
    try {
      const audioSource = audioMap[char];
      if (!audioSource) {
        console.warn(`No audio found for character: ${char}`);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(audioSource);
      await sound.playAsync();

      // Unload after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const onMessage = (event: WebViewMessageEvent) => {
    const data = event.nativeEvent.data;
    if (data.startsWith('PLAY_AUDIO:')) {
      const char = data.replace('PLAY_AUDIO:', '');
      playArabicSound(char);
    }
  };

  const checkConnection = async () => {
    setIsLoading(true);
    const state = await NetInfo.fetch();
    setIsConnected(state.isConnected);
    setIsLoading(false);
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primaryGreen} />
          <Text style={styles.loadingText}>Checking connection...</Text>
        </View>
      </View>
    );
  }

  // Show offline screen
  if (isConnected === false) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.offlineContainer}>
          <WifiOff size={80} color="#999" />
          <Text style={styles.offlineTitle}>No Internet Connection</Text>
          <Text style={styles.offlineMessage}>
            The Letter Tracing game works offline!
          </Text>
          <Text style={styles.offlineHint}>
            You can practice tracing Arabic letters without an internet connection.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={checkConnection}>
            <Wifi size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Check Connection</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show WebView when ready
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={require('../../assets/arabic/arabic-tracing.html')}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        allowFileAccessFromFileURLs={true}
        mixedContentMode="always"
        cacheEnabled={true}
        onMessage={onMessage}
        style={{ flex: 1 }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primaryGreen} />
            <Text style={styles.loadingText}>Loading tracing game...</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.screenPadding,
  },
  offlineTitle: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  offlineMessage: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    lineHeight: 24,
  },
  offlineHint: {
    fontSize: FontSize.bodySmall,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryGreen,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    gap: Spacing.sm,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
});

export default TracingScreen;
