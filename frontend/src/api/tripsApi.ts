import axios, { type InternalAxiosRequestConfig } from "axios";
import type {
  Trip,
  TripList,
  CreateTripPayload,
  CreateTripResponse,
} from "../types/trip";
import { getStoredAccess, getStoredRefresh } from "../context/AuthContext";
import { refreshAccessToken } from "./authApi";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach Bearer token ──────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: auto-refresh on 401 ────────────────────────────
let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config as InternalAxiosRequestConfig & {
      _retried?: boolean;
    };
    if (err.response?.status === 401 && !original._retried) {
      original._retried = true;
      const storedRefresh = getStoredRefresh();
      if (!storedRefresh) return Promise.reject(err);

      // Deduplicate concurrent refresh calls
      if (!refreshing) {
        refreshing = refreshAccessToken(storedRefresh)
          .then(({ access }) => {
            localStorage.setItem("eld_access", access);
            return access;
          })
          .catch((e) => {
            localStorage.removeItem("eld_access");
            localStorage.removeItem("eld_refresh");
            window.location.href = "/login";
            return Promise.reject(e);
          })
          .finally(() => {
            refreshing = null;
          });
      }

      const newAccess = await refreshing;
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    }
    return Promise.reject(err);
  },
);

// ── API calls ─────────────────────────────────────────────────────────────
export async function listTrips(): Promise<TripList[]> {
  const { data } = await api.get<TripList[]>("/api/trips/");
  return data;
}

export async function createTrip(
  payload: CreateTripPayload,
): Promise<CreateTripResponse> {
  const { data } = await api.post<CreateTripResponse>("/api/trips/", payload);
  return data;
}

export async function getTrip(id: string): Promise<Trip> {
  const { data } = await api.get<Trip>(`/api/trips/${id}/`);
  return data;
}
