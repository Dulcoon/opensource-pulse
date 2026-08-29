import { get, post } from "./http";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

const TOKEN_KEY = "pulse_admin_token";
const USER_KEY = "pulse_admin_user";

export function login(email: string, password: string): Promise<LoginResponse> {
  return post<LoginResponse>("/auth/login", { email, password });
}

export function getMe(): Promise<AuthUser> {
  return get<AuthUser>("/auth/me");
}

export function saveAuthSession(token: string, user: AuthUser) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function getStoredAuthSession(): { token: string | null; user: AuthUser | null } {
  if (typeof window === "undefined") {
    return { token: null, user: null };
  }
  const token = localStorage.getItem(TOKEN_KEY);
  const userJson = localStorage.getItem(USER_KEY);
  let user: AuthUser | null = null;
  if (userJson) {
    try {
      user = JSON.parse(userJson);
    } catch {
      user = null;
    }
  }
  return { token, user };
}

export function clearAuthSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
