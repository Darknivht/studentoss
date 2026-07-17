# Plan: Audit Mobile Plans + Guided @Mention Build System

## Goal
Fix gaps in `mobile-implementation/` docs, then create a lightweight "message log" workflow where you drop prompts with `@file` / `@dir` mentions and I build one screen at a time into a new `/mobile` Expo project.

---

## Phase 1 — Audit & fix `mobile-implementation/`

Review pass across the existing docs, patching in place. Deliverables:

1. **Coverage check** — cross-reference `src/pages/` and `src/components/` against:
   - `04-screens/` (must have 29 screen specs)
   - `09-connections/` (must have 1 connections file per screen)
   - `ROADMAP.md` phase 5 list
   Add any missing screen (e.g. verify AdminAnalytics, ParentDashboard, StudyGroupDetail, ChatThread, ExamSession, MockExam, NoteViewer are all present).

2. **Content-depth check** — flag any doc under ~80 lines or missing:
   - web import map
   - connected sub-components with paths
   - verbatim Tailwind classNames
   - NativeWind mapping
   - 12-step build order
   Rewrite thin files to full spec.

3. **Consistency fixes**
   - Every connections file must reference the same Supabase client adapter path
   - Every screen doc must link to its connections file and vice-versa
   - `ROADMAP.md` phase order must match the dependency graph in connections files

4. **Add missing cross-cutting docs** if absent:
   - `10-shared-logic/` index mapping every copy-verbatim hook/lib
   - `11-native-modules/` for FocusMode, UsageStats, Notifications, AppBlocker Expo module specs

## Phase 2 — Create the @mention message log system

New folder `mobile-implementation/12-message-log/` containing:

1. **`README.md`** — how the loop works:
   - You append a message to `INBOX.md` using `@path/to/file` and `@path/to/dir/` syntax
   - Each turn I read only the mentioned paths + the target screen's connections file, build/patch, then append a completion entry to `LOG.md`
   - Prevents context drift — no full-repo scans per turn

2. **`INBOX.md`** — template with sections:
   ```
   ## Next request
   Screen: <name>
   Mentions: @mobile-implementation/09-connections/03-Dashboard-connections.md @src/pages/Dashboard.tsx
   Notes: <your instructions>
   ```

3. **`LOG.md`** — running append-only log of built screens, files created, and any deviations from spec.

4. **`MENTION_SYNTAX.md`** — rules:
   - `@path` = file, `@path/` = directory (recursive read allowed)
   - `@screen:Dashboard` = shorthand that expands to connections + web page + web components
   - `@copy:hooks` = shorthand for the verbatim-copy hook list

5. **`PROMPT_TEMPLATES.md`** — 5-6 ready templates (new screen, fix bug, port component, wire supabase, add native module, polish styles).

## Phase 3 — Initialize `/mobile` Expo project skeleton (one-shot foundation only)

Create sibling `/mobile` dir with:
- Expo 52 + RN 0.76 + TypeScript
- NativeWind v4 + tailwind config ported from web (colors, gradients, fonts, tokens)
- React Navigation (stack + bottom tabs shell)
- Supabase client with AsyncStorage adapter (rewritten from `src/integrations/supabase/client.ts`)
- Copy-verbatim of the safe hooks/libs list already documented in `00-foundation/03-files-to-copy.md`
- Empty screen files for all 29 screens routed but rendering placeholders
- `README.md` pointing at the message-log workflow

After this you drive every subsequent screen build via `INBOX.md` mentions.

---

## Technical details

- `/mobile` is a sibling to `/src`, not nested. Its own `package.json`, `tsconfig.json`, `metro.config.js`, `babel.config.js`, `app.json`.
- Shared Supabase project ref `aubastwqendcpwwbusgs` — no backend changes.
- No edits to web app (`src/`) during any phase.
- Native modules (AppBlocker, UsageStats) scaffolded as Expo config plugins with Android-only Kotlin stubs; iOS marked "not supported" per web parity.
- Message-log turns will only touch `/mobile/**` and append to `LOG.md`.

## Order of execution
Phase 1 → Phase 2 → Phase 3. Phase 3 does not start until 1 & 2 are complete in the same build session.

## What I need from you after approval
Nothing — I'll do Phase 1-3 in the next build turn, then hand control to you via `INBOX.md`.
