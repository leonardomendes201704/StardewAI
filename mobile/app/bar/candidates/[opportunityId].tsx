import { useLocalSearchParams } from 'expo-router';

import { BarOpportunityCandidatesScreen } from '@/src/features/opportunities/bar-opportunity-candidates-screen';

export default function BarOpportunityCandidatesRoute() {
  const params = useLocalSearchParams<{ opportunityId?: string | string[] }>();
  const routeId = Array.isArray(params.opportunityId) ? params.opportunityId[0] : params.opportunityId;

  return <BarOpportunityCandidatesScreen opportunityId={routeId} />;
}
