import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../constants/Colors';
import { loadProgress, UserProgress } from '../utils/storage';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);

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
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFD93D', '#FF9A3C']}
        style={styles.header}
      >
        <Text style={styles.title}>AlifPlay</Text>
        <Text style={styles.subtitle}>Learn Arabic with Fun! 🎉</Text>
        <View style={styles.starsContainer}>
          <Text style={styles.starsText}>⭐ {progress?.starsEarned || 0}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Choose a Game</Text>
        {gameCards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.gameCard, { borderLeftColor: card.color }]}
            onPress={() => navigation.navigate(card.route)}
            activeOpacity={0.8}
          >
            <Text style={styles.gameEmoji}>{card.emoji}</Text>
            <View style={styles.gameInfo}>
              <Text style={styles.gameTitle}>{card.title}</Text>
              <Text style={styles.gameDescription}>{card.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: Colors.white,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  starsContainer: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'center',
  },
  starsText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
  },
  gameCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gameEmoji: {
    fontSize: 48,
    marginRight: 20,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
});

export default HomeScreen;
