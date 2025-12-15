import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../constants/Colors';
import { loadProgress, UserProgress } from '../utils/storage';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchProgress = async () => {
      const data = await loadProgress();
      if (data) {
        setProgress(data);
      } else {
        // Initialize default progress
        const defaultProgress: UserProgress = {
          starsEarned: 0,
          levelsCompleted: [],
          badges: [],
          tracingCompleted: [],
          pronunciationScore: 0,
          imageMatchScore: 0,
          quizScore: 0,
        };
        setProgress(defaultProgress);
      }
    };
    fetchProgress();
  }, []);

  const gameCards = [
    {
      title: 'Letter Tracing',
      emoji: '✍️',
      color: Colors.primaryYellow,
      route: 'Tracing' as keyof RootStackParamList,
      description: 'Learn to write Arabic letters',
    },
    {
      title: 'Pronunciation',
      emoji: '🔊',
      color: Colors.primaryBlue,
      route: 'Pronunciation' as keyof RootStackParamList,
      description: 'Hear and speak Arabic sounds',
    },
    {
      title: 'Image Match',
      emoji: '🎴',
      color: Colors.primaryPink,
      route: 'ImageMatch' as keyof RootStackParamList,
      description: 'Match words with pictures',
    },
    {
      title: 'Quiz Time',
      emoji: '🎯',
      color: Colors.primaryPurple,
      route: 'Quiz' as keyof RootStackParamList,
      description: 'Test your knowledge',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#FFD93D', '#FF9A3C']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.title}>AlifPlay</Text>
        <Text style={styles.subtitle}>Learn Arabic with Fun! 🎉</Text>
        <View style={styles.starsContainer}>
          <Text style={styles.starsText}>⭐ {progress?.starsEarned || 0} Stars</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Choose a Game</Text>
        <View style={styles.cardsGrid}>
          {gameCards.map((card, index) => (
            <TouchableOpacity
              key={index}
              style={styles.gameCard}
              onPress={() => navigation.navigate(card.route)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[card.color, card.color + 'DD']}
                style={styles.gameCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.emojiContainer}>
                  <Text style={styles.gameEmoji}>{card.emoji}</Text>
                </View>
                <Text style={styles.gameTitle}>{card.title}</Text>
                <Text style={styles.gameDescription}>{card.description}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 35,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.white,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
    opacity: 0.95,
  },
  starsContainer: {
    marginTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 25,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  starsText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 24,
    marginTop: 8,
  },
  cardsGrid: {
    gap: 16,
  },
  gameCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 4,
  },
  gameCardGradient: {
    padding: 24,
    minHeight: 140,
    justifyContent: 'center',
  },
  emojiContainer: {
    width: 70,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  gameEmoji: {
    fontSize: 40,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  gameDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    lineHeight: 20,
  },
});

export default HomeScreen;
