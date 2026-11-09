import type { AuthUser } from '../types';

export const AUTH_TOKEN_STORAGE_KEY = 'scholarfind_token';

/** Django auth API response. Field names are snake_case on the wire. */
interface ApiUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  photo_url: string;
}

interface SessionResponse {
  token: string;
  user: ApiUser;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface RegisterInput {
  email: string;
  password: string;
  passwordConfirm?: string;
  displayName?: string;
}

// `import.meta.env` exists under Vite; the fallback keeps this module
// importable by the plain Node test runner too.
const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
const API_BASE = (env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

export class AuthRequestError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'AuthRequestError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function toAuthUser(user: ApiUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.display_name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username,
    photoURL: user.photo_url || undefined,
  };
}

/** DRF returns `{detail}` or `{field: ["message"]}`. Turn either into a usable form error. */
function readError(payload: unknown): { message: string; fieldErrors: Record<string, string> } {
  if (typeof payload === 'string' && payload.trim()) {
    return { message: payload.trim(), fieldErrors: {} };
  }
  if (!payload || typeof payload !== 'object') {
    return { message: 'Something went wrong. Please try again.', fieldErrors: {} };
  }

  const body = payload as Record<string, unknown>;
  if (typeof body.detail === 'string') {
    return { message: body.detail, fieldErrors: {} };
  }

  const fieldErrors: Record<string, string> = {};
  for (const [field, value] of Object.entries(body)) {
    if (Array.isArray(value) && value.length > 0) {
      fieldErrors[field] = String(value[0]);
    } else if (typeof value === 'string' && value) {
      fieldErrors[field] = value;
    }
  }

  const first = Object.values(fieldErrors)[0];
  return {
    message: first || 'Please check the form and try again.',
    fieldErrors,
  };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new AuthRequestError(
      'Could not reach the ScholarFind server. Check your connection and try again.',
      0,
    );
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const { message, fieldErrors } = readError(payload);
    throw new AuthRequestError(message, response.status, fieldErrors);
  }

  return payload as T;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Token ${token}` };
}

export async function registerAccount(input: RegisterInput): Promise<AuthSession> {
  const data = await request<SessionResponse>('/api/auth/register/', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      ...(input.passwordConfirm !== undefined ? { password_confirm: input.passwordConfirm } : {}),
      ...(input.displayName ? { display_name: input.displayName } : {}),
    }),
  });
  return { token: data.token, user: toAuthUser(data.user) };
}

export async function loginAccount(email: string, password: string): Promise<AuthSession> {
  const data = await request<SessionResponse>('/api/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ identifier: email, password }),
  });
  return { token: data.token, user: toAuthUser(data.user) };
}

export async function logoutAccount(token: string): Promise<void> {
  await request<{ detail: string }>('/api/auth/logout/', {
    method: 'POST',
    headers: authHeaders(token),
  });
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const data = await request<{ authenticated: boolean; user: ApiUser }>('/api/auth/me/', {
    headers: authHeaders(token),
  });
  return toAuthUser(data.user);
}

export function readAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } catch {
    /* ignore storage failures */
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    /* ignore storage failures */
  }
}
