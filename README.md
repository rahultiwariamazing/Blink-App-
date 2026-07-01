# BlinkDemo

BlinkDemo is an Expo Router + React Native TypeScript demo app with authentication, catalog browsing, cart management, address handling, and order tracking.

## Tech Stack

- Expo SDK 54
- React Native 0.81
- Expo Router (file-based routing)
- Redux Toolkit + redux-persist
- AsyncStorage
- TypeScript

## Features

- Authentication flow (login, signup, logout)
- Protected navigation with auth-aware route gate
- Product catalog and search
- Cart with optimistic updates
- Address management and default address selection
- Order creation and order history/details
- Theme support via app theme context
- Global toast notifications

## Project Structure

- app/: route screens and navigation layouts
- src/components/: reusable UI building blocks
- src/hooks/: reusable app logic hooks
- src/models/: shared model and type definitions
- src/services/: API and storage infrastructure
- src/store/: Redux store and slices
- src/theme/: theme tokens and context
- src/viewmodels/: screen-oriented state orchestration

## Getting Started

1. Install dependencies:

npm install

2. Start Expo:

npm run start

3. Launch target platform:

- npm run android
- npm run ios
- npm run web

## Scripts

- npm run start: start Metro/Expo
- npm run android: open Android target
- npm run ios: open iOS target
- npm run web: run web target
- npm run typecheck: run TypeScript type checks

## Configuration

API and storage keys are configured in:

- src/services/config.ts

For AI product insights (Groq), add these variables to your Expo env:

- EXPO_PUBLIC_GROQ_API_KEY=your_groq_key
- EXPO_PUBLIC_GROQ_MODEL=llama-3.3-70b-versatile

Current API base URL is set in code for demo usage. For production, move this to environment-specific configuration.

## Engineering Notes

Recent cleanup focused on making core infrastructure and state code production-ready:

- Removed verbose tutorial-style comments and development console logging
- Kept only concise comments where implementation intent is non-obvious
- Preserved existing behavior and public APIs
- Improved readability in core files:
  - app/_layout.tsx
  - src/services/apiClient.ts
  - src/services/authApi.ts
  - src/services/tokenStorage.ts
  - src/store/store.ts
  - src/store/hooks.ts
  - src/store/slices/authSlice.ts
  - src/store/slices/cartSlice.ts
  - src/hooks/useLoginViewModel.ts
  - src/hooks/useCartActions.ts
  - src/components/common/CommonButton.tsx

## Next Professionalization Pass (Optional)

A broader sweep can remove remaining debug logs and verbose comments in route screens and some service/viewmodel files while keeping behavior identical.
