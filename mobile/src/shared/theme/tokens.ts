export const colors = {
  background: '#0d0d16',
  surface: '#0d0d16',
  surfaceContainerLowest: '#000000',
  surfaceContainerLow: '#13131c',
  surfaceContainer: '#191923',
  surfaceContainerHigh: '#1f1f2a',
  surfaceContainerHighest: '#252531',
  surfaceVariant: '#252531',
  outline: '#76747f',
  outlineVariant: '#484751',
  primary: '#f3ffca',
  primaryContainer: '#cafd00',
  primaryDim: '#beee00',
  secondary: '#00eefc',
  secondaryDim: '#00deec',
  tertiary: '#a68cff',
  error: '#ff6e84',
  errorContainer: '#a70138',
  onSurface: '#f2effb',
  onSurfaceVariant: '#acaab5',
  onPrimaryFixed: '#3a4a00',
  glass: 'rgba(37, 37, 49, 0.44)',
  glassStrong: 'rgba(37, 37, 49, 0.62)',
  topBar: 'rgba(0, 0, 0, 0.60)',
  navBar: 'rgba(37, 37, 49, 0.68)',
  borderGhost: 'rgba(72, 71, 81, 0.24)',
  white: '#ffffff',
  black: '#000000',
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const typography = {
  display: {
    fontFamily: 'SplineSansBold',
    fontSize: 42,
    lineHeight: 44,
    letterSpacing: -1.4,
  },
  heroTitle: {
    fontFamily: 'SplineSansBold',
    fontSize: 34,
    lineHeight: 34,
    letterSpacing: -1.2,
  },
  screenTitle: {
    fontFamily: 'SplineSansBold',
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.8,
  },
  sectionTitle: {
    fontFamily: 'SplineSansBold',
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  cardTitle: {
    fontFamily: 'SplineSansBold',
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: 'ManropeRegular',
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: 'ManropeMedium',
    fontSize: 14,
    lineHeight: 20,
  },
  bodyBold: {
    fontFamily: 'ManropeBold',
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontFamily: 'ManropeBold',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  navLabel: {
    fontFamily: 'ManropeMedium',
    fontSize: 10,
    lineHeight: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.9,
  },
} as const;

export const shadows = {
  neon: {
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  soft: {
    shadowColor: colors.black,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const;
