import { useLocalSearchParams } from 'expo-router';

import { OpportunityEditorScreen } from '@/src/features/opportunities/opportunity-editor-screen';

export default function EditOpportunityRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const routeId = Array.isArray(params.id) ? params.id[0] : params.id;

  return <OpportunityEditorScreen opportunityId={routeId} />;
}
