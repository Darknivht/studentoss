# StudentOS Mobile (Expo / React Native)

Sibling to the web app in `/src`. Same Supabase backend (`aubastwqendcpwwbusgs`). Built one screen at a time via the message-log workflow.

## Quickstart
```bash
cd mobile
npm install
npx expo start
```

## How screens get built
**All new work is driven by `mobile-implementation/12-message-log/INBOX.md`.**

1. Open `mobile-implementation/12-message-log/PROMPT_TEMPLATES.md`
2. Copy a template into `INBOX.md`
3. Fill in the screen name + `@mentions`
4. Send any short chat message ("go", "build next")
5. Lovable reads only mentioned files, builds the screen, logs to `LOG.md`

## What's in this skeleton
- Expo 52 + RN 0.76 + NativeWind v4
- Design tokens ported from web `src/index.css`
- Supabase client with AsyncStorage adapter (`src/integrations/supabase/client.ts`)
- React Navigation: bottom tabs (Dashboard/Study/Plan/Social/Focus/Profile) + stack for everything else
- 29 placeholder screens ready to be filled in

## Copy verbatim from web (run once)
```bash
cp ../src/integrations/supabase/types.ts src/integrations/supabase/types.ts
# then hooks + lib per mobile-implementation/10-shared-logic/README.md
```

## Design system parity
Same HSL variables, same font families (Space Grotesk display, Inter body), same 1rem radius. All in `tailwind.config.js` + `global.css`.

## Do NOT
- Edit `/src` (web app) from mobile turns
- Import anything from `../src/*` (path outside `mobile/`)
- Change Supabase schema from here — use the web project's migrations
