import axios from "axios";
import type {
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  ChangePasswordPayload,
  User,
} from "../types/trip";

const base = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const plain = axios.create({
  baseURL: base,
  headers: { "Content-Type": "application/json" },
});

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const { data } = await plain.post<AuthTokens>("/api/auth/token/", payload);
  return data;
}

export async function register(
  payload: RegisterPayload,
): Promise<AuthTokens & { user: User }> {
  const { data } = await plain.post<AuthTokens & { user: User }>(
    "/api/auth/register/",
    payload,
  );
  return data;
}

export async function refreshAccessToken(
  refresh: string,
): Promise<{ access: string }> {
  const { data } = await plain.post<{ access: string }>(
    "/api/auth/token/refresh/",
    { refresh },
  );
  return data;
}

export async function getMe(accessToken: string): Promise<User> {
  const { data } = await plain.get<User>("/api/auth/me/", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function updateProfile(
  accessToken: string,
  payload: UpdateProfilePayload,
): Promise<User> {
  const { data } = await plain.patch<User>("/api/auth/me/", payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function changePassword(
  accessToken: string,
  payload: ChangePasswordPayload,
): Promise<void> {
  await plain.post("/api/auth/me/change-password/", payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function logoutUser(
  accessToken: string,
  refresh: string,
): Promise<void> {
  await plain.post(
    "/api/auth/logout/",
    { refresh },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}

export async function deleteAccount(accessToken: string): Promise<void> {
  await plain.delete("/api/auth/me/", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
