function requirePublicEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required Expo public environment variable: ${name}`);
  }

  return value;
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey = (
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
)?.trim();

export const env = {
  appEnv: process.env.EXPO_PUBLIC_APP_ENV?.trim() ?? 'development',
  expoProjectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID?.trim() ?? null,
  supabasePublishableKey: requirePublicEnv(
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    supabasePublishableKey,
  ),
  supabaseUrl: requirePublicEnv('EXPO_PUBLIC_SUPABASE_URL', supabaseUrl),
} as const;
