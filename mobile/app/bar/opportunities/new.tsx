import { useLocalSearchParams } from 'expo-router';

import { OpportunityEditorScreen } from '@/src/features/opportunities/opportunity-editor-screen';

export default function NewOpportunityRoute() {
  const params = useLocalSearchParams<{ inviteArtistId?: string | string[] }>();
  const inviteArtistId = Array.isArray(params.inviteArtistId)
    ? params.inviteArtistId[0]
    : params.inviteArtistId;

  return <OpportunityEditorScreen inviteArtistId={inviteArtistId} />;
}
