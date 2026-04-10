import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/shared/api/supabase/client';

import { type AccountType } from './account';

type AccountRow = {
  account_type: AccountType;
  created_at: string;
  display_name: string | null;
  email: string | null;
  id: string;
  onboarding_completed: boolean;
  profile_completed: boolean;
};

type VenueProfileRow = {
  city: string | null;
  created_at: string;
  state: string | null;
  venue_name: string | null;
};

type ArtistProfileRow = {
  city: string | null;
  created_at: string;
  stage_name: string | null;
  state: string | null;
};

export type RegistrationSnapshot = {
  account: AccountRow | null;
  artistProfile: ArtistProfileRow | null;
  profileExists: boolean;
  venueProfile: VenueProfileRow | null;
};

async function fetchRegistrationSnapshot(accountType: AccountType): Promise<RegistrationSnapshot> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return {
      account: null,
      artistProfile: null,
      profileExists: false,
      venueProfile: null,
    };
  }

  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('id, account_type, email, display_name, profile_completed, onboarding_completed, created_at')
    .eq('id', user.id)
    .single();

  if (accountError) {
    throw accountError;
  }

  if (accountType === 'bar') {
    const { data: venueProfile, error: venueError } = await supabase
      .from('venue_profiles')
      .select('venue_name, city, state, created_at')
      .eq('account_id', user.id)
      .maybeSingle();

    if (venueError) {
      throw venueError;
    }

    return {
      account: account as AccountRow,
      artistProfile: null,
      profileExists: Boolean(venueProfile),
      venueProfile: venueProfile as VenueProfileRow | null,
    };
  }

  const { data: artistProfile, error: artistError } = await supabase
    .from('artist_profiles')
    .select('stage_name, city, state, created_at')
    .eq('account_id', user.id)
    .maybeSingle();

  if (artistError) {
    throw artistError;
  }

  return {
    account: account as AccountRow,
    artistProfile: artistProfile as ArtistProfileRow | null,
    profileExists: Boolean(artistProfile),
    venueProfile: null,
  };
}

export function useRegistrationSnapshot(accountType: AccountType) {
  return useQuery({
    queryFn: () => fetchRegistrationSnapshot(accountType),
    queryKey: ['registration-snapshot', accountType],
  });
}
