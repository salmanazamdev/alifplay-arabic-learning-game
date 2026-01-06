import React, { useEffect, useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { Edit3, Volume2, Image as ImageIcon, Target } from 'lucide-react-native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors, FontSize, FontWeight, Spacing, Shadows, BorderRadius } from '../constants';
import { loadProgress, UserProgress } from '../utils/storage';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const insets = useSafeAreaInsets();

  const fetchProgress = useCallback(async () => {
    const data = await loadProgress();
    console.log('Loaded progress:', data);
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
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  useFocusEffect(
    useCallback(() => {
      fetchProgress();
    }, [fetchProgress])
  );

  // Calculate actual progress for each module
  const tracingProgress = progress?.tracingCompleted ? progress.tracingCompleted.length / 28 : 0; // 28 Arabic letters
  const pronunciationProgress = progress?.pronunciationScore ? progress.pronunciationScore / 100 : 0;
  const imageMatchProgress = progress?.imageMatchScore ? progress.imageMatchScore / 100 : 0;
  const quizProgress = progress?.quizScore ? progress.quizScore / 100 : 0;

  const gameCards = [
    {
      title: 'Letter Tracing',
      icon: Edit3,
      color: Colors.primaryYellow,
      colorDark: Colors.primaryYellowDark,
      route: 'Tracing' as keyof RootStackParamList,
      description: 'Learn to write Arabic letters',
      progress: tracingProgress,
    },
    {
      title: 'Pronunciation',
      icon: Volume2,
      color: Colors.primaryBlue,
      colorDark: Colors.primaryBlueDark,
      route: 'Pronunciation' as keyof RootStackParamList,
      description: 'Hear and speak Arabic sounds',
      progress: pronunciationProgress,
    },
    {
      title: 'Image Match',
      icon: ImageIcon,
      color: Colors.primaryPink,
      colorDark: Colors.primaryPinkDark,
      route: 'ImageMatch' as keyof RootStackParamList,
      description: 'Match words with pictures',
      progress: imageMatchProgress,
    },
    {
      title: 'Quiz Time',
      icon: Target,
      color: Colors.primaryPurple,
      colorDark: Colors.primaryPurpleDark,
      route: 'Quiz' as keyof RootStackParamList,
      description: 'Test your knowledge',
      progress: quizProgress,
    },
  ];

  const totalProgress = gameCards.reduce((sum, card) => sum + card.progress, 0) / gameCards.length;
  const currentLevel = Math.floor(totalProgress * 10) + 1;
  const dayStreak = 5; // TODO: Calculate from actual usage data

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#FFD93D', '#FF9A3C']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Title */}
        <Text style={styles.title}>AlifPlay</Text>
        <Text style={styles.subtitle}>Master the Arabic Alphabet</Text>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statValue}>{progress?.starsEarned || 0}</Text>
            <Text style={styles.statLabel}>Stars</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{dayStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>📊</Text>
            <Text style={styles.statValue}>Lv {currentLevel}</Text>
            <Text style={styles.statLabel}>{Math.round(totalProgress * 100)}% Done</Text>
          </View>
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
        <Text style={styles.sectionTitle}>Your Learning Path</Text>
        
        <View style={styles.cardsGrid}>
          {gameCards.map((card, index) => {
            const IconComponent = card.icon;
            const percentComplete = Math.round(card.progress * 100);
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.gameCard}
                onPress={() => navigation.navigate(card.route)}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  {/* Icon */}
                  <View style={[styles.iconCircle, { backgroundColor: card.color }]}>
                    <IconComponent color={Colors.white} size={32} strokeWidth={2.5} />
                  </View>

                  {/* Info */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.gameTitle}>{card.title}</Text>
                    <Text style={styles.gameDescription}>{card.description}</Text>
                    
                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { width: `${card.progress * 100}%`, backgroundColor: card.color }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>{percentComplete}%</Text>
                    </View>
                  </View>

                  {/* Start Button */}
                  <TouchableOpacity style={[styles.startButton, { backgroundColor: card.color }]}>
                    <Text style={styles.startButtonText}>START</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
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
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
  },
  title: {
    fontSize: 40,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.lg,
    color: Colors.white,
    opacity: 0.95,
    marginBottom: Spacing.xl,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.medium,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.border,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  cardsGrid: {
    gap: Spacing.md,
  },
  gameCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    ...Shadows.medium,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  gameTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  gameDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  progressText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    minWidth: 38,
    textAlign: 'right',
  },
  startButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  startButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});

export default HomeScreen;
