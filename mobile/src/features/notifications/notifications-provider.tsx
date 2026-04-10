import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { usePathname, useRouter } from 'expo-router';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import { useAuthSession } from '@/src/features/auth/auth-provider';
import {
  useAccountNotificationPreferences,
  useSyncPushRegistration,
  type PushPermissionStatus,
  type PushRegistrationPlatform,
} from '@/src/features/notifications/notifications';
import { reportTelemetryError, reportTelemetryEvent } from '@/src/features/observability/telemetry';
import { env } from '@/src/shared/api/supabase/env';

type PushNotificationsContextValue = {
  clearTokenSyncError: () => void;
  expoPushToken: string | null;
  installationId: string | null;
  isRegistering: boolean;
  isSupported: boolean;
  lastTokenSyncAt: string | null;
  permissionStatus: PushPermissionStatus;
  projectId: string | null;
  requestPushActivation: () => Promise<boolean>;
  syncPushRegistration: () => Promise<boolean>;
  tokenSyncError: string | null;
};

const INSTALLATION_STORAGE_KEY = 'tocaai.push.installation-id';
const notificationResponseHandledIds = new Set<string>();
const PushNotificationsContext = createContext<PushNotificationsContextValue | null>(null);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function PushNotificationsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { accountType, isReady, user } = useAuthSession();
  const preferencesQuery = useAccountNotificationPreferences(Boolean(user?.id));
  const syncRegistrationMutation = useSyncPushRegistration();
  const [installationId, setInstallationId] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PushPermissionStatus>('undetermined');
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [lastTokenSyncAt, setLastTokenSyncAt] = useState<string | null>(null);
  const [tokenSyncError, setTokenSyncError] = useState<string | null>(null);
  const syncFingerprintRef = useRef<string | null>(null);
  const projectId = resolveExpoProjectId();
  const isSupported = Platform.OS === 'android' || Platform.OS === 'ios';

  useEffect(() => {
    void ensureInstallationId().then(setInstallationId);
  }, []);

  useEffect(() => {
    void readCurrentPermissionStatus().then(setPermissionStatus);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    void Notifications.setNotificationChannelAsync('marketplace', {
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#d9ff4a',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      name: 'Marketplace',
      vibrationPattern: [0, 180, 120, 180],
    });
  }, []);

  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      reportTelemetryEvent({
        accountType,
        context: {
          notificationIdentifier: notification.request.identifier,
          route: readNotificationRoute(notification.request.content.data),
        },
        eventName: 'push_notification_received',
        pathname,
      });
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse({
        accountType,
        pathname,
        response,
        router,
      });
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) {
        return;
      }

      handleNotificationResponse({
        accountType,
        pathname,
        response,
        router,
      });
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [accountType, pathname, router]);

  useEffect(() => {
    if (!isReady || !user?.id || !installationId) {
      return;
    }

    if (!preferencesQuery.data?.pushEnabled) {
      return;
    }

    if (permissionStatus !== 'granted') {
      return;
    }

    const fingerprint = `${user.id}:${installationId}:${permissionStatus}`;

    if (syncFingerprintRef.current === fingerprint) {
      return;
    }

    syncFingerprintRef.current = fingerprint;
    void syncPushRegistrationInternal(false);
  }, [installationId, isReady, permissionStatus, preferencesQuery.data?.pushEnabled, user?.id]);

  async function syncPushRegistrationInternal(promptForPermission: boolean) {
    if (!user?.id || !installationId) {
      return false;
    }

    if (!isSupported || !Device.isDevice) {
      setPermissionStatus('unsupported');
      setTokenSyncError('Notificacoes push exigem um dispositivo fisico Android ou iOS.');
      return false;
    }

    let nextPermissionStatus = await readCurrentPermissionStatus();

    if (nextPermissionStatus !== 'granted' && promptForPermission) {
      reportTelemetryEvent({
        accountType,
        eventName: 'push_permission_requested',
        pathname,
      });

      const permissionResponse = await Notifications.requestPermissionsAsync();
      nextPermissionStatus = normalizePushPermissionStatus(permissionResponse.status);
    }

    setPermissionStatus(nextPermissionStatus);

    if (nextPermissionStatus !== 'granted') {
      setExpoPushToken(null);

      try {
        await syncRegistrationMutation.mutateAsync({
          expoPushToken: null,
          installationId,
          permissionStatus:
            nextPermissionStatus === 'unsupported' ? 'undetermined' : nextPermissionStatus,
          platform: readPushRegistrationPlatform(),
        });
      } catch (error) {
        reportTelemetryError({
          context: {
            installationId,
            permissionStatus: nextPermissionStatus,
          },
          error,
          source: 'push_registration_denied_sync',
        });
      }

      setTokenSyncError(
        nextPermissionStatus === 'denied'
          ? 'A permissao de notificacoes foi negada neste dispositivo.'
          : 'Ative a permissao do sistema para concluir o registro das notificacoes push.',
      );
      return false;
    }

    try {
      const tokenResponse = projectId
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();

      const nextToken = tokenResponse.data?.trim() || null;

      if (!nextToken) {
        throw new Error('A Expo nao retornou um token push valido para este dispositivo.');
      }

      await syncRegistrationMutation.mutateAsync({
        appBuild:
          Constants.expoConfig?.version ??
          Constants.nativeBuildVersion ??
          Constants.expoRuntimeVersion ??
          null,
        deviceName: Device.deviceName ?? Device.modelName ?? null,
        expoPushToken: nextToken,
        installationId,
        permissionStatus: 'granted',
        platform: readPushRegistrationPlatform(),
      });

      setExpoPushToken(nextToken);
      setLastTokenSyncAt(new Date().toISOString());
      setTokenSyncError(null);
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Nao foi possivel registrar o token push.';
      setTokenSyncError(message);
      reportTelemetryError({
        context: {
          installationId,
          projectId,
        },
        error,
        source: 'push_token_sync',
      });
      return false;
    }
  }

  const contextValue = useMemo<PushNotificationsContextValue>(
    () => ({
      clearTokenSyncError: () => setTokenSyncError(null),
      expoPushToken,
      installationId,
      isRegistering: syncRegistrationMutation.isPending,
      isSupported,
      lastTokenSyncAt,
      permissionStatus,
      projectId,
      requestPushActivation: () => syncPushRegistrationInternal(true),
      syncPushRegistration: () => syncPushRegistrationInternal(false),
      tokenSyncError,
    }),
    [
      expoPushToken,
      installationId,
      isSupported,
      lastTokenSyncAt,
      permissionStatus,
      projectId,
      syncRegistrationMutation.isPending,
      tokenSyncError,
    ],
  );

  return (
    <PushNotificationsContext.Provider value={contextValue}>
      {children}
    </PushNotificationsContext.Provider>
  );
}

