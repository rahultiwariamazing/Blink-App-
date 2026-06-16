export const API_CONFIG = {
  BASE_URL: "https://rahul007007tiwari.bsite.net",
  TIMEOUT_MS: 30000,
};

export const AI_CONFIG = {
  GROQ_API_URL: "https://api.groq.com/openai/v1/chat/completions",
  GROQ_API_KEY:  "",
  GROQ_MODEL: process.env.EXPO_PUBLIC_GROQ_MODEL ?? "llama-3.3-70b-versatile",
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  ACCESS_EXPIRES_AT: "accessTokenExpiresAt",
  REFRESH_EXPIRES_AT: "refreshTokenExpiresAt",
  LEGACY_TOKEN: "token",
};