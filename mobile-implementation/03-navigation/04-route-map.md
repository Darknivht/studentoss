# 04 — Route Map

Web React Router → RN React Navigation lookup.

| Web path | RN screen | Notes |
|---|---|---|
| `/` | `Dashboard` (tab) | Default tab |
| `/auth` | `Auth` | Pre-auth stack |
| `/reset-password` | `ResetPassword` | Deep-link target |
| `/onboarding` | `Onboarding` | Auto-shown if `!profile.grade_level` |
| `/study` | `Study` (tab) | |
| `/notes` | `SmartNotes` | Push from Study |
| `/courses/:id` | `CoursePage` | Push, params: `{ courseId }` |
| `/tutor` | `AITutor` | Modal slide-up |
| `/flashcards` | `Flashcards` | Push |
| `/quizzes` | `Quizzes` | Push |
| `/exam-prep` | `ExamPrep` | Push, internal sub-stack for selector→subject→topic→session→review |
| `/focus` | `Focus` | Push |
| `/focus/session` | `FocusSession` | Modal full-screen |
| `/achievements` | `Achievements` | Push |
| `/plan` | `Plan` (tab) | |
| `/social` | `Social` (tab) | |
| `/chat/:id` | `Chat` | Push, params: `{ otherUserId }` |
| `/groups/:id` | `GroupChat` | Push, params: `{ groupId }` |
| `/store` | `Store` (tab) | |
| `/career` | `Career` (tab) | |
| `/profile` | `Profile` | Push |
| `/upgrade` | `Upgrade` | Modal |
| `/safety` | `Safety` | Push |
| `/privacy` | `Privacy` | Push |
| `/terms` | `Terms` | Push |
| `/install` | (delete) | PWA install — not relevant to native |
| `/admin/resources` | (admin web only) | Don't ship in mobile |
| `/docs/*` | (internal) | Don't ship in mobile |

## Internal sub-stacks

Some screens have multi-step flows. Implement as nested `createNativeStackNavigator`:

- **ExamPrep**: `Selector` → `SubjectSelector` → `TopicSelector` → `PracticeSession` → `SessionReview`
- **ResumeBuilder** (in Career tab): `Templates` → `Editor` → `Preview` → `Export`
- **FocusMode**: `Setup` → `AppSelector` → `ActiveSession` (kioskish)

## Acceptance

- [ ] Every web route has an RN counterpart
- [ ] Deep links resolve correctly
