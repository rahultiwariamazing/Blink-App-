import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { loginApi, LoginResponse as ApiLoginResponse } from "../../services/authApi";
import { clearSession, setSession } from "../../services/tokenStorage";

import { fetchBootstrap } from "../../services/bootstrapApi";
import { setCartFromServer } from "../slices/cartSlice";

type User = {
  id: string;
  name: string;
  mobile: string;
  email?: string;
};

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;

  user: User | null;
  isLoading: boolean;
  error: string | null;
};

type LoginResponse = {
  token: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  user: User;
};

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  accessTokenExpiresAt: null,
  refreshTokenExpiresAt: null,
  user: null,
  isLoading: false,
  error: null,
};

export const loginThunk = createAsyncThunk<
  LoginResponse,
  { mobile: string; password: string },
  { rejectValue: string }
>("auth/login", async (payload, thunkAPI) => {
  try {
    const res: ApiLoginResponse = await loginApi(payload);

    await setSession({
      accessToken: res.accessToken,
      accessTokenExpiresAt: res.accessTokenExpiresAt,
      refreshToken: res.refreshToken,
      refreshTokenExpiresAt: res.refreshTokenExpiresAt,
    });

    const bootstrap = await fetchBootstrap();
    const backendCart = bootstrap?.Cart ?? [];
    const mapped = backendCart.map((c: any) => ({
      productId: c.ProductId,
      name: c.ProductName,
      price: c.Price,
      quantity: c.Quantity,
      imageUrl: c.ImageUrl ?? "",
    }));
    thunkAPI.dispatch(setCartFromServer(mapped));

    return {
      token: res.accessToken,
      refreshToken: res.refreshToken,
      accessTokenExpiresAt: res.accessTokenExpiresAt,
      refreshTokenExpiresAt: res.refreshTokenExpiresAt,
      user: res.user,
    };
  } catch (e: any) {
    const msg = e?.message ?? "Login failed";
    return thunkAPI.rejectWithValue(msg);
  }
});

export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  await clearSession();

  await AsyncStorage.multiRemove([
    "@blinkdemo_theme_mode",
    "mock_user_addresses_v1",
  ]);

  return true;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loginThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });

    builder.addCase(
      loginThunk.fulfilled,
      (state, action: PayloadAction<LoginResponse>) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.accessTokenExpiresAt = action.payload.accessTokenExpiresAt;
        state.refreshTokenExpiresAt = action.payload.refreshTokenExpiresAt;
        state.user = action.payload.user;
      }
    );

    builder.addCase(loginThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload ?? "Login failed";
    });

    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.token = null;
      state.refreshToken = null;
      state.accessTokenExpiresAt = null;
      state.refreshTokenExpiresAt = null;
      state.user = null;
      state.isLoading = false;
      state.error = null;
    });
  },
});

export const { setToken, setUser, clearAuthError } = authSlice.actions;
export default authSlice.reducer;