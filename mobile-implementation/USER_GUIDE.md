# User Guide — How to Prompt an AI Agent to Build StudentOS Mobile

This guide is for **you, the non-developer owner**, prompting an AI agent (Cursor, Claude Code, Lovable, etc.) to build the React Native app from these docs.

---

## 1. Pick your AI tool

| Tool | Best for | Notes |
|---|---|---|
| **Cursor** | Full repo control | Recommended. Point it at the `mobile/` folder. |
| **Claude Code (CLI)** | Long autonomous runs | Great for the big screen ports. |
| **Lovable** | Web UI; less ideal for RN native modules | Use only for non-native parts. |
| **GitHub Copilot Workspace** | Issue-driven flow | Good for incremental phases. |

Whichever you pick, **always give it access to BOTH folders**: the web source (`src/`) and the docs (`mobile-implementation/`).

---

## 2. The golden rule

> **Never ask the AI to "build the whole app".** Always ask for ONE screen or ONE phase at a time. Verify it works on your phone before moving on.

---

## 3. First prompt — set up the project

Paste this exactly:

```
You are building a React Native (Expo) port of an existing web app called StudentOS.

CONTEXT:
- The web app source is in `/src` (do not modify it).
- The complete porting plan lives in `/mobile-implementation/` — READ IT FIRST, especially:
  - ROADMAP.md (master checklist)
  - README.md
  - 00-foundation/01-stack-decisions.md
  - 00-foundation/02-project-init.md

TASK FOR THIS SESSION ONLY:
Execute Phase 0 of the ROADMAP. That means:
1. Create a new folder `/mobile/` at repo root
2. Initialize an Expo SDK 52 project with TypeScript
3. Install all packages listed in `_APPENDIX/B-package-equivalents.md` under "RN-only essentials"
4. Configure Nativewind v4 per `01-design-system/03-nativewind-setup.md`
5. Configure Reanimated babel plugin
6. Verify `npx expo start` boots without errors

STOP after Phase 0. Do not start any screens yet. Report back what you did and what's in `/mobile/`.
```

---

## 4. Phase-by-phase prompts

Follow `ROADMAP.md` in order. For EACH phase use this template:

```
Continue the StudentOS mobile port. You already completed Phase {N-1}.

TASK: Execute Phase {N} of `/mobile-implementation/ROADMAP.md`.

Required reading before you start:
- ROADMAP.md (find Phase {N})
- {list the specific files in mobile-implementation/ that Phase N references}

Web source files to mirror (READ-ONLY reference):
- {list relevant /src files}

Constraints:
- Do not modify /src (web app)
- Do not skip the acceptance checklist at the bottom of each doc
- Use semantic theme tokens (no hardcoded colors)
- Match the web app's behavior exactly; do not invent new features
- For every screen, copy data hooks VERBATIM from the web page first, then port the UI

When done, report:
1. Files created
2. Acceptance checklist results (each item: ✅ or ⚠️ with reason)
3. Anything that needs my decision
```

---

## 5. Per-screen prompts

When you reach the screens phase (Phase 4), do ONE screen at a time:

