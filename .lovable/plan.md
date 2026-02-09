
# Tighten Subscription Gating, Set App Icon/Favicon, Fix Branding, and Fix Security Issues

## 1. Set App Icon and Favicon

Copy `user-uploads://StudentOS_App_Icon-2.png` to:
- `public/favicon.png` -- used as website favicon
- `public/pwa-192x192.png` -- PWA icon (192x192)
- `public/pwa-512x512.png` -- PWA icon (512x512)
- `public/studentos-icon.png` -- general use icon

**Files modified:**
- `index.html` -- Update favicon link to reference `/favicon.png` as type `image/png`
- `public/pwa-192x192.png` and `public/pwa-512x512.png` -- Replaced with new icon

For Capacitor Android app icon, the same image will be placed as:
- Android mipmap resources (all density folders) -- these are generated from the same source image

**Note:** Since Lovable cannot generate resized images programmatically, the uploaded image will be copied to the public directory and referenced. For the Android native icons, the user will need to use Android Studio's Image Asset tool after exporting the project to generate properly sized mipmaps from this source image.

---

## 2. Fix App Name to "StudentOS" Everywhere

Update all instances of `studentoss`, `studentOS`, `StudentOss`, `studentOs` to `StudentOS`:

| File | Current | Fix |
|---|---|---|
| `capacitor.config.ts` | `appName: "studentoss"` | `appName: "StudentOS"` |
| `android/app/src/main/res/values/strings.xml` | `studentoss` | `StudentOS` |
| `src/pages/Auth.tsx` | `"studentOS"` | `"StudentOS"` |
| `src/pages/Upgrade.tsx` | `"studentOS Plans"` | `"StudentOS Plans"` |
| `src/components/layout/AppLayout.tsx` | `"studentOS"` (2 places) | `"StudentOS"` |
| `src/components/focus/PermissionsSetup.tsx` | `"StudentOss"` | `"StudentOS"` |
| `index.html` | Already correct (`StudentOS`) | No change needed |

---

## 3. Tighten Subscription Gating

### A. Job/Internship Search: 2 per month for free users

**File: `src/hooks/useSubscription.ts`**
- Change `jobSearchesLimit` in `FREE_LIMITS` from `3` (daily) to `2` (monthly)
- Add monthly tracking: query `profiles` for `job_searches_this_month` and `job_searches_reset_month`
- Add `canSearchJobs` and `jobSearchesThisMonth` to the subscription state
- Add `gateFeature` support for `'jobSearch'` type

**Database migration:**
- Add `job_searches_this_month` (integer, default 0) and `job_searches_reset_month` (text, default current month) columns to `profiles`

**File: `src/components/career/JobSearch.tsx`**
- Import `useSubscription` and `FeatureGateDialog`
- Gate the "Search Jobs" button click -- check `canSearchJobs` before executing
- Show `FeatureGateDialog` popup when limit reached
- Call `incrementUsage('jobSearch')` on successful search

### B. Clearer Gating Showcases

**File: `src/components/subscription/FeatureGateDialog.tsx`**
- Add a feature breakdown section showing what each tier unlocks
- Show tier comparison (Free vs Plus vs Pro) inline in the dialog
- Add animated lock icon and clearer copy
- Show "X of Y used" with a progress ring instead of just a bar

### C. Gate AI Tool Action Buttons

Ensure every AI tool component gates the action button (not page entry). For each of these files, wrap the main action button with a subscription check and show `FeatureGateDialog` on click when blocked:

- `src/components/ai-tools/MathSolver.tsx`
- `src/components/ai-tools/CodeDebugger.tsx`
- `src/components/ai-tools/OCRToLatex.tsx`
- `src/components/ai-tools/DiagramInterpreter.tsx`
- `src/components/ai-tools/BookScanner.tsx`
- `src/components/ai-tools/LanguageTranslator.tsx`
- `src/components/ai-tools/YouTubeSummarizer.tsx`

Each will:
1. Import `useSubscription` and `FeatureGateDialog`
2. Call `gateFeature('ai')` before executing the AI action
3. Show the dialog popup if not allowed
4. Call `incrementUsage('ai')` on success

### D. Remove page-level UpgradePrompt blocks

