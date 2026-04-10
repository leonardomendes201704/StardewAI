import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing, typography } from '@/src/shared/theme';

const splashArt = require('../../../assets/images/tocaai-splash.png');
const trackWidth = 224;

type StartupSplashScreenProps = {
  durationMs?: number;
};

export function StartupSplashScreen({ durationMs = 2000 }: StartupSplashScreenProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: durationMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    animation.start();

    return () => {
      animation.stop();
      progress.stopAnimation();
    };
  }, [durationMs, progress]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.content}>
        <Image resizeMode="contain" source={splashArt} style={styles.image} />

        <View style={styles.loadingGroup}>
          <Text style={styles.loadingLabel}>Carregando experiencia</Text>
          <View style={styles.track}>
            <Animated.View
              style={[
                styles.fill,
                {
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, trackWidth],
                  }),
                },
              ]}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#07040f',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  image: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 1,
  },
  loadingGroup: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingLabel: {
    ...typography.label,
    color: 'rgba(232,245,255,0.74)',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  track: {
    width: trackWidth,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 4,
  },
});
