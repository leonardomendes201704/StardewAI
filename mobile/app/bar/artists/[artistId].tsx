import { useLocalSearchParams } from 'expo-router';

import { BarArtistDetailScreen } from '@/src/features/search/bar-artist-detail-screen';

export default function BarArtistDetailRoute() {
  const params = useLocalSearchParams<{ artistId?: string | string[] }>();
  const artistId = Array.isArray(params.artistId) ? params.artistId[0] : params.artistId;

  return <BarArtistDetailScreen artistId={artistId} />;
}
