import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { readAccountType, type AccountType } from './account';

export type PendingAuthFlow = 'password-recovery';

type SessionUiState = {
  accountType: AccountType | null;
  isHydrated: boolean;
  pendingAuthFlow: PendingAuthFlow | null;
  setAccountType: (accountType: AccountType | null) => void;
  setHydrated: (isHydrated: boolean) => void;
  setPendingAuthFlow: (pendingAuthFlow: PendingAuthFlow | null) => void;
};

export const useSessionStore = create<SessionUiState>()(
  persist(
    (set) => ({
      accountType: null,
      isHydrated: false,
      pendingAuthFlow: null,
      setAccountType: (accountType) => set({ accountType }),
      setHydrated: (isHydrated) => set({ isHydrated }),
      setPendingAuthFlow: (pendingAuthFlow) => set({ pendingAuthFlow }),
    }),
    {
      merge: (persistedState, currentState) => {
        const storedState = persistedState as
          | {
              accountType?: unknown;
              pendingAuthFlow?: unknown;
            }
          | undefined;

        return {
          ...currentState,
          accountType: readAccountType(storedState?.accountType),
          pendingAuthFlow: readPendingAuthFlow(storedState?.pendingAuthFlow),
        };
      },
      name: 'tocaai.session-ui',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        accountType: state.accountType,
        pendingAuthFlow: state.pendingAuthFlow,
      }),
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

function readPendingAuthFlow(value: unknown): PendingAuthFlow | null {
  return value === 'password-recovery' ? value : null;
}
