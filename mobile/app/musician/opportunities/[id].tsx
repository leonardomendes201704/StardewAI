import { useLocalSearchParams } from 'expo-router';

import { OpportunityDetailScreen } from '@/src/features/opportunities/opportunity-detail-screen';

export default function MusicianOpportunityDetailRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const routeId = Array.isArray(params.id) ? params.id[0] : params.id;

  return <OpportunityDetailScreen opportunityId={routeId} />;
}
