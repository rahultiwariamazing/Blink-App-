import { apiJson } from "./apiClient";

type ApiEnvelope<T> = {
  Success: boolean;
  StatusCode: number;
  Message: string;
  ErrorCode: string | null;
  TraceId: string;
  Data: T | null;
};

type BackendAuthData = {
  UserId: string;
  Name: string;
  Mobile: string;
  Email?: string;

  AccessToken?: string;
  AccessTokenExpiresAt?: string;
  RefreshToken?: string;
  RefreshTokenExpiresAt?: string;
};

export type User = { id: string; name: string; mobile: string; email?: string };

export type AuthTokens = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export type LoginResponse = AuthTokens & { user: User };

type LoginRequest = { mobile: string; password: string };

export async function loginApi(body: LoginRequest): Promise<LoginResponse> {
  const json = await apiJson<ApiEnvelope<BackendAuthData>>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        mobile: body.mobile,
        password: body.password,
      }),
    },
    { auth: false }
  );

  const ok = !!json?.Success && !!json?.Data?.AccessToken && !!json?.Data?.RefreshToken;
  if (!ok) {
    const msg = json?.Message || "Login failed";
    throw new Error(msg);
  }

  const d = json.Data!;

  return {
    accessToken: d.AccessToken!,
    accessTokenExpiresAt: d.AccessTokenExpiresAt!,
    refreshToken: d.RefreshToken!,
    refreshTokenExpiresAt: d.RefreshTokenExpiresAt!,
    user: {
      id: d.UserId,
      name: d.Name,
      mobile: d.Mobile,
      email: d.Email,
    },
  };
}

export type RegisterRequest = {
  name: string;
  mobile: string;
  email: string;
  password: string;
};

export type RegisterResponse =
  | { created: true }
  | ({ created: true } & LoginResponse);

export async function registerApi(body: RegisterRequest): Promise<RegisterResponse> {
  const json = await apiJson<ApiEnvelope<BackendAuthData>>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify({
        name: body.name,
        mobile: body.mobile,
        email: body.email,
        password: body.password,
      }),
    },
    { auth: false }
  );

  if (!json?.Success) {
    const msg = json?.Message || "Signup failed";
    throw new Error(msg);
  }

  const d = json.Data;
  const hasTokens =
    !!d?.AccessToken &&
    !!d?.RefreshToken &&
    !!d?.AccessTokenExpiresAt &&
    !!d?.RefreshTokenExpiresAt;

  if (hasTokens) {
    return {
      created: true,
      accessToken: d!.AccessToken!,
      accessTokenExpiresAt: d!.AccessTokenExpiresAt!,
      refreshToken: d!.RefreshToken!,
      refreshTokenExpiresAt: d!.RefreshTokenExpiresAt!,
      user: {
        id: d!.UserId,
        name: d!.Name,
        mobile: d!.Mobile,
        email: d!.Email,
      },
    };
  }

  return { created: true };
}