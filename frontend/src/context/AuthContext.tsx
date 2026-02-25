import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
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

// ── Context shape ─────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: rehydrate user from stored tokens
  useEffect(() => {
    async function hydrate() {
      const access = getStoredAccess();
      if (!access) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await getMe(access);
        setUser(me);
      } catch {
        // access token expired — try refresh
        const refresh = getStoredRefresh();
        if (refresh) {
          try {
            const { access: newAccess } = await refreshAccessToken(refresh);
            storeTokens({ access: newAccess, refresh });
            const me = await getMe(newAccess);
            setUser(me);
          } catch {
            clearTokens();
          }
        } else {
          clearTokens();
        }
      } finally {
        setIsLoading(false);
      }
    }
    hydrate();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const tokens = await apiLogin(payload);
    storeTokens(tokens);
    const me = await getMe(tokens.access);
    setUser(me);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const result = await apiRegister(payload);
    storeTokens({ access: result.access, refresh: result.refresh });
    if (result.user) {
      setUser(result.user);
    } else {
      const me = await getMe(result.access);
      setUser(me);
    }
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
