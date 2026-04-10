import { useLocalSearchParams } from 'expo-router';

import { BarCandidateDetailScreen } from '@/src/features/opportunities/bar-candidate-detail-screen';

export default function BarCandidateDetailRoute() {
  const params = useLocalSearchParams<{ applicationId?: string | string[] }>();
  const routeId = Array.isArray(params.applicationId) ? params.applicationId[0] : params.applicationId;

  return <BarCandidateDetailScreen applicationId={routeId} />;
}