export function usePushNotifications() {
  const context = useContext(PushNotificationsContext);

  if (!context) {
    throw new Error('usePushNotifications must be used within PushNotificationsProvider.');
  }

  return context;
}

async function ensureInstallationId() {
  const storedId = await AsyncStorage.getItem(INSTALLATION_STORAGE_KEY);

  if (storedId?.trim()) {
    return storedId;
  }

  const nextId = `push-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(INSTALLATION_STORAGE_KEY, nextId);
  return nextId;
}

async function readCurrentPermissionStatus() {
  if (!Device.isDevice) {
    return 'unsupported' satisfies PushPermissionStatus;
  }

  const permissions = await Notifications.getPermissionsAsync();
  return normalizePushPermissionStatus(permissions.status);
}

function normalizePushPermissionStatus(
  status: Notifications.NotificationPermissionsStatus['status'],
): PushPermissionStatus {
  if (status === 'granted' || status === 'denied' || status === 'undetermined') {
    return status;
  }

  return 'undetermined';
}

function readNotificationRoute(data: Record<string, unknown> | null | undefined) {
  if (!data || typeof data.route !== 'string') {
    return null;
  }

  return data.route.trim() || null;
}

function handleNotificationResponse({
  accountType,
  pathname,
  response,
  router,
}: {
  accountType: string | null;
  pathname: string | null;
  response: Notifications.NotificationResponse;
  router: ReturnType<typeof useRouter>;
}) {
  const identifier = response.notification.request.identifier;

  if (notificationResponseHandledIds.has(identifier)) {
    return;
  }

  notificationResponseHandledIds.add(identifier);
  const route = readNotificationRoute(response.notification.request.content.data);

  reportTelemetryEvent({
    accountType: accountType === 'bar' || accountType === 'musician' ? accountType : null,
    context: {
      notificationIdentifier: identifier,
      route,
    },
    eventName: 'push_notification_opened',
    pathname,
  });

  if (route) {
    router.push(route as never);
  }
}

function readPushRegistrationPlatform(): PushRegistrationPlatform {
  if (Platform.OS === 'ios') {
    return 'ios';
  }

  if (Platform.OS === 'android') {
    return 'android';
  }

  return 'web';
}

function resolveExpoProjectId() {
  const easProjectId =
    (Constants.easConfig as { projectId?: string } | null)?.projectId ??
    (
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
        ?.projectId ?? null
    );

  return env.expoProjectId ?? easProjectId ?? null;
}
