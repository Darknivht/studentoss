# Appendix B — Package Equivalents (Web → Mobile)

| Web package | Mobile equivalent | Notes |
|---|---|---|
| react-router-dom | @react-navigation/native + native-stack + bottom-tabs + material-top-tabs | |
| framer-motion | moti + react-native-reanimated | Moti API ≈ framer-motion |
| tailwindcss + tailwindcss-animate | nativewind v4 + react-native-reanimated | className= works |
| @radix-ui/* (shadcn) | hand-rolled RN primitives | see 05-shared-components |
| recharts | victory-native (Skia) | similar API |
| react-markdown + remark-gfm | react-native-marked | |
| react-katex / katex | react-native-math-view | |
| html2canvas + jspdf | expo-print + expo-sharing | native PDF |
| @supabase/supabase-js | @supabase/supabase-js | unchanged |
| react-helmet-async | — | no head in RN |
| next-themes | custom theme context + MMKV | |
| sonner / shadcn toast | burnt or react-native-toast-message | |
| lucide-react | lucide-react-native | same icons |
| react-pdf | react-native-pdf | |
| docx-preview / mammoth | edge function DOCX→HTML + WebView | |
| xlsx | xlsx (works in RN) | |
| react-dropzone | expo-document-picker + expo-image-picker | |
| react-hook-form + zod | react-hook-form + zod | unchanged |
| @tanstack/react-query | @tanstack/react-query | unchanged |
| date-fns | date-fns | unchanged |
| workbox / vite-plugin-pwa | — | use expo-updates for OTA |
| capacitor | replaced by Expo | |
| @capacitor/* | expo-* equivalents | see Appendix D |
| react-three-fiber | @react-three/fiber/native + expo-gl | optional 3D |
| zustand | zustand | unchanged |
| posthog-js | posthog-react-native | |
| @sentry/react | @sentry/react-native | |
| react-confetti | react-native-confetti-cannon | |
| react-dnd | react-native-draggable-flatlist | |
| paystack inline | react-native-paystack-webview | |

## RN-only essentials (add to package.json)

```
expo, expo-router (optional alternative), expo-splash-screen, expo-status-bar,
expo-haptics, expo-image, expo-image-picker, expo-image-manipulator,
expo-document-picker, expo-file-system, expo-sharing, expo-av, expo-camera,
expo-speech, expo-secure-store, expo-local-authentication, expo-linking,
expo-web-browser, expo-notifications, expo-background-fetch, expo-task-manager,
expo-localization, expo-updates, expo-keep-awake, expo-clipboard,
expo-blur, expo-constants,
react-native-reanimated, react-native-gesture-handler, react-native-screens,
react-native-safe-area-context, react-native-svg,
@gorhom/bottom-sheet, @shopify/flash-list,
react-native-mmkv, @react-native-community/netinfo,
@react-native-async-storage/async-storage
```

