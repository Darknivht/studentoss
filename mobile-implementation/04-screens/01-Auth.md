# 01 — Auth

> **Web source of truth:** `src/pages/Auth.tsx`
> **RN target:** `src/screens/AuthScreen.tsx`
> **Route name:** `Auth`
> **Auth:** Public (redirects to Dashboard if session exists)
> **Bottom nav visible:** No

---

## 1. Purpose

Sign in / sign up with email+password and Google OAuth. Includes password reset request, education-level + grade selection on signup, and a hero illustration.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `useAuth()` → `signIn`, `signUp`, `signInWithGoogle`, `resetPassword`, `user`, `loading`
- `useNavigation()` (RN) replaces `useNavigate()`
- `useEducationConfig()` for grade-level options

## 3. Layout (top → bottom)

1. Animated gradient background (Moti `LinearGradient` rotating hue)
2. Logo + tagline 'Your Academic OS'
3. Tab switcher: `Sign In | Sign Up`
4. Form fields (email, password, confirm, full name on signup, education level + grade on signup)
5. Primary button (gradient, 56dp tall)
6. 'Continue with Google' outlined button with Google G icon
7. Footer: terms + privacy links

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| `<form>` | `<KeyboardAvoidingView>` + `<ScrollView>` | behavior='padding' on iOS |
| `<Input>` | `<TextInput>` (RN primitive in `components/ui/Input.tsx`) | autoCapitalize='none' for email |
| `<Button>` | `<Pressable>` with haptic | impact 'Medium' |
| `<Tabs>` | custom segmented control | animated indicator using Reanimated `useSharedValue` |

## 5. Animations

- Form slides up on mount (Moti `from={{opacity:0,translateY:40}} animate={{opacity:1,translateY:0}}`)
- Tab indicator slides between Sign In / Sign Up using `withSpring`
- Submit button scale 0.96 on press (Reanimated)
- Error shake: translateX [-8, 8, -6, 6, 0] over 300ms

## 6. Interactions & navigation

- On successful sign-in → `navigation.reset({routes:[{name:'Main'}]})`
- 'Forgot password?' → opens modal with email input, calls `resetPassword`
- Google → `WebBrowser.openAuthSessionAsync` with `studentos://auth/callback`
- Toast on every error (use `react-native-toast-message` or `burnt`)

## 7. Edge cases (MUST handle)

- User already authenticated → auto-redirect on mount
- Network offline → show inline banner 'You are offline — sign in unavailable'
- Email unconfirmed → show 'Check your inbox' state with 'Resend' button
- OAuth cancellation → no error toast, just return to form
- iOS keyboard covering submit button → scroll into view via `ref.measureInWindow`

## 8. Native enhancements (mobile-only wins)

- Autofill: `textContentType='emailAddress'` / `'newPassword'`
- Biometric login after first successful sign-in (expo-local-authentication) — store refresh token in `expo-secure-store`
- Haptic success on sign-in

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] Sign up + sign in + Google all work end-to-end
- [ ] Password reset email arrives via deep link
- [ ] Keyboard never covers active field
- [ ] Works in light & dark mode
- [ ] Biometric prompt offered on second launch

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

