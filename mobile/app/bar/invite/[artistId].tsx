import { useLocalSearchParams } from 'expo-router';

import { BarDirectInviteScreen } from '@/src/features/opportunities/bar-direct-invite-screen';

export default function BarDirectInviteRoute() {
  const params = useLocalSearchParams<{
    artistId?: string | string[];
    opportunityId?: string | string[];
  }>();
  const artistId = Array.isArray(params.artistId) ? params.artistId[0] : params.artistId;
  const opportunityId = Array.isArray(params.opportunityId)
    ? params.opportunityId[0]
    : params.opportunityId;

  return (
    <BarDirectInviteScreen artistId={artistId} highlightedOpportunityId={opportunityId} />
  );
}
