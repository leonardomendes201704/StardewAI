import { useLocalSearchParams } from 'expo-router';

import { ContractReviewScreen } from '@/src/features/reviews/contract-review-screen';

export default function MusicianContractReviewRoute() {
  const params = useLocalSearchParams<{ contractId?: string | string[] }>();
  const contractId = Array.isArray(params.contractId) ? params.contractId[0] : params.contractId;

  return <ContractReviewScreen accountType="musician" contractId={contractId} />;
}
