# @Mention syntax

## Basic
| Mention | Expands to |
|---|---|
| `@path/to/file.tsx` | Read that single file |
| `@path/to/dir/` | Read all files in that dir (non-recursive) |
| `@path/to/dir/**` | Recursive |
| `@line:path/to/file.tsx:120-180` | Read only lines 120-180 |

## Shortcuts
| Shortcut | Expands to |
|---|---|
| `@screen:Dashboard` | `@mobile-implementation/09-connections/03-Dashboard-connections.md` + `@mobile-implementation/04-screens/03-Dashboard.md` + `@src/pages/Dashboard.tsx` |
| `@web:Dashboard` | `@src/pages/Dashboard.tsx` + related `@src/components/dashboard/**` |
| `@mobile:Dashboard` | `@mobile/src/screens/DashboardScreen.tsx` |
| `@copy:hooks` | All hooks listed in `10-shared-logic/README.md` |
| `@design` | `@mobile-implementation/01-design-system/**` + `@mobile/tailwind.config.js` + `@mobile/global.css` |
| `@nav` | `@mobile/src/navigation/**` |
| `@supabase` | `@mobile/src/integrations/supabase/client.ts` |

## Rules I follow
- If a mention resolves to >20 files, I ask you to narrow it.
- If a mention path doesn't exist, I stop and tell you before building anything.
- I never read files not mentioned or discovered via the connections file's own import map.

## Screen shortcut → number map
01 Auth · 01b ResetPassword · 02 Onboarding · 02b Index · 03 Dashboard · 04 Study · 05 SmartNotes · 06 CoursePage · 07 AITutor · 08 Flashcards · 09 Quizzes · 10 ExamPrep · 11 Plan · 12 Social · 13 Chat · 13b GroupChat · 14 Store · 15 Career · 16 Focus · 16b FocusSession · 17 Safety · 18 Profile · 19 Achievements · 20 Upgrade · 21 Settings · 22a Privacy · 22b Terms · 22c NotFound · 23 AdminResources
