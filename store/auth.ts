import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  usedBackupCodes: Set<string>;
  setAuthenticated: (value: boolean) => void;
  setUserId: (id: string | null) => void;
  enableTwoFactor: (secret: string) => void;
  disableTwoFactor: () => void;
  addUsedBackupCode: (code: string) => void;
  resetAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userId: null,
  twoFactorEnabled: false,
  twoFactorSecret: null,
  usedBackupCodes: new Set(),

  setAuthenticated: (value: boolean) =>
    set({ isAuthenticated: value }),

  setUserId: (id: string | null) =>
    set({ userId: id }),

  enableTwoFactor: (secret: string) =>
    set({
      twoFactorEnabled: true,
      twoFactorSecret: secret,
    }),

  disableTwoFactor: () =>
    set({
      twoFactorEnabled: false,
      twoFactorSecret: null,
      usedBackupCodes: new Set(),
    }),

  addUsedBackupCode: (code: string) =>
    set((state) => ({
      usedBackupCodes: new Set([...state.usedBackupCodes, code]),
    })),

  resetAuth: () =>
    set({
      isAuthenticated: false,
      userId: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      usedBackupCodes: new Set(),
    }),
}));