In `AITutor.tsx`, `Quizzes.tsx`, `SmartNotes.tsx`, `Flashcards.tsx` -- remove any page-entry blocking with `UpgradePrompt`. Instead, only gate the specific action buttons (Generate Quiz, Save Note, etc.).

---

## 4. Fix Security Issues (6 findings)

### A. Profiles table publicly readable (CRITICAL)
**Current:** `USING condition: true` on SELECT -- anyone can read all profiles including `parent_email`, `parental_pin`, `school_name`, etc.

**Fix (Database migration):**
- Drop the current overly permissive `"Users can view profiles for social"` SELECT policy
- Create two new policies:
  1. `"Users can view own full profile"` -- `auth.uid() = user_id` (full access to own profile)
  2. `"Users can view limited profiles for social"` -- Create a database VIEW `public_profiles` that exposes only `user_id`, `display_name`, `username`, `avatar_url`, `total_xp`, `current_streak` (no sensitive fields). OR restrict SELECT to authenticated users and rely on frontend to only display safe fields. Best approach: Replace the `true` policy with `auth.uid() IS NOT NULL` so only authenticated users can see profiles, and ensure the frontend never displays sensitive fields of other users.

### B. Weekly XP leaderboard exposes user_id (WARNING)
**Fix:** This is acceptable for a leaderboard feature. The user_id correlation risk is mitigated if profiles are locked down (fix A above). Mark as acceptable with auth-only access.

**Migration:** Update weekly_xp SELECT policy from `true` to `auth.uid() IS NOT NULL` (authenticated users only).

### C. Study group members visible to all (CRITICAL)
**Current:** `USING condition: true` on study_group_members SELECT.

**Fix (Migration):** Drop the `"Members can view group members"` policy and replace with:
`"Group members can view fellow members"` -- USING condition: `EXISTS (SELECT 1 FROM study_group_members sgm WHERE sgm.group_id = study_group_members.group_id AND sgm.user_id = auth.uid())`

### D. Achievements publicly readable (WARNING)
Achievement definitions (names, XP rewards) are static reference data. This is acceptable -- authenticated-only access is sufficient.

**Migration:** Update achievements SELECT policy from `true` to `auth.uid() IS NOT NULL`.

### E. Study group invitation codes exposed (WARNING)
**Fix:** Restrict `invitation_code` visibility. Since we can't restrict columns with RLS, update the frontend to not expose invitation codes to non-members. The current `is_public = true` policy is fine for listing groups, but the invitation_code should only be fetched by group members.

### F. Leaked password protection disabled (WARNING)
**Fix:** Enable leaked password protection via auth configuration.

---

## Summary of All Changes

### New Database Migration
- Add `job_searches_this_month` and `job_searches_reset_month` to profiles
- Fix 4 RLS policies (profiles, weekly_xp, study_group_members, achievements)

### Files Copied
- `user-uploads://StudentOS_App_Icon-2.png` to `public/favicon.png` and `public/pwa-192x192.png`

### Files Modified (~15 files)
- `index.html` -- Favicon reference update
- `capacitor.config.ts` -- appName to "StudentOS"
- `android/app/src/main/res/values/strings.xml` -- app_name to "StudentOS"
- `src/hooks/useSubscription.ts` -- Monthly job search limits, jobSearch gate type
- `src/components/subscription/FeatureGateDialog.tsx` -- Enhanced UI with tier comparison
- `src/components/career/JobSearch.tsx` -- Gate search button with monthly limit
- `src/pages/Auth.tsx` -- "StudentOS" branding
- `src/pages/Upgrade.tsx` -- "StudentOS" branding
- `src/components/layout/AppLayout.tsx` -- "StudentOS" branding
- `src/components/focus/PermissionsSetup.tsx` -- "StudentOS" branding
- `src/components/ai-tools/MathSolver.tsx` -- Gate action button
- `src/components/ai-tools/CodeDebugger.tsx` -- Gate action button
- `src/components/ai-tools/OCRToLatex.tsx` -- Gate action button
- `src/components/ai-tools/DiagramInterpreter.tsx` -- Gate action button
- `src/components/ai-tools/BookScanner.tsx` -- Gate action button
- `src/components/ai-tools/LanguageTranslator.tsx` -- Gate action button
- `src/components/ai-tools/YouTubeSummarizer.tsx` -- Gate action button
