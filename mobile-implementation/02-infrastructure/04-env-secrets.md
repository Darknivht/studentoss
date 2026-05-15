# 04 — Env & Secrets

## Local dev — `.env`

```
SUPABASE_URL=https://aubastwqendcpwwbusgs.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...   # publishable key, OK in client
```

Loaded by `app.config.ts`:

```ts
extra: {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
}
```

Read in code:

```ts
import Constants from 'expo-constants';
Constants.expoConfig.extra.supabaseUrl;
```

## Production — EAS Secrets

```bash
eas secret:create --name SUPABASE_URL --value "https://..."
eas secret:create --name SUPABASE_ANON_KEY --value "eyJ..."
```

EAS injects them as env vars during cloud builds.

## What NEVER goes in the app

- `SUPABASE_SERVICE_ROLE_KEY` — only edge functions
- `LOVABLE_API_KEY` — only edge functions
- `PAYSTACK_SERCET_KEY` (typo intentional, matches web) — only edge functions
- Admin panel password — only edge functions

The mobile client uses **only the anon key**, like the web client. All privileged operations go through Supabase edge functions which already have access via `Deno.env.get(...)`.

## RevenueCat / Paystack public key

Paystack public key is safe in the client. If you swap to RevenueCat for iOS in-app purchases (recommended for App Store compliance), put the public SDK key in `extra` too.

## Acceptance

- [ ] `eas build` succeeds with secrets injected
- [ ] No secret ever appears in `app.json`/`app.config.ts` git history
