# StudentOS — Mobile Implementation Guide

This folder is the **complete blueprint** for building the StudentOS mobile app as a true **React Native (Expo)** application — not a Capacitor wrapper around the web app.

The goal: a mobile user opening the RN app should experience **zero visual difference** from the web app (same colors, gradients, typography, spacing, animations, layouts), while gaining native-only superpowers (app blocking, usage stats, system notifications, background services, lock-screen widgets).

---

## Who this is for

- A human developer (junior → senior) cloning the web repo and shipping the mobile app
- An AI agent (Lovable, Cursor, Claude Code, etc.) given the web repo + this folder

Either reader should be able to ship a production app **without making a single design decision** — every color, font, gradient, animation, and screen layout is already specified.

---

## How to use this folder

1. Read this file (you are here).
2. Read **`ROADMAP.md`** — it is the master ordered checklist of every phase, step, and acceptance criterion.
3. Follow the roadmap top-to-bottom. Each step links to a deeper file in one of the numbered subfolders.

**Do not skip phases.** Phase 1 (design system) is the foundation that every screen depends on. Phase 6 (native features) depends on Phase 0 (project init with the right Expo config plugins).

---

## Folder map

| Folder | Purpose |
|---|---|
| `00-foundation/` | Stack choice, project init, copy/adapt/rewrite manifests |
| `01-design-system/` | Colors, fonts, gradients, animations, icons — pixel parity with web |
| `02-infrastructure/` | Supabase client, auth, deep links, edge functions |
| `03-navigation/` | React Navigation setup, route map, back button |
| `04-screens/` | One file per page with exact build instructions |
| `05-shared-components/` | shadcn → RN equivalents, per component |
| `06-native-features/` | The reason we're doing RN: app blocking, usage stats, notifications |
| `07-data-and-offline/` | MMKV, offline sync, realtime, file storage |
| `08-testing-and-release/` | EAS Build, store submission, OTA updates |
| `_APPENDIX/` | Lookup tables: components, packages, tailwind→style conversions |

---

## Source of truth

The web app (`src/`) is the reference. When this guide and the web app disagree, **the web app wins** — re-read the web file and update the guide. Pixel parity is non-negotiable.

Key web files referenced throughout:

- `src/index.css` — design tokens (HSL)
- `tailwind.config.ts` — color/animation/shadow scale
- `src/components/layout/AppLayout.tsx` + `BottomNav.tsx` — shell
- `src/pages/*.tsx` — every screen
- `src/hooks/*` — business logic (most ports verbatim)
- `src/integrations/supabase/client.ts` — backend client
- `supabase/functions/**` — backend (zero changes needed)
- `android/app/src/main/java/com/studentoss/app/Focus*` — reference native focus-mode implementation

---

## Non-negotiables

1. **Bright, fun, 3D vibe.** Primary `hsl(262 83% 58%)` purple. No muted enterprise palettes.
2. **Space Grotesk for headings, Inter for body.** Always.
3. **Rounded everything.** `--radius: 1rem` (16px) is the base.
4. **Animations on everything.** Spring transitions, layout animations, haptics on tap.
5. **Same backend.** Same Supabase project, same edge functions, same RLS policies. Do not fork.
6. **Subscription gating server-side.** Reuse `useSubscription` and `FeatureGateDialog` semantics.

---

Start now → open [`ROADMAP.md`](./ROADMAP.md).
