import { useLocalSearchParams } from 'expo-router';

import { ContractReviewScreen } from '@/src/features/reviews/contract-review-screen';

export default function BarContractReviewRoute() {
  const params = useLocalSearchParams<{ contractId?: string | string[] }>();
  const contractId = Array.isArray(params.contractId) ? params.contractId[0] : params.contractId;

  return <ContractReviewScreen accountType="bar" contractId={contractId} />;
}
