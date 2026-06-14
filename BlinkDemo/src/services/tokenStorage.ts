import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "./config";

export type StoredSession = {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
};

export async function getSession(): Promise<StoredSession> {
  const pairs = await AsyncStorage.multiGet([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.ACCESS_EXPIRES_AT,
    STORAGE_KEYS.REFRESH_EXPIRES_AT,
    STORAGE_KEYS.LEGACY_TOKEN,
  ]);

  const [accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt, legacyToken] =
    pairs.map((x) => x[1]);

  const session: StoredSession = {
    accessToken: accessToken ?? legacyToken ?? null,
    refreshToken: refreshToken ?? null,
    accessTokenExpiresAt: accessTokenExpiresAt ?? null,
    refreshTokenExpiresAt: refreshTokenExpiresAt ?? null,
  };

  return session;
}

export async function setSession(session: {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}) {
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.ACCESS_TOKEN, session.accessToken],
    [STORAGE_KEYS.REFRESH_TOKEN, session.refreshToken],
    [STORAGE_KEYS.ACCESS_EXPIRES_AT, session.accessTokenExpiresAt],
    [STORAGE_KEYS.REFRESH_EXPIRES_AT, session.refreshTokenExpiresAt],

    [STORAGE_KEYS.LEGACY_TOKEN, session.accessToken],
  ]);
}

export async function clearSession() {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.ACCESS_EXPIRES_AT,
    STORAGE_KEYS.REFRESH_EXPIRES_AT,
    STORAGE_KEYS.LEGACY_TOKEN,
  ]);
}

export function isExpired(expiresAtIso: string | null) {
  if (!expiresAtIso) {
    return false;
  }
  const t = new Date(expiresAtIso).getTime();
  return Number.isFinite(t) ? Date.now() >= t : false;
}