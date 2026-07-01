# React Native Core Concepts (BlinkDemo)

Keep this page for fast revision.

## 1) Hooks

What it is:
- Functions that let components manage state, side effects, memoization, and refs.

How you use it here:
- `useState` for local UI state and loading.
- `useEffect` for lifecycle and data fetching.
- `useMemo` to avoid recalculating derived values.
- `useCallback` to keep handler identity stable.
- `useRef` for mutable values without re-render.

Project references:
- Home VM hook: [src/viewmodels/HomeViewModel.ts#L79](../src/viewmodels/HomeViewModel.ts#L79)
- Cart custom hook: [src/hooks/useCartActions.ts#L18](../src/hooks/useCartActions.ts#L18)
- Detail screen params + memo: [app/search/view-all.tsx#L129](../app/search/view-all.tsx#L129)

Interview one-liner:
- "I use hooks to split UI state, side effects, and reusable business logic into clean units."

## 2) Custom Hooks

What it is:
- Reusable logic extracted into a hook instead of repeating in screens.

How you use it here:
- `useCartActions` centralizes add/remove/update cart behavior + optimistic flow.
- `useHomeVM` centralizes Home screen loading + filtering logic.

Project references:
- [src/hooks/useCartActions.ts#L18](../src/hooks/useCartActions.ts#L18)
- [src/viewmodels/HomeViewModel.ts#L79](../src/viewmodels/HomeViewModel.ts#L79)

Interview one-liner:
- "Custom hooks helped me keep screens dumb and move logic to testable reusable units."

## 3) Redux Toolkit (Store + Slice + Reducer)

What it is:
- Centralized global state management.

How you use it here:
- Store setup with combined reducers.
- Feature slices: auth, cart, delivery.
- Reducers change state with simple mutable-style code (Immer under the hood).

Project references:
- Store config: [src/store/store.ts#L1](../src/store/store.ts#L1)
- Cart reducers/selectors: [src/store/slices/cartSlice.ts#L23](../src/store/slices/cartSlice.ts#L23)
- Auth slice + reducers: [src/store/slices/authSlice.ts#L96](../src/store/slices/authSlice.ts#L96)

Interview one-liner:
- "Redux Toolkit reduced boilerplate and made reducers/thunks readable and maintainable."

## 4) Async Thunks (Async Redux)

What it is:
- Async actions for API calls and side effects.

How you use it here:
- `loginThunk` calls login API, stores session, fetches bootstrap, updates cart.
- `logoutThunk` clears session and related local data.

Project references:
- [src/store/slices/authSlice.ts#L46](../src/store/slices/authSlice.ts#L46)
- [src/store/slices/authSlice.ts#L85](../src/store/slices/authSlice.ts#L85)

Interview one-liner:
- "I keep async login/logout orchestration in thunks so UI remains focused on rendering and events."

## 5) Reducers and Selectors

What it is:
- Reducers update state; selectors read derived values efficiently.

How you use it here:
- Cart reducers for add/remove/set quantity.
- Selectors compute cart count and total.

Project references:
- Reducers: [src/store/slices/cartSlice.ts#L26](../src/store/slices/cartSlice.ts#L26)
- Selectors: [src/store/slices/cartSlice.ts#L85](../src/store/slices/cartSlice.ts#L85)

Interview one-liner:
- "Selectors keep computed values out of UI and improve consistency."

## 6) Storage (AsyncStorage + Persist)

What it is:
- Local key-value storage for app/session persistence.

How you use it here:
- `redux-persist` stores selected Redux state.
- Token/session values are saved and restored via `tokenStorage`.
- Theme mode is persisted.

Project references:
- Redux persist config: [src/store/store.ts#L14](../src/store/store.ts#L14)
- Session storage helpers: [src/services/tokenStorage.ts#L10](../src/services/tokenStorage.ts#L10)
- Theme persistence: [src/theme/ThemeContext.tsx#L90](../src/theme/ThemeContext.tsx#L90)

Interview one-liner:
- "I persist only what is needed and avoid stale auth issues by controlling what gets persisted."

## 7) API Layer and Error Handling

What it is:
- Central service layer to call backend and standardize API handling.

How you use it here:
- `apiClient` handles auth headers, 401 retry, refresh token, envelope parsing.
- Feature services (`homeService`, `authApi`, `cartApi`, etc.) call `apiJson`.

Project references:
- Core API client: [src/services/apiClient.ts#L203](../src/services/apiClient.ts#L203)
- JSON wrapper: [src/services/apiClient.ts#L246](../src/services/apiClient.ts#L246)
- Home service usage: [src/services/homeService.ts#L91](../src/services/homeService.ts#L91)

Interview one-liner:
- "I use a centralized API client so token refresh and error logic are solved once, not repeated per screen."

## 8) Navigation (Expo Router)

What it is:
- File-based navigation in Expo/React Native.

How you use it here:
- Route groups: `(auth)` and `(tabs)`.
- Auth gate redirects based on token.
- Passing params to detail screens.

Project references:
- Root layout + auth gate: [app/_layout.tsx#L16](../app/_layout.tsx#L16)
- Push to detail: [app/(tabs)/home.tsx#L282](../app/(tabs)/home.tsx#L282)
- Read route params: [app/search/view-all.tsx#L129](../app/search/view-all.tsx#L129)

Interview one-liner:
- "I used file-based routing with an auth gate to protect private routes and simplify navigation structure."

## 9) Theme and Context API

What it is:
- Global context for shared cross-screen state (theme mode/colors).

How you use it here:
- `ThemeProvider` wraps app.
- `useTheme()` gives `mode`, `colors`, and toggle actions.

Project references:
- Provider wrapping app: [app/_layout.tsx#L47](../app/_layout.tsx#L47)
- Theme context + hook: [src/theme/ThemeContext.tsx#L76](../src/theme/ThemeContext.tsx#L76)

Interview one-liner:
- "Context handles global UI concerns like theme, while Redux handles heavier app state."

## 10) MVVM-like Structure (Great for Interview)

What it is:
- Separate View, ViewModel-like hooks, and Services.

How you use it here:
- Views in `app/`.
- ViewModel hooks in `src/viewmodels/` and `src/hooks/`.
- API in `src/services/`.

Project references:
- View example: [app/(tabs)/home.tsx#L86](../app/(tabs)/home.tsx#L86)
- ViewModel example: [src/viewmodels/HomeViewModel.ts#L79](../src/viewmodels/HomeViewModel.ts#L79)
- Service example: [src/services/homeService.ts#L147](../src/services/homeService.ts#L147)

Interview one-liner:
- "I separated rendering, state orchestration, and data access to keep code scalable and easier to debug."

## 11) TypeScript Models

What it is:
- Strongly typed data contracts for safer code.

How you use it here:
- Model types for auth, home, and address data.
- Typed Redux state and typed selector/dispatch hooks.

Project references:
- Models: [src/models/HomeModels.ts](../src/models/HomeModels.ts)
- Typed hooks: [src/store/hooks.ts#L1](../src/store/hooks.ts#L1)

Interview one-liner:
- "TypeScript reduced runtime mistakes by catching invalid shapes and wrong usage at compile time."

---

## What to memorize first (if short on time)

1. Hooks vs Custom Hooks
2. Redux Slice + Thunk + Selector
3. AsyncStorage and redux-persist
4. API client with token refresh
5. Expo Router auth gate
