# 01 — Auth Screen

**Web reference:** `src/pages/Auth.tsx`

## Visual spec

- Full-screen `<Gradient preset="primary-accent">` background
- Centered card: white in light mode, `bg-card` in dark — `rounded-3xl` (24), `p-6`, `shadow-glow`
- Big bold logo "StudentOS" — `font-display text-4xl text-foreground`
- Tagline: Inter `text-base text-muted-foreground`
- Tabs: "Sign in" / "Sign up" — pill style, animated active state
- Inputs: `rounded-2xl bg-input p-4` (use the `<Input>` primitive from `05-shared-components/01-ui-primitives.md`)
- Primary button: full-width, `bg-primary text-primary-foreground rounded-2xl py-4 font-sans-semibold`
- "Continue with Google" button: outline + Google icon
- Footer: "Forgot password?" link

## Component tree

```tsx
<SafeAreaView className="flex-1">
  <Gradient preset="primary-accent" className="flex-1 justify-center px-6">
    <MotiView from={{opacity:0, translateY:20}} animate={{opacity:1, translateY:0}}>
      <View className="bg-card rounded-3xl p-6" style={shadow('glow')}>
        <Text className="font-display text-4xl text-foreground">StudentOS</Text>
        <Text className="font-sans text-base text-muted-foreground mb-6">
          Your AI-powered study companion
        </Text>
        <Tabs value={mode} onChange={setMode}>
          <TabPanel value="signin"><SignInForm /></TabPanel>
          <TabPanel value="signup"><SignUpForm /></TabPanel>
        </Tabs>
        <Divider label="or" className="my-4" />
        <GoogleButton onPress={signInWithGoogle} />
        {Platform.OS === 'ios' && <AppleButton onPress={signInWithApple} />}
      </View>
    </MotiView>
  </Gradient>
</SafeAreaView>
```

## Hooks used

- `useAuth()` — `signIn`, `signUp` methods (from ported hook)
- Local `useState` for form fields, loading, error

## Validation

Same Zod rules as web:
- email regex
- password min 8 chars

## Forgot password

Modal sheet with email input → calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'studentos://reset-password' })`.

## Animations

- Card fade-in on mount (200ms ease-out)
- Tab indicator springs (Moti)
- Button scale 0.98 on press (Reanimated)

## Acceptance

- [ ] Side-by-side with web `/auth` matches at all breakpoints
- [ ] Email signup → confirmation deep link works
- [ ] Google OAuth completes successfully
- [ ] Apple sign-in shown on iOS only
