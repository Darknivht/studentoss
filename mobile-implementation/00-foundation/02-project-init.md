# 02 — Project Init

Run these commands inside your **local mobile folder** (not the web repo).

## 1. Create the Expo app

```bash
npx create-expo-app@latest StudentOSMobile --template blank-typescript
cd StudentOSMobile
```

## 2. Install core deps

```bash
# styling
npx expo install nativewind tailwindcss@^3.4 expo-linear-gradient

# animation
npx expo install react-native-reanimated react-native-gesture-handler moti

# navigation
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context

# state / data
npm i @tanstack/react-query @supabase/supabase-js
npx expo install @react-native-async-storage/async-storage react-native-mmkv expo-secure-store

# icons / md / math
npm i lucide-react-native react-native-markdown-display
npx expo install react-native-math-view react-native-svg

# files / media
npx expo install expo-document-picker expo-image-picker expo-camera expo-file-system expo-av react-native-pdf

# native
npx expo install expo-notifications expo-task-manager expo-background-fetch expo-haptics expo-linking expo-updates

# theme
npm i next-themes  # we use only its API surface; storage swapped to MMKV
```

## 3. Configure Tailwind / Nativewind

```bash
npx tailwindcss init
```

Then copy `tailwind.config.ts` from the web repo and adjust `content`:

```ts
content: ['./App.tsx', './src/**/*.{ts,tsx}'],
```

Add `babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: ['react-native-reanimated/plugin'], // MUST be last
  };
};
```

Create `nativewind-env.d.ts`:

```ts
/// <reference types="nativewind/types" />
```

## 4. Path aliases

`tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["**/*.ts", "**/*.tsx", "nativewind-env.d.ts"]
}
```

`metro.config.js`:

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: './src/global.css' });
```

## 5. Folder layout

```
StudentOSMobile/
├── app.config.ts
├── eas.json
├── babel.config.js
├── metro.config.js
├── tailwind.config.ts
├── tsconfig.json
├── App.tsx                 # entry: providers + RootNavigator
├── src/
│   ├── global.css          # @tailwind base/components/utilities
│   ├── navigation/         # RootNavigator, BottomTabs
│   ├── screens/            # one file per page (mirrors web src/pages)
│   ├── components/         # mirrors web src/components
│   ├── hooks/              # ports of web src/hooks
│   ├── lib/                # ports of web src/lib
│   ├── integrations/supabase/ # client.ts (RN version), types.ts (verbatim copy)
│   ├── theme/              # tokens.ts, gradients.ts, shadows.ts
│   └── plugins/            # expo config plugins (focus mode)
└── assets/                 # icon, splash, fonts
```

## 6. App config

`app.config.ts`:

```ts
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'StudentOS',
  slug: 'studentos',
  scheme: 'studentos',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  splash: { image: './assets/splash.png', resizeMode: 'contain', backgroundColor: '#9333ea' },
  newArchEnabled: true,
  ios: {
    bundleIdentifier: 'com.studentoss.app',
    supportsTablet: false,
  },
  android: {
    package: 'com.studentoss.app',
    permissions: [
      'NOTIFICATIONS',
      'PACKAGE_USAGE_STATS',
      'SYSTEM_ALERT_WINDOW',
      'FOREGROUND_SERVICE',
      'RECEIVE_BOOT_COMPLETED',
      'POST_NOTIFICATIONS',
    ],
    largeHeap: true,
  },
  plugins: [
    'expo-notifications',
    'expo-secure-store',
    './src/plugins/focus-mode-plugin', // built in Phase 6
  ],
  extra: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    eas: { projectId: 'YOUR_EAS_ID' },
  },
};

export default config;
```

## 7. EAS init

```bash
npm i -g eas-cli
eas login
eas init   # creates projectId
eas build:configure
```

## 8. First boot

```bash
npx expo start --dev-client
```

Scan the QR with Expo Go (will work for everything except the focus plugin — that needs a custom dev client built via `eas build --profile development`).

## Acceptance

- [ ] App boots to a blank screen on real device
- [ ] `import { View } from 'react-native'` resolves
- [ ] `<View className="bg-red-500" />` renders red — proves Nativewind works
- [ ] No reanimated babel warning
