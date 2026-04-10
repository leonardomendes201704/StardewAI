import { useLocalSearchParams } from 'expo-router';

import { ChatThreadScreen } from '@/src/features/chat/chat-thread-screen';

export default function ChatThreadRoute() {
  const params = useLocalSearchParams<{ applicationId?: string | string[] }>();
  const applicationId = Array.isArray(params.applicationId)
    ? params.applicationId[0]
    : params.applicationId;

  return <ChatThreadScreen applicationId={applicationId} />;
}
