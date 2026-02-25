import { create } from "zustand";
import type {
  User,
  AuthTokens,
  LoginPayload,
  RegisterPayload,
} from "../types/trip";
import {
  login as apiLogin,
  register as apiRegister,
  getMe,
  refreshAccessToken,
  logoutUser,
} from "../api/authApi";

// ── Storage keys ──────────────────────────────────────────────────────────
const ACCESS_KEY = "eld_access";
const REFRESH_KEY = "eld_refresh";

export function getStoredAccess(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}
export function getStoredRefresh(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}
function storeTokens(tokens: AuthTokens) {
  localStorage.setItem(ACCESS_KEY, tokens.access);
  localStorage.setItem(REFRESH_KEY, tokens.refresh);
}
function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ── Store shape ───────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // actions
  initialize: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateUser: (u: User) => void;
}

export const useAuth = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    const access = getStoredAccess();
    if (!access) {
      set({ isLoading: false });
      return;
    }
    try {
      const me = await getMe(access);
      set({ user: me, isAuthenticated: true, isLoading: false });
    } catch {
      const refresh = getStoredRefresh();
      if (refresh) {
        try {
          const { access: newAccess } = await refreshAccessToken(refresh);
          storeTokens({ access: newAccess, refresh });
          const me = await getMe(newAccess);
          set({ user: me, isAuthenticated: true, isLoading: false });
        } catch {
          clearTokens();
          set({ isLoading: false });
        }
      } else {
        clearTokens();
        set({ isLoading: false });
      }
    }
  },

  login: async (payload: LoginPayload) => {
    const tokens = await apiLogin(payload);
    storeTokens(tokens);
    const me = await getMe(tokens.access);
    set({ user: me, isAuthenticated: true });
  },

  register: async (payload: RegisterPayload) => {
    const result = await apiRegister(payload);
    storeTokens({ access: result.access, refresh: result.refresh });
    const me = result.user ?? (await getMe(result.access));
    set({ user: me, isAuthenticated: true });
  },

  logout: () => {
    const access = getStoredAccess();
    const refresh = getStoredRefresh();
    clearTokens();
    set({ user: null, isAuthenticated: false });
    if (access && refresh) logoutUser(access, refresh).catch(() => {});
  },

  updateUser: (u: User) => set({ user: u }),
}));

// Auto-initialize when the module is first imported
useAuth.getState().initialize();
