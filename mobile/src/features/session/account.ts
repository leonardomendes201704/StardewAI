import type { User } from '@supabase/supabase-js';

export type AccountType = 'bar' | 'musician';

export function isAccountType(value: unknown): value is AccountType {
  return value === 'bar' || value === 'musician';
}

export function readAccountType(value: unknown): AccountType | null {
  return isAccountType(value) ? value : null;
}

export function readAccountTypeFromUser(user?: User | null): AccountType | null {
  return readAccountType(user?.user_metadata?.account_type);
}

export function getAccountRoutes(accountType: AccountType) {
  if (accountType === 'bar') {
    return {
      agenda: '/bar/agenda',
      chat: '/chat',
      home: '/bar/home',
      profile: '/bar/profile',
      search: '/search',
    } as const;
  }

  return {
    agenda: '/musician/agenda',
    chat: '/chat',
    home: '/musician/home',
    profile: '/musician/profile',
    search: '/search',
  } as const;
}