```
Port the Dashboard screen.

READ FIRST:
- `/mobile-implementation/04-screens/03-Dashboard.md` (your spec — follow it exactly)
- `/src/pages/Dashboard.tsx` (web source — copy hooks from here)
- `/src/components/dashboard/*` (widgets to port)
- `/mobile-implementation/05-shared-components/02-AppLayout-and-BottomNav.md`

Follow the 11-step implementation order at the bottom of the spec.
Stop after the acceptance checklist is satisfied.
Show me a screenshot from the simulator before declaring done.
```

Repeat for every screen in `04-screens/`.

---

## 6. Native module prompts (the tricky parts)

For Focus Mode / push notifications / app blocking — these need rebuilds. Use:

```
Implement the Android app blocker as an Expo Config Plugin.

READ FIRST:
- `/mobile-implementation/06-native-features/01-app-blocking-android.md`
- `/android/app/src/main/java/com/studentoss/app/` (existing Java sources — REUSE them, don't rewrite)

Steps:
1. Create `/mobile/src/plugins/focus-mode-plugin/`
2. Copy the Java sources from the web project's android folder
3. Write the plugin's index.ts following the spec
4. Add to app.config.ts plugins array
5. Run `npx expo prebuild --clean` then `eas build --profile development --platform android`
6. Test on a physical Android device

Stop and ask me before running EAS build (it costs credits and takes ~20min).
```

---

## 7. Verifying the AI's work

After every session, run these checks yourself:

- [ ] **Does it run?** `cd mobile && npx expo start` → scan QR with Expo Go (or dev client)
- [ ] **Does it match the web?** Open the same screen on web and mobile side-by-side
- [ ] **Did it follow the acceptance checklist?** Check the bottom of the relevant doc
- [ ] **No hardcoded colors?** Grep: `grep -r "color: '#" mobile/src` should return nothing
- [ ] **No TypeScript errors?** `cd mobile && npx tsc --noEmit`

If any fail, paste the error back to the AI with:

> "This is broken. Read the relevant doc again and fix it. Don't change unrelated files."

---

## 8. Common pitfalls (paste these as rules)

Add to every prompt:

```
RULES:
- Never use `className=""` with custom hex colors; use semantic tokens from tailwind.config.js
- Never use `<div>`, `<span>`, `<button>` — only RN components
- Never import from `react-router-dom`, `framer-motion`, `next-themes` — use the RN equivalents from Appendix B
- Never edit `/src/integrations/supabase/client.ts` (it's auto-generated on web; mobile has its own at `/mobile/src/lib/supabase.ts`)
- When in doubt, READ the corresponding doc again before coding
```

---

## 9. When the AI gets stuck

| Symptom | Tell the AI |
|---|---|
| Loops on the same error 3+ times | "Stop. Read `/mobile-implementation/_APPENDIX/D-troubleshooting.md` and find the matching entry." |
| Invents UI not in web app | "The web app does NOT do this. Open `/src/pages/{X}.tsx` and match it exactly." |
| Skips animations | "Re-read section 5 of the screen spec. Implement every animation listed." |
| Skips acceptance checklist | "You did not complete the acceptance checklist at the bottom. Go through each item and report ✅ or ⚠️." |
| Native build fails | "Run `cd mobile/android && ./gradlew clean`, then `npx expo prebuild --clean`, then rebuild. If still failing, paste the full error and check Appendix D." |

---

## 10. Estimated timeline (with AI help)

| Phase | Time |
|---|---|
| Phase 0 (setup) | 1 day |
| Phase 1 (design system) | 1 day |
| Phase 2 (infra + auth) | 2 days |
| Phase 3 (navigation) | 1 day |
| Phase 4 (22 screens) | 2-3 weeks |
| Phase 5 (shared components) | 1 week |
| Phase 6 (native features) | 2 weeks (focus mode is the hardest) |
| Phase 7 (offline + data) | 1 week |
| Phase 8 (testing + release) | 1-2 weeks (App Store review unpredictable) |

**Total: ~6-8 weeks** of consistent AI-assisted work, assuming you test each phase yourself.

---

## 11. Money-saving tips

- Use Claude Code on flat-rate Claude Pro instead of pay-per-token APIs for long porting sessions
- Run EAS builds only at end of each phase, not after every change
- Use Expo Go (free) for non-native testing; only build a dev client when you add native modules
- Keep the keystore backed up (Google Drive + USB) — losing it = re-publishing app from scratch

---

## 12. Final advice

- **Commit after every screen.** Small commits = easy rollback when AI breaks something.
- **Test on your own phone every day.** Simulators lie about performance.
- **Don't ship without offline mode.** Your users are students in spotty network areas.
- **Get 5 students to beta test before Play Store launch.** Their bugs are worth more than your AI's confidence.

Good luck. The plan in this folder is complete — your job is to keep the AI on track.
