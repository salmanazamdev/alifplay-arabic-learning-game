import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Construction } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../constants';

const { width } = Dimensions.get('window');

const TracingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={[Colors.primaryYellow, Colors.primaryYellowDark]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Letter Tracing</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.comingSoonCard}>
          <View style={styles.iconContainer}>
            <Construction color={Colors.primaryYellow} size={80} strokeWidth={2} />
          </View>
          
          <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
          <Text style={styles.comingSoonSubtitle}>
            This amazing module is under development
          </Text>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoEmoji}>✨</Text>
            <Text style={styles.infoText}>
              Letter Tracing will be available in the next semester with interactive SVG-based drawing and real-time feedback!
            </Text>
          </View>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>✓</Text>
              <Text style={styles.featureText}>Touch-based letter tracing</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>✓</Text>
              <Text style={styles.featureText}>Real-time stroke recognition</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>✓</Text>
              <Text style={styles.featureText}>Step-by-step guidance</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>✓</Text>
              <Text style={styles.featureText}>Progress tracking</Text>
            </View>
          </View>
        </View>
      </View>
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
  headerTitle: {
    fontSize: 32,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  comingSoonCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  comingSoonTitle: {
    fontSize: 32,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  comingSoonSubtitle: {
    fontSize: FontSize.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  infoBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    marginBottom: Spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryYellow,
  },
  infoEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: FontSize.body,
    color: Colors.text,
    lineHeight: 22,
    textAlign: 'center',
  },
  featuresList: {
    width: '100%',
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureBullet: {
    fontSize: 20,
    color: Colors.primaryGreen,
    fontWeight: FontWeight.bold,
  },
  featureText: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    flex: 1,
  },
});
