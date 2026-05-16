# Appendix A — Component Map (Web → Mobile)

Complete mapping of every web `src/components/**` and `src/pages/**` to its mobile counterpart.

## Pages

| Web `src/pages` | Mobile `src/screens` | Notes |
|---|---|---|
| Auth.tsx | AuthScreen.tsx | + biometric prompt |
| Onboarding.tsx | OnboardingScreen.tsx | swipe gestures, confetti |
| Dashboard.tsx | DashboardScreen.tsx | pull-to-refresh, app icon badge |
| Study.tsx | StudyScreen.tsx | tool grid + search |
| SmartNotes.tsx | SmartNotesScreen.tsx | + camera scan |
| CoursePage.tsx | CoursePageScreen.tsx | top tabs, shared element |
| AITutor.tsx | AITutorScreen.tsx | voice mode, TTS |
| Flashcards.tsx | FlashcardsScreen.tsx | swipe gestures |
| Quizzes.tsx | QuizzesScreen.tsx | wake lock |
| ExamPrep.tsx | ExamPrepScreen.tsx | CBT + foreground service |
| Plan.tsx | PlanScreen.tsx | background audio |
| Social.tsx | SocialScreen.tsx | contacts import |
| Chat.tsx | ChatScreen.tsx | push notifs, lightbox |
| GroupChat.tsx | GroupChatScreen.tsx | same + group features |
| Store.tsx | StoreScreen.tsx | background downloads |
| Career.tsx | CareerScreen.tsx | native PDF export |
| Focus.tsx | FocusScreen.tsx | native blocker bridge |
| FocusSession.tsx | FocusSessionScreen.tsx | foreground service notif |
| Safety.tsx | SafetyScreen.tsx | parent link flow |
| Profile.tsx | ProfileScreen.tsx | avatar picker |
| Achievements.tsx | AchievementsScreen.tsx | unlock toast w/ Lottie |
| Upgrade.tsx | UpgradeScreen.tsx | Paystack WebView / iOS IAP |
| Index.tsx | IndexScreen.tsx (splash) | expo-splash-screen |
| ResetPassword.tsx | ResetPasswordScreen.tsx | deep link entry |
| Privacy.tsx | PrivacyScreen.tsx | markdown render |
| Terms.tsx | TermsScreen.tsx | markdown render |
| NotFound.tsx | NotFoundScreen.tsx | navigation reset |
| Install.tsx | — | DELETE (PWA only) |
| AdminResources.tsx | AdminResourcesScreen.tsx | admin-only, lazy load |
| docs/* | — | DELETE (web-only internal portal) |

## Component folders

| Web `src/components` | Mobile target | Approach |
|---|---|---|
| academic/* | screens/academic/* | full RN rewrite |
| ads/* | components/ads/* | `react-native-google-mobile-ads` |
| ai-tools/* | screens/ai-tools/* | full RN |
| career/* | screens/career/* + components | resume builder is biggest port |
| chat/* | components/chat/* | bubble, media, reply |
| dashboard/* | components/dashboard/* | widgets + cards |
| documents/* | components/documents/* | native viewers |
| exam-prep/* | components/exam-prep/* | many — port each |
| export/* | components/export/* | expo-print + expo-sharing |
| flashcards/* | components/flashcards/* | swipe deck |
| focus/* | components/focus/* + native module | bridge layer |
| gamification/* | components/gamification/* | Lottie animations |
| layout/* | components/layout/* | SafeAreaView wrappers |
| notes/* | components/notes/* | viewer + AI summary |
| planning/* | components/planning/* | calendar, lofi, pomodoro |
| profile/* | components/profile/* | avatar w/ crop |
| pwa/* | — | DELETE |
| quiz/* | components/quiz/* | history list |
| safety/* | components/safety/* | parental + offline mode |
| settings/* | components/settings/* | list rows |
| social/* | components/social/* | friends, groups, leaderboard |
| store/* | components/store/* | resource cards |
| study/* | components/study/* | many tools |
| subscription/* | components/subscription/* | FeatureGate + UpgradePrompt |
| ui/* | components/ui/* | shadcn → RN primitives |

