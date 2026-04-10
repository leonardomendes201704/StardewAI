import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Link, useRouter, type Href } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAccountRoutes, type AccountType } from '@/src/features/session/account';
import { colors, radii, spacing, typography } from '@/src/shared/theme';

const BOTTOM_NAV_HEIGHT = 74;

export function getBottomNavOffset(bottomInset: number) {
  return Math.max(bottomInset, spacing.md);
}

export function getBottomNavStickyActionOffset(bottomInset: number) {
  return getBottomNavOffset(bottomInset) + BOTTOM_NAV_HEIGHT + spacing.sm;
}

type TopBarProps = {
  title?: string;
  subtitle?: string;
  location?: string;
  align?: 'center' | 'left';
  centeredBrand?: boolean;
  leadingIcon?: keyof typeof MaterialIcons.glyphMap;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  leftIcon?: keyof typeof MaterialIcons.glyphMap;
  onLeftPress?: () => void;
};

export function TopBar({
  title,
  subtitle,
  location,
  align = 'center',
  centeredBrand = false,
  leadingIcon = 'location-on',
  rightIcon = 'notifications',
  leftIcon,
  onLeftPress,
}: TopBarProps) {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={styles.safeTop}>
      <View style={styles.topBar}>
        <View style={styles.sideSlot}>
          {leftIcon ? (
            <RoundIconButton icon={leftIcon} onPress={onLeftPress ?? (() => router.back())} />
          ) : align === 'left' ? (
            <View style={styles.inlineTitleRow}>
              <MaterialIcons color={colors.primary} name={leadingIcon} size={18} />
              <Text numberOfLines={1} style={styles.inlineTitle}>
                {title}
              </Text>
            </View>
          ) : location ? (
            <View style={styles.locationRow}>
              <MaterialIcons color={colors.primary} name={leadingIcon} size={18} />
              <Text numberOfLines={1} style={styles.locationText}>
                {location}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.centerSlot}>
          {align === 'center' ? (
            <>
              <Text numberOfLines={1} style={centeredBrand ? styles.brandTitle : styles.topTitle}>
                {title}
              </Text>
              {subtitle ? <Text style={styles.topSubtitle}>{subtitle}</Text> : null}
            </>
          ) : null}
        </View>

        <View style={[styles.sideSlot, styles.sideRight]}>
          <RoundIconButton icon={rightIcon} />
        </View>
      </View>
    </SafeAreaView>
  );
}

type BottomNavProps = {
  accountType: AccountType;
  active: 'home' | 'search' | 'calendar' | 'chat' | 'profile';
};

export function BottomNav({ active, accountType }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = getBottomNavOffset(insets.bottom);
  const routes = getAccountRoutes(accountType);
  const items: Array<{
    key: BottomNavProps['active'];
    label: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    href: Href;
  }> = [
    { key: 'home', label: 'Inicio', icon: 'home-filled', href: routes.home },
    { key: 'search', label: 'Buscar', icon: 'search', href: routes.search },
    { key: 'calendar', label: 'Agenda', icon: 'calendar-today', href: routes.agenda },
    { key: 'chat', label: 'Conversa', icon: 'chat-bubble', href: routes.chat },
    { key: 'profile', label: 'Perfil', icon: 'person', href: routes.profile },
  ];

  return (
    <View style={[styles.bottomWrap, { bottom: bottomOffset }]}>
      <BlurView
        intensity={70}
        tint="dark"
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bottomInner}>
        {items.map((item) => {
          const isActive = item.key === active;

          return (
            <Link asChild href={item.href} key={item.key}>
              <Pressable
                style={({ pressed }) => [
                  styles.navItem,
                  isActive && styles.navItemActive,
                  pressed && styles.navItemPressed,
                ]}>
                <MaterialIcons
                  color={isActive ? colors.primaryContainer : 'rgba(242,239,251,0.72)'}
                  name={item.icon}
                  size={22}
                />
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
              </Pressable>
            </Link>
          );
        })}
      </View>
    </View>
  );
}

type RoundIconButtonProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
};

export function RoundIconButton({ icon, onPress }: RoundIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}>
      <MaterialIcons color={colors.onSurface} name={icon} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeTop: {
    backgroundColor: colors.topBar,
  },
  topBar: {
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.topBar,
  },
  sideSlot: {
    minWidth: 72,
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineTitle: {
    ...typography.bodyBold,
    color: colors.primary,
    fontSize: 18,
  },
  locationText: {
    ...typography.bodyMedium,
    color: colors.onSurface,
    maxWidth: 120,
  },
  brandTitle: {
    fontFamily: 'SplineSansBold',
    fontSize: 24,
    lineHeight: 26,
    letterSpacing: -0.8,
    color: colors.primary,
  },
  topTitle: {
    fontFamily: 'SplineSansBold',
    fontSize: 18,
    lineHeight: 22,
    color: colors.primary,
  },
  topSubtitle: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 37, 49, 0.55)',
  },
  iconButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  bottomWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    backgroundColor: colors.navBar,
  },
  bottomInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    minHeight: BOTTOM_NAV_HEIGHT,
    gap: spacing.xs,
  },
  navItem: {
    alignItems: 'center',
    borderRadius: radii.md,
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    maxWidth: 78,
    minHeight: 52,
    minWidth: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
  },
  navItemActive: {
    backgroundColor: 'rgba(202,253,0,0.16)',
    borderColor: 'rgba(202,253,0,0.42)',
    borderWidth: 1,
    elevation: 4,
    shadowColor: colors.primaryContainer,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  navItemPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  navLabel: {
    ...typography.navLabel,
    color: 'rgba(242,239,251,0.72)',
    textAlign: 'center',
    width: '100%',
  },
  navLabelActive: {
    color: colors.primaryContainer,
  },
});
