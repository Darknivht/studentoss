# StudentOS — The Complete Operating System for Students

> **Tagline:** *"Your brain, supercharged. Your time, protected. Your future, accelerated."*

**Version:** 1.0 (Exhibition Edition)
**Platform:** Progressive Web App (PWA) + Native Android (Capacitor)
**Target Markets:** Nigerian secondary & tertiary students (WAEC, NECO, JAMB) + International (IELTS, TOEFL, SAT, GRE)
**Pricing:** Free tier + Plus (₦2,000/mo) + Pro (₦5,000/mo)
**Live URL:** https://studentoss.lovable.app

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The Problem We Solve](#2-the-problem-we-solve)
3. [Product Vision](#3-product-vision)
4. [Technology Stack](#4-technology-stack)
5. [Onboarding Experience](#5-onboarding-experience)
6. [Authentication System](#6-authentication-system)
7. [Dashboard — The Home Hub](#7-dashboard--the-home-hub)
8. [Smart Notes](#8-smart-notes)
9. [AI Tutor](#9-ai-tutor)
10. [Flashcards](#10-flashcards)
11. [Quizzes](#11-quizzes)
12. [ExamPrep — CBT Mastery Engine](#12-examprep--cbt-mastery-engine)
13. [Study Suite](#13-study-suite)
14. [AI Tools Lab](#14-ai-tools-lab)
15. [Academic Tools](#15-academic-tools)
16. [Career Module](#16-career-module)
17. [Plan & Focus Module](#17-plan--focus-module)
18. [Focus Mode & App Blocker](#18-focus-mode--app-blocker)
19. [Social Hub](#19-social-hub)
20. [Chat System (DMs & Groups)](#20-chat-system-dms--groups)
21. [Store — Educational Resources](#21-store--educational-resources)
22. [Gamification System](#22-gamification-system)
23. [Achievements](#23-achievements)
24. [Safety & Parental Controls](#24-safety--parental-controls)
25. [Subscription & Payments](#25-subscription--payments)
26. [Profile & Settings](#26-profile--settings)
27. [Offline Mode & PWA](#27-offline-mode--pwa)
28. [PDF Export System](#28-pdf-export-system)
29. [Admin Panel](#29-admin-panel)
30. [Internal Documentation Portal](#30-internal-documentation-portal)
31. [Database Architecture](#31-database-architecture)
32. [Edge Functions (Backend)](#32-edge-functions-backend)
33. [Security Model](#33-security-model)
34. [Design System](#34-design-system)
35. [Roadmap](#35-roadmap)
36. [Glossary](#36-glossary)

---

## 1. Executive Summary

**StudentOS** is a comprehensive AI-powered learning operating system built for the modern student. Unlike single-purpose apps (note-takers, flashcard apps, exam prep apps), StudentOS unifies **30+ tools** into one cohesive experience covering every dimension of student life: studying, exam preparation, focus, productivity, social learning, career development, and parental safety.

The platform is engineered to address the unique needs of African students — particularly Nigerian secondary and tertiary learners — while remaining globally applicable through its support for international standardized tests (IELTS, TOEFL, SAT, GRE). It runs equally well on low-end Android devices, mid-range smartphones, and desktops, with full offline capability for areas with intermittent connectivity.

At its core, StudentOS combines:

- **Generative AI** (Gemini 2.5 + GPT-5 via Lovable AI Gateway) for tutoring, summarization, quiz generation, essay grading, and more.
- **Spaced repetition** (SM-2 algorithm) for long-term retention.
- **Computer-Based Testing (CBT)** simulators for WAEC, NECO, JAMB, and international exams.
- **Native Android focus enforcement** via a custom Capacitor plugin that locks distracting apps.
- **Real-time social features** including study groups, DMs, friend challenges, and a leaderboard.
- **Gamification** through XP, streaks, achievements, and daily challenges.
- **Parental controls** with PIN-protected settings, content filtering, and time limits.

The app is monetized through a freemium subscription model (Free / Plus / Pro) with Paystack integration for the Nigerian market, plus Google Ads on the free tier. A separate **per-exam subscription** model exists for ExamPrep premium content.

---

## 2. The Problem We Solve

### 2.1 The Fragmentation Problem
A typical student today juggles: Google Docs for notes, Anki for flashcards, YouTube for tutorials, ChatGPT for explanations, Quizlet for quizzes, Forest for focus, WhatsApp for study groups, LinkedIn for career, Khan Academy for video lessons, and a separate exam-prep app. **Ten apps. Ten subscriptions. Zero integration.**

StudentOS replaces all of them with a single integrated platform where notes feed into flashcards, flashcards feed into quizzes, quizzes feed into exam analytics, and exam analytics feed back into a personalized study plan.

### 2.2 The Distraction Problem
Students lose an average of **3 hours/day** to TikTok, Instagram, and YouTube during study time. StudentOS includes a **native Android app blocker** that physically prevents access to selected apps during focus sessions.

### 2.3 The Affordability Problem
A WAEC past-questions app costs ₦5,000. A JAMB CBT simulator costs ₦8,000. Anki Pro costs $25. A ChatGPT Plus subscription costs ₦30,000/month. A Nigerian student cannot afford this stack.

StudentOS Pro costs **₦5,000/month** and includes everything.

### 2.4 The Trust Problem
Parents don't know what their kids are doing on study apps. StudentOS includes a **parent dashboard** showing study time, activities, and progress — protected by a PIN.

---

## 3. Product Vision

> **By 2030, every Nigerian student should have an AI tutor in their pocket that's smarter, kinder, and more available than any human teacher — and costs less than a daily soda.**

We're building the **infrastructure layer** for African education: the operating system upon which schools, tutors, parents, and students collaborate.

---

## 4. Technology Stack

### Frontend
- **React 18** + **TypeScript 5** — type-safe UI framework
- **Vite 5** — lightning-fast build tool
- **Tailwind CSS v3** — utility-first styling with a custom semantic design system
- **shadcn/ui** — Radix-based accessible component library (Button, Dialog, Sheet, Tabs, etc.)
- **Framer Motion** — physics-based animations for onboarding and transitions
- **React Router v6** — client-side routing
- **TanStack Query** — server-state caching, refetching, and background sync
- **Lucide React** — icon library
- **Recharts** — analytics visualizations (line charts, pie charts, radar charts, bar charts)
- **KaTeX** + **react-markdown** + **remark-math** + **rehype-katex** — math equation rendering
- **html2canvas** + **jsPDF** — high-quality PDF export
- **date-fns** — date formatting and manipulation

### Backend
- **Lovable Cloud** (powered by Supabase) — managed backend-as-a-service
- **PostgreSQL** — primary database with Row-Level Security (RLS)
- **Supabase Auth** — email/password authentication with session management
- **Supabase Storage** — file uploads (notes, avatars, chat media, store resources)
- **Supabase Edge Functions** (Deno) — serverless TypeScript functions
- **Supabase Realtime** — WebSocket subscriptions for chat and live updates

### AI
- **Lovable AI Gateway** — unified API for multiple AI providers
- **Google Gemini 2.5 Pro / Flash / Flash-Lite** — primary models for text generation
- **OpenAI GPT-5 / GPT-5-mini / GPT-5-nano** — secondary models for nuanced reasoning
- **Streaming responses** via Server-Sent Events (SSE) for real-time AI output

### Mobile
- **Capacitor 6** — wraps the PWA as a native Android app
- **Custom Java plugin** (`FocusModePlugin.java`) — implements the system-level app blocker via AccessibilityService
- **Android BootReceiver** — restores blocking state after device restart

### Payments
- **Paystack** — Nigerian payment gateway supporting cards, bank transfers, and USSD
- **Verify-payment edge function** — server-side payment verification

### PWA Features
- **Service Worker** — offline caching, background sync, push notification support
- **Web App Manifest** — installable on iOS/Android home screen
- **IndexedDB** (`offlineSync.ts`) — local-first data storage for offline mode

---

## 5. Onboarding Experience

### Location: `src/pages/Onboarding.tsx`

When a new user opens the app for the first time, they enter a cinematic **7-step onboarding flow** designed to communicate the platform's value before asking for a single login credential.

Each step features:
- A **unique gradient background** specific to that screen's theme
- **Floating particle animations** giving a sense of depth and motion
- **Spring-physics transitions** between steps using Framer Motion
- A bold **emoji-based icon** representing the concept
- A **headline + subheadline** explaining the feature
- **Progress dots** at the bottom showing position (1/7, 2/7, etc.)
- **Skip button** in the top-right for returning users

### The 7 Steps

1. **Welcome** — "Meet StudentOS, your study OS." Sets the tone with a hero animation.
2. **AI Learning** — "An AI tutor that knows your coursework." Demonstrates that the AI adapts to the student's syllabus, not the other way around.
3. **Spaced Repetition** — "Remember everything you learn." Introduces the SM-2 flashcard system.
4. **Focus Tools** — "Block distractions instantly." Showcases the Pomodoro timer and Android app blocker.
5. **Growth Tracking** — "Watch yourself get smarter." Displays mock streak calendar, XP, and progress bars.
6. **Social Features** — "Study with friends, beat the leaderboard." Highlights group chats, friend challenges, and rankings.
7. **Ready to Begin** — Final CTA to sign up, with a "Get Started" button leading to `/auth`.

### Persistence Logic
After the user completes (or skips) onboarding, a flag `onboarding_seen` is written to `localStorage`. Returning unauthenticated visitors bypass onboarding entirely and land directly on the auth screen, ensuring a frictionless return experience.

---

## 6. Authentication System

### Location: `src/pages/Auth.tsx` + `src/hooks/useAuth.tsx`

### Sign-Up Flow
1. User enters email + password (minimum 6 characters)
2. Optional: full name, school name, grade level
3. Account is created via Supabase Auth `signUp` method
4. A **profile row** is automatically inserted into the `profiles` table via a database trigger, with default values: `subscription_tier = 'free'`, `total_xp = 0`, `current_streak = 0`
5. User is signed in immediately (auto-confirm enabled by default for friction-free demo)

### Sign-In Flow
1. Email + password validation
2. Supabase returns a JWT token + refresh token stored in `localStorage`
3. The `useAuth` hook restores the session on app reload via `supabase.auth.getSession()`
4. A blocked-user check runs: if the `profiles.is_blocked` flag is `true`, the user is immediately signed out

### Password Reset
Available at `/reset-password`. Sends a magic-link email via Supabase. Clicking the link opens a form to set a new password.

### Session Management
- Tokens auto-refresh every hour
- The `onAuthStateChange` subscription updates the React context in real-time
- Sign-out clears localStorage and redirects to `/auth`

### Protected Routes
The `AppLayout` component wraps every authenticated page. If `user` is null after the auth check completes, it redirects to `/auth` via React Router's `<Navigate>`.

---

## 7. Dashboard — The Home Hub

### Location: `src/pages/Dashboard.tsx`

The Dashboard is the first screen authenticated users see. It's designed to surface the **three things that matter most to a student daily**: their streak, their next study task, and quick access to their courses.

### Header Section
- **Greeting** — Time-aware ("Good morning, [Name]" / "Good afternoon" / "Good evening")
- **Display name** — Pulled from `profiles.display_name` or falls back to email username
- **Offline status indicator** — Yellow banner if the device is offline, with cached-data notice

### Streak Card (`StreakCard.tsx`)
- Shows the **current streak** (consecutive days with study activity) with a flame icon 🔥
- Shows the **longest streak** as a personal record
- Animated flame grows brighter as streak increases
- Tapping reveals a calendar of recent activity

### Daily Quiz Challenge (`DailyQuizChallenge.tsx`)
- A **5-question challenge** generated daily from the user's notes (or general knowledge for Free tier)
- Awards **10 XP per correct answer** (max 50 XP/day)
- Tracked via `localStorage` to prevent multiple attempts per day
- Updates streak on completion
- Real-time refresh: dashboard re-fetches every 30 seconds AND on a custom `daily-challenge-completed` event

### Study Time Widget (`StudyTimeWidget.tsx`)
- Today's total study minutes from `study_sessions` and `pomodoro_sessions` tables
- Visual progress bar toward the daily target (default 60 minutes, configurable)
- Weekly trend mini-chart

### Study Progress Widget (`StudyProgressWidget.tsx`)
- Aggregate stats: notes created this week, quizzes completed, flashcards reviewed, focus minutes
- Pulls from `weekly_xp` table

### Announcement Banner (`AnnouncementBanner.tsx`)
- Pulls active announcements from the `announcements` table (RLS-filtered to non-expired)
- Three types: `info` (blue), `warning` (yellow), `success` (green)
- Used by admins to broadcast app updates, maintenance notices, and feature launches

### Ad Banner (Free tier only)
- Google AdSense banner displayed mid-page for free users
- Hidden completely for Plus and Pro subscribers

### Exam Prep Quick Link
- Prominent button linking to `/exam-prep` for one-tap access to CBT practice

### Courses Grid
- A grid of `CourseCard` components showing each user-created course
- Each card displays: course name, color accent, custom emoji icon, progress percentage (0–100%)
- Progress is calculated as a weighted average: **Notes (30%) + Quizzes (30%) + Flashcards (40%)**
- Tapping a course opens `/course/:id` showing all related notes, flashcards, quizzes, and chat history

### Add Course Dialog (`AddCourseDialog.tsx`)
- Modal form: course name, color picker (8 preset colors), emoji icon picker (50+ emojis)
- Inserts into the `courses` table with `user_id = auth.uid()`

---

## 8. Smart Notes

### Location: `src/pages/SmartNotes.tsx` + `src/components/notes/`

The Smart Notes module is the **content ingestion layer** of StudentOS. Every other AI feature (flashcards, quizzes, AI tutor) can pull context from notes.

### Three Input Methods

#### 8.1 Type Notes Directly
- Rich text editor with markdown support
- Auto-save every 3 seconds
- Title + body + optional course assignment

#### 8.2 Upload Files (`FileUpload.tsx`)
- **Supported formats:** PDF, DOCX, TXT, images (PNG, JPG)
- Files are uploaded to Supabase Storage in the `notes` bucket
- **PDF text extraction** via the `extract-pdf-text` edge function (uses `unpdf` library)
- **Scanned PDF / image OCR** via the `extract-pdf-text-ocr` edge function (uses Tesseract.js or vision AI)
- Extracted text is stored in `notes.content` and the original file URL in `notes.file_url`

#### 8.3 Live Lecture Recording
- See [AI Tools → Lecture Recorder](#14-ai-tools-lab)

### Note Card (`NoteCard.tsx`)
Each note displays:
- Title
- Truncated preview (first 150 chars of content)
- Source type badge (text / pdf / docx / lecture / image)
- Course tag (if assigned)
- Created date
- Quick actions: View, Generate Summary, Generate Flashcards, Generate Quiz, Delete

### Note Viewer Dialog (`NoteViewerDialog.tsx`)
Full-screen modal showing:
- Original file preview (PDF/DOCX) via `DocumentViewer.tsx`
- Extracted text in a scrollable panel
- AI Summary section (auto-generated on demand)
- "Ask AI Tutor about this note" button → opens AI Tutor pre-populated with note context

### AI Summary Dialog (`AISummaryDialog.tsx`)
- Calls the `ai-study` edge function with `mode: 'summarize'`
- Streams the summary back word-by-word for instant feedback
- Three summary lengths: short (paragraph), medium (5 bullets), long (full breakdown)
- Saves the summary to `notes.summary` for future reuse

### Socratic Tutor Mode (`SocraticTutor.tsx`)
- Instead of explaining, the AI asks **leading questions** to help the student discover the answer themselves
- Used by Pro-tier students for deep learning of difficult concepts
- Persists conversation history in `chat_messages` linked to the note

### Quotas
| Tier | Notes/day |
|------|-----------|
| Free | 3 |
| Plus | 10 |
| Pro | Unlimited |

---

## 9. AI Tutor

### Location: `src/pages/AITutor.tsx`

The AI Tutor is a **chat-based conversational interface** to ask questions, get explanations, debug problems, and engage in Socratic dialogue.

### Persona Selection
The user can pick one of four teaching personas, each with a distinct system prompt:

1. **🧘 Chill Tutor** — Warm, patient, uses analogies and emojis. Default.
2. **📏 Strict Tutor** — Formal, demands precision, doesn't accept "I don't know".
3. **🎉 Fun Tutor** — Tells jokes, uses pop culture references, makes learning playful.
4. **💪 Motivator** — Pushes the student, celebrates wins, frames every concept as a step toward greatness.

The selected persona is stored in `profiles.study_persona` and persists across sessions.

### Course-Aware Context
When the AI Tutor is opened from inside a course page, the tutor receives **the entire course's notes** as system context. The student can ask "Explain photosynthesis in simpler terms" and the tutor knows what photosynthesis content the user has actually studied.

### Streaming Responses
Responses stream in real-time via SSE from the `ai-study` edge function. The user sees text appear word-by-word, like ChatGPT, with no spinner delays.

### Math Rendering
Any math written in LaTeX (`$E = mc^2$` or `$$\int_0^1 x^2 dx$$`) is rendered with KaTeX, including fractions, integrals, summations, and Greek letters.

### Conversation History
All messages are saved to the `chat_messages` table with `role` (`user` | `assistant`) and `course_id` foreign key. Users can clear history or scroll back to old conversations.

### Quotas
Each AI Tutor message counts as one AI call against the daily quota:
- Free: 5 calls/day
- Plus: 30 calls/day
- Pro: 100 calls/day

Quota resets at midnight UTC via the `ai_calls_reset_at` field comparison.

### Voice Mode (`VoiceMode.tsx`)
- Optional voice input via Web Speech API
- Optional text-to-speech output
- Hands-free study mode for revision while exercising or commuting

---

## 10. Flashcards

### Location: `src/pages/Flashcards.tsx` + `src/components/flashcards/`

Flashcards in StudentOS use the **SM-2 (SuperMemo 2) spaced-repetition algorithm**, the same algorithm Anki uses. This ensures cards re-appear at the optimal interval for long-term retention.

### Creating Flashcards

#### From Notes (AI-Generated)
- Open any note → "Generate Flashcards" → AI returns 10–20 flashcards in JSON format
- User reviews and approves before saving
- Uses the `ai-study` edge function with `mode: 'flashcards'`

#### Manually
- "Create Flashcard" button → modal with Front + Back text fields
- Optional course assignment

### Review Session
- Cards due for review (where `next_review <= NOW()`) are shown one at a time
- Front shown first; tap to flip to Back
- After flipping, user rates difficulty: **Again (1)** / **Hard (2)** / **Good (3)** / **Easy (4)**
- The SM-2 algorithm updates `ease_factor`, `interval_days`, `repetitions`, and `next_review`:
  - **Again:** repetitions = 0, interval = 1 day, ease decreases
  - **Hard:** interval × 1.2, ease decreases slightly
  - **Good:** interval × ease_factor (default 2.5)
  - **Easy:** interval × ease_factor × 1.3, ease increases

### Flashcards List (`FlashcardsList.tsx`)
- All user flashcards in a searchable, filterable list
- Filter by course, by due-today, by mastered (interval > 30 days)
- Edit/delete individual cards
- Bulk export

### Quotas
| Tier | Flashcards generated/day |
|------|--------------------------|
| Free | 3 |
| Plus | 20 |
| Pro | Unlimited |

Reviewing existing cards is **always unlimited**. Only AI generation counts against quota.

---

## 11. Quizzes

### Location: `src/pages/Quizzes.tsx`

Quizzes are AI-generated multiple-choice tests created from notes or course content.

### Quiz Generation
- Select a note or course
- Choose number of questions (5, 10, or 20)
- Choose difficulty (easy / medium / hard)
- AI generates quiz via `ai-study` edge function with `mode: 'quiz'`
- Returns JSON: `[{ question, options: [...], correct_index, explanation }]`

### Quiz Taking
- One question at a time with 4 multiple-choice options
- Timer optional (per-question or total)
- Submit answer → instant feedback (correct/incorrect + explanation)
- Final score screen with percentage, time taken, and review of missed questions

### Quiz History (`QuizHistory.tsx`)
- All past attempts stored in `quiz_attempts` table
- Sortable by date, score, course
- Tap to re-view individual attempts

### Friend Challenges (`ChallengeAFriend.tsx`)
- Send a quiz to a friend via the `peer_challenges` table
- Both users take the same quiz
- Winner gets bonus XP
- Challenges expire after 48 hours

### Quotas
| Tier | Quizzes/day |
|------|-------------|
| Free | 3 |
| Plus | 10 |
| Pro | Unlimited |

---

## 12. ExamPrep — CBT Mastery Engine

### Location: `src/pages/ExamPrep.tsx` + `src/components/exam-prep/`

ExamPrep is StudentOS's flagship premium feature — a **complete Computer-Based Test simulator** for Nigerian and international standardized exams. Access requires Plus or Pro tier (or per-exam subscription).

### Supported Exams

**Nigerian:**
- **WAEC** (West African Examinations Council) — SSCE, 4 options A–D
- **NECO** (National Examinations Council) — SSCE, 4 options A–D
- **JAMB** (Joint Admissions and Matriculation Board) — UTME, **5 options A–E**, 4-subject CBT (English mandatory + 3 electives), 120 minutes total

**International:**
- **IELTS** — Academic & General Training
- **TOEFL** — iBT format
- **SAT** — Math + Evidence-Based Reading & Writing
- **GRE** — Verbal + Quantitative + Analytical Writing

### Exam Selector Flow
1. **Exam Selector** (`ExamSelector.tsx`) — pick exam (WAEC, JAMB, etc.)
2. **Subject Selector** (`SubjectSelector.tsx`) — pick subject (Math, English, Biology, etc.)
3. **Mode Selector** — pick practice mode (see below)

### 8 Practice Modes

#### 12.1 Quick Practice (Untimed)
20 random questions from the question bank. No timer. Instant feedback.

#### 12.2 Quick Practice (Timed)
20 questions with a strict timer (typically 30 minutes). Simulates real exam pressure.

#### 12.3 Topic-Based Practice (`TopicSelector.tsx`)
Filter questions by specific topic (e.g., "Quadratic Equations" within Math). Useful for targeted weakness training.

#### 12.4 Year-Based Practice (`YearSelector.tsx`)
Practice past papers from specific years (e.g., "JAMB 2019 Mathematics"). Pulls from historical questions tagged with the `year` field.

#### 12.5 Study Material-Based Practice
Generates questions from admin-uploaded PDF past papers via the `extract-pdf-text` + `exam-practice` edge functions. AI parses the PDF and creates structured questions.

#### 12.6 Mock Exam Mode (`MockExamMode.tsx`)
Single-subject simulation matching the real exam's question count and time limit. Final score with percentile ranking.

#### 12.7 Multi-Subject Full CBT (`MultiSubjectCBT.tsx`)
**JAMB-specific:** 4 subjects × ~40 questions each, single 120-minute timer, navigate between subjects freely. Mirrors the real JAMB CBT experience exactly.

#### 12.8 Guided Learning (`GuidedLearning.tsx`)
AI generates a **lesson** on a topic, then **5 practice questions** to test understanding immediately. Combines teaching + assessment in one flow.

#### 12.9 Bookmarked Questions (`BookmarkedQuestions.tsx`)
Review questions the user has saved during practice. Useful for revisiting tricky problems.

### Practice Session UI (`PracticeSession.tsx`)
- Question display with KaTeX-rendered math
- Multiple-choice options (4 or 5 depending on exam)
- Timer (if applicable) in the header
- Bookmark button to save for later
- Report button to flag bad questions (saves to `question_reports` table)
- Skip / Previous / Next navigation
- "Submit Exam" button when finished

### Session Review (`SessionReview.tsx`)
After submission:
- Total score + percentage
- Time taken vs. allowed
- **Per-question review** with correct answer, user's answer, and AI-written explanation
- Option to add missed questions to a personal flashcard deck

### Exam Performance Analytics (`ExamPerformance.tsx`)
- **Radar chart** showing strength across subjects/topics
- **Difficulty breakdown** (easy/medium/hard accuracy)
- **Session history** timeline
- **Improvement trend** line chart over time
- All powered by aggregations on the `exam_attempts` table

### Weakness Report (`WeaknessReport.tsx`)
AI analyzes attempt history and identifies the **3 weakest topics**. Generates a personalized study plan recommending which topics to review and which guided lessons to take.

### Study Plan View (`StudyPlanView.tsx`)
AI-generated study schedule based on:
- Days until exam
- Current weakness profile
- Available study hours per day
- Subjects that need most work

### Question Bank
Questions are stored in `exam_questions` table with:
- `question` (text, supports LaTeX)
- `options` (JSONB array of strings)
- `correct_index` (0-based)
- `explanation` (AI-generated or admin-written)
- `difficulty` (easy/medium/hard)
- `topic_id`, `subject_id`, `exam_type_id` foreign keys
- `year` (for past papers)
- `source` (admin_added / ai_generated / pdf_extracted)
- `is_active` (admins can disable bad questions)

If the bank doesn't have enough questions for a session, the `exam-practice` edge function falls back to AI generation using the subject's `ai_prompt` configuration.

### Per-Exam Subscriptions
Beyond the global Plus/Pro tiers, students can buy a **single-exam subscription** for a specific exam type (e.g., JAMB-only access for one term). Stored in `exam_subscriptions` table.

---

## 13. Study Suite

### Location: `src/pages/Study.tsx` + `src/components/study/`

The Study page is a launcher for **specialized study tools** beyond the main Notes/Flashcards/Quizzes trio.

### 13.1 Cheat Sheet Creator (`CheatSheetCreator.tsx`)
- Paste topic or upload notes
- AI generates a **one-page cheat sheet** with key formulas, definitions, and diagrams in markdown
- Export as PDF (Fast or HD modes)
- Premium feature

### 13.2 Mnemonic Generator (`MnemonicGenerator.tsx`)
- Input: list of items to memorize (e.g., "planets in order")
- AI generates rhymes, acronyms, and memory palaces
- Example: "My Very Educated Mother Just Served Us Noodles" for Mercury, Venus, Earth...

### 13.3 Cram Mode (`CramMode.tsx`)
- Pick a topic and time available (e.g., "Cell Biology in 30 minutes")
- AI generates a rapid-fire study sequence: key concepts → flashcards → mini-quiz
- Optimized for last-minute exam prep

### 13.4 Mock Exam (`MockExam.tsx`)
- Quick mock exam generator (separate from the structured ExamPrep CBT)
- Customizable: number of questions, time limit, topic
- Useful for self-testing on user-uploaded notes

### 13.5 Concept Linking (`ConceptLinking.tsx`)
- AI generates a **knowledge graph** showing how concepts connect
- Useful for understanding the bigger picture (e.g., how mitochondria relates to ATP, glycolysis, and cellular respiration)

### 13.6 Fill in the Blanks (`FillBlanks.tsx`)
- AI converts notes into cloze-deletion exercises
- Active recall practice for definitions and key terms

### 13.7 Audio Notes (`AudioNotes.tsx`)
- Convert notes to spoken audio via Web Speech API or TTS
- Listen while walking, commuting, or exercising
- Speed control (0.5×, 1×, 1.5×, 2×)

### 13.8 Debate Partner (`DebatePartner.tsx`)
- AI takes the opposing position on any topic
- Trains critical thinking and argument structuring
- Used for essay prep and debate club practice

### 13.9 Pomodoro Timer (`PomodoroTimer.tsx`)
- Classic 25-minute focus / 5-minute break cycle
- Configurable durations (15/45, 50/10, custom)
- Logs each completed session to `pomodoro_sessions` table for streak/XP tracking
- Integrated with Focus Mode for app blocking

### 13.10 Study Statistics (`StudyStatistics.tsx`)
- Detailed analytics: total hours studied, average session length, best subject, peak hour of day
- Powered by aggregations on `study_sessions` and `pomodoro_sessions`

### 13.11 Streak Calendar (`StreakCalendar.tsx`)
- GitHub-style heatmap of daily study activity
- Color intensity scales with minutes studied
- Click a day to see what was studied

### 13.12 Voice Mode (`VoiceMode.tsx`)
- Hands-free Q&A with the AI Tutor
- Speech-to-text for input, text-to-speech for output

---

## 14. AI Tools Lab

### Location: `src/components/ai-tools/`

The **AI Tools Lab** is a collection of **specialized AI utilities** beyond the core tutor — each solving a specific student problem.

### 14.1 Math Solver (`MathSolver.tsx`)
- Type or photograph a math problem
- AI solves step-by-step with full working
- Renders all math via KaTeX
- Covers algebra, calculus, trigonometry, statistics, linear algebra
- Includes "Explain like I'm 5" mode

### 14.2 Code Debugger (`CodeDebugger.tsx`)
- Paste broken code (Python, JavaScript, Java, C++, etc.)
- AI identifies bugs, explains the fix, and provides corrected code
- Syntax-highlighted output
- Handles compile errors, logic errors, and style issues

### 14.3 Language Translator (`LanguageTranslator.tsx`)
- Translate between 50+ languages
- Includes Yoruba, Igbo, Hausa, Swahili, French, Spanish, Mandarin, etc.
- Educational mode: explains grammar and idioms, not just translation

### 14.4 YouTube Summarizer (`YouTubeSummarizer.tsx`)
- Paste a YouTube URL or transcript
- AI generates: summary, key takeaways, study questions, flashcard suggestions
- **Transcript prioritization:** if user pastes the transcript, accuracy is high; if only URL, the UI clearly notes the summary is inferred from title/description

### 14.5 Book Scanner / OCR (`BookScanner.tsx`)
- Take a photo of a textbook page
- OCR extracts text via the `extract-pdf-text-ocr` edge function
- Result can be saved as a note, summarized, or turned into flashcards

### 14.6 Diagram Interpreter (`DiagramInterpreter.tsx`)
- Upload a photo of a biology/physics/chemistry diagram
- AI describes what's shown and explains its significance
- Useful for understanding textbook diagrams without a teacher

### 14.7 OCR to LaTeX (`OCRToLatex.tsx`)
- Photograph handwritten or printed math equations
- AI converts to LaTeX code
- Output renders cleanly via KaTeX for use in essays and notes

### 14.8 Live Lecture Recorder (`LectureRecorder.tsx`)
- Records lecture audio via the device microphone
- Transcribes in real-time
- After class, AI generates: full transcript, summary, key points, flashcards
- Can be saved as a note for later review

### Common UI: AIToolLayout (`AIToolLayout.tsx`)
All AI tools share a consistent layout:
- Back button
- Title + description
- Input area (text/file/image upload)
- "Generate" button with loading state
- Output area with markdown rendering + math
- **Download Dropdown** with Fast PDF + HD PDF options
- Copy-to-clipboard button
- Save-as-note button

### Quotas
All AI tool calls count against the daily AI quota (5/30/100 for Free/Plus/Pro).

---

## 15. Academic Tools

### Location: `src/components/academic/`

A suite of **research and writing tools** for tertiary students working on essays, theses, and assignments.

### 15.1 Citation Machine (`CitationMachine.tsx`)
- Generate citations in APA, MLA, Chicago, Harvard, IEEE styles
- Input: book/article details (or URL for auto-fetch)
- Output: properly formatted citation
- Copy-to-clipboard

### 15.2 Bibliography Builder (`BibliographyBuilder.tsx`)
- Manage a list of sources for a paper
- Auto-formats the full bibliography in chosen style
- Export as PDF (Fast or HD)

### 15.3 Essay Grader (`EssayGrader.tsx`)
- Paste an essay
- AI grades on: thesis strength, argument structure, evidence, grammar, style
- Provides letter grade + detailed feedback per section
- Suggestions for improvement

### 15.4 Plagiarism Checker (`PlagiarismChecker.tsx`)
- AI-based plagiarism detection (compares phrasing patterns to common sources)
- Highlights potentially copied passages
- Note: not a replacement for Turnitin, but useful for self-checking before submission

### 15.5 Research Assistant (`ResearchAssistant.tsx`)
- Input: research topic or thesis question
- AI returns: outline, key arguments, suggested sources, related concepts
- Iterative refinement via follow-up questions

### 15.6 Thesis Generator (`ThesisGenerator.tsx`)
- Input: essay prompt
- AI generates 3–5 candidate thesis statements
- Each with strengths/weaknesses analysis
- Helps overcome writer's block

---

## 16. Career Module

### Location: `src/pages/Career.tsx` + `src/components/career/`

Career tools help students transition from learning to earning.

### 16.1 Resume Builder (`ResumeBuilder.tsx`)
The flagship career feature. A **professional resume builder** with 10 templates and live preview.

#### Templates
- **Free tier (3 templates):** Modern, Classic, Minimalist
- **Plus tier (7 templates):** + Tech, Academic, Creative, Executive
- **Pro tier (10 templates):** + Designer, Engineer, Consultant

#### Sections
- Contact Info (name, email, phone, location, LinkedIn, portfolio)
- Professional Summary (with AI-generation button)
- Education (multiple entries: school, degree, dates, GPA, achievements)
- Experience (multiple entries: company, role, dates, bullet-pointed responsibilities)
- Skills (categorized: technical, soft, languages)
- Projects (title, description, tech stack, link)
- Certifications

#### AI Features
- **AI Summary Generator:** writes a 3-sentence professional summary based on entered experience
- **AI Bullet Improver:** rewrites weak bullets into strong, action-verb-led achievements

#### Live Preview
- iframe-rendered preview using `ResumePreview.tsx`
- Updates in real-time as user types
- WYSIWYG editing experience

#### Export
- **Fast PDF** (browser print engine — instant, perfect typography)
- **HD PDF** (html2canvas + jsPDF — pixel-perfect, slightly slower)
- HTML export
- Plain text export

#### Implementation Note
The `InputRow` component is defined **outside** the main render loop to prevent React re-mounting and the dreaded input-focus-loss bug.

### 16.2 Job Search (`JobSearch.tsx`)
- Powered by the `job-search` edge function
- Searches real job listings via external API
- Filter by location, role, experience level
- Save jobs for later

### 16.3 Internship Matcher (`InternshipMatcher.tsx`)
- Input: skills, location, availability
- AI matches user to relevant internships
- Includes student-friendly programs

### 16.4 Real World Why (`RealWorldWhy.tsx`)
- Input: a topic from school (e.g., "calculus")
- AI explains: real-world careers using this, salary ranges, companies that hire for this skill
- Motivates students by connecting school content to future earnings

### Quotas
| Tier | Job searches/month |
|------|--------------------|
| Free | 5 |
| Plus | 20 |
| Pro | Unlimited |

---

## 17. Plan & Focus Module

### Location: `src/pages/Plan.tsx` + `src/components/planning/`

The Plan page organizes the student's time and tracks progress.

### Tab 1: Schedule

#### Study Timetable (`StudyTimetable.tsx`)
- Weekly calendar view (Mon–Sun, hourly slots)
- Drag-and-drop to add study blocks
- Color-coded by course
- Recurring slots (e.g., "Math every weekday 4–5pm")

#### Smart Scheduler (`SmartScheduler.tsx`)
- AI-powered: input subjects + exam date + available hours/day
- AI generates an optimal study schedule balancing subjects and weakness areas
- Adapts as user completes sessions

#### Weakness Detector (`WeaknessDetector.tsx`)
- Analyzes quiz/exam history
- Identifies subjects/topics where accuracy is below 60%
- Recommends specific lessons and flashcard decks to address weaknesses

### Tab 2: Focus

#### Pomodoro Timer
(Same as in Study Suite — see [13.9](#139-pomodoro-timer-pomodorotimertsx))

#### Lo-Fi Radio (`LofiRadio.tsx`)
- Streaming lo-fi beats for studying
- 5+ curated stations (chill, jazz-hop, classical, nature sounds, white noise)
- Background playback
- Free for all tiers

#### Sleep Calculator (`SleepCalculator.tsx`)
- Input: wake-up time
- Calculates ideal bedtime based on 90-minute sleep cycles
- Recommends 5–6 cycles for students (7.5–9 hours)

### Tab 3: Progress

#### Streak Calendar
(See [13.11](#1311-streak-calendar-streakcalendartsx))

#### Progress Tracker (`ProgressTracker.tsx`)
- Long-term view: month-over-month XP growth, course completion percentages
- Goal-setting: set a weekly XP target, see progress
- Recharts line chart showing 4-week trend

---

## 18. Focus Mode & App Blocker

### Location: `src/pages/Focus.tsx`, `src/pages/FocusSession.tsx`, `src/components/focus/`

Focus Mode is StudentOS's killer feature for distraction control.

### Web Implementation
- **Pomodoro timer** with start/pause/reset
- **BlockingOverlay** (`BlockingOverlay.tsx`) — full-screen overlay if user navigates away during a session
- Logs sessions to `focus_sessions` table
- Awards XP based on session duration

### Android Implementation (Native)
- **Custom Capacitor plugin** in Java: `FocusModePlugin.java` + `FocusModeService.java`
- Uses Android **AccessibilityService** to detect when blocked apps are launched
- Immediately shows a full-screen overlay redirecting back to StudentOS
- **BootReceiver.java** restores blocking state after device restart

### Permissions Setup (`PermissionsSetup.tsx`)
First-time Android users see a guided flow:
1. Grant Accessibility Service permission
2. Grant Display Over Other Apps permission
3. Grant Notification permission (for session reminders)

### App Selector (`AppSelector.tsx`)
- Lists all installed apps on device (via Capacitor)
- User checks which apps to block (TikTok, Instagram, YouTube, etc.)
- Saves to `blocked_app_list` table per user

### Focus Mode Overlay (`FocusModeOverlay.tsx`)
- Full-screen lock during active sessions
- Shows countdown timer
- Motivational quote
- Emergency exit (requires PIN if parental controls enabled)

### useFocusLock & useFocusMode Hooks
- React hooks managing focus state across the app
- Sync between web and native via Capacitor bridge

---

## 19. Social Hub

### Location: `src/pages/Social.tsx` + `src/components/social/`

The Social Hub turns solo studying into a community sport.

### Tab 1: Compete

#### Leaderboard (`Leaderboard.tsx`)
- Global ranking by total XP (all-time and weekly)
- Top 100 displayed with avatars and stats
- User's own rank highlighted
- Filter by school (if school name set in profile)

#### Study Challenges (`StudyChallenges.tsx`)
- Time-limited community challenges (e.g., "Study 10 hours this week")
- Progress bars
- Completion rewards (XP + special badges)

#### Challenge a Friend (`ChallengeAFriend.tsx`)
- Send a quiz challenge to any friend
- Both take the same quiz
- Winner announced with bonus XP
- Stored in `peer_challenges` table

### Tab 2: Friends

#### Friends List (`FriendsList.tsx`)
- Send friend requests by username
- Pending requests / accepted friends / blocked users
- Tap a friend to see their profile (XP, streak, achievements)
- Direct-message button

### Tab 3: Groups

#### Study Groups (`StudyGroups.tsx`)
- Create or join study groups (max 10 members on Plus, 25 on Pro)
- **Plus/Pro only** — gated feature
- Each group has a unique 6-character invitation code
- Public groups discoverable in Discover tab
- Private groups join-by-code only

#### Group Detail (`GroupDetail.tsx`)
- Group chat
- Shared resources tab (notes, quizzes shared by members → `group_resources` table)
- Members tab with roles (admin / member)
- Leave group / delete group (admin only)

### Tab 4: Discover

#### Peer Finder (`PeerFinder.tsx`)
- Discover other students by school, grade, and interests
- Send friend requests
- Useful for finding study buddies in your class

---

## 20. Chat System (DMs & Groups)

### Location: `src/pages/Chat.tsx`, `src/pages/GroupChat.tsx`, `src/components/chat/`

Real-time chat powered by Supabase Realtime.

### Direct Messages
- 1-on-1 chat with any friend
- Available on **all tiers** (Free included)
- Messages stored in `messages` table with `recipient_id`

### Group Chats
- Multi-user chat for study groups
- **Plus/Pro only** for both creation AND access
- Messages tagged with `group_id`

### Features

#### Media Upload (`MediaUpload.tsx`)
- Upload images (PNG, JPG)
- Stored in Supabase Storage `chat-media` bucket
- Image previews inline in chat

#### Message Replies
- Tap any message to reply
- Reply shows quoted preview of original message
- Quoted preview is **clickable** — uses `scrollIntoView` to navigate to the original message in chat

#### Real-time Updates
- Subscribed to `messages` table via Supabase Realtime
- New messages appear instantly without refresh
- Read receipts via `is_read` boolean

#### Typing Indicators
- Coming in v1.1

### Chat Room (`ChatRoom.tsx`)
- Unified component used for both DMs and group chats
- Conditional UI based on `group_id` presence

---

## 21. Store — Educational Resources

### Location: `src/pages/Store.tsx` + `src/components/store/`

A marketplace of **downloadable educational resources** uploaded by admins.

### Resource Types
- **Textbooks** (PDF)
- **Past Papers** (PDF)
- **Notes** (PDF/DOCX)
- **Videos** (YouTube embeds)

### Resource Card (`ResourceCard.tsx`)
- Thumbnail
- Title, author, subject, grade level
- Download count (social proof)
- Tier badge (Free / Plus / Pro)
- Download button (or "Upgrade to access" if locked)

### Resource Filters (`ResourceFilters.tsx`)
- Search by title
- Filter by category (textbook / past paper / notes / video)
- Filter by subject (Math, English, Biology, etc.)
- Filter by grade level (JSS1–SS3 for Nigerian; international grades)

### YouTube Section (`YouTubeSection.tsx`)
- Curated YouTube playlists
- Embedded video player
- Categorized by subject

### Tier Gating
- Free resources: visible to all
- Plus resources: visible to Plus + Pro only
- Pro resources: visible to Pro only
- Free users see locked resources with an "Upgrade to unlock" CTA

### Download Tracking
- Each download increments `store_resources.download_count`
- Used as social proof and admin analytics

---

## 22. Gamification System

The gamification layer drives daily engagement.

### XP (Experience Points)

#### Sources of XP
- Completing a quiz: 5 XP per correct answer
- Reviewing flashcards: 1 XP per card
- Pomodoro session completed: 10 XP per 25-min session
- Daily Brain Boost: 10 XP per correct answer (max 50/day)
- Streak milestones: 50 XP at 7 days, 200 XP at 30 days, 1000 XP at 100 days
- Achievements unlocked: variable XP per achievement
- Friend challenges won: 25 XP

#### Storage
- `profiles.total_xp` — lifetime total
- `weekly_xp` table — per-week breakdown for trends and weekly leaderboard

### Streaks
- A streak counts consecutive days with **at least one study activity** (note created, quiz taken, flashcard reviewed, focus session, etc.)
- Tracked via `profiles.current_streak` and `profiles.longest_streak`
- Updated by the `streak.ts` lib whenever an activity is logged
- Streak resets to 0 if a day is missed (no grace period currently)
- Visualized via `StreakCard` and `StreakCalendar`

### Daily Challenges (`DailyChallenges.tsx`)
- Three rotating daily tasks (e.g., "Complete 1 quiz", "Review 10 flashcards", "Study for 30 min")
- Tracked via `challenge_claims` table
- 25 XP per challenge completed

### Daily Quiz Challenge ("Brain Boost")
- Featured prominently on the dashboard
- 5 questions/day, 10 XP each
- See [Dashboard section](#daily-quiz-challenge-dailyquizchallengetsx) for details

### Levels
- Calculated from `total_xp`: every 1000 XP = 1 level
- Displayed on profile and leaderboard
- Higher levels unlock cosmetic profile badges (planned)

---

## 23. Achievements

### Location: `src/pages/Achievements.tsx` + `src/components/dashboard/`

50+ achievements across 5 categories:

### Categories

#### 1. Study Time
- "First Steps" — Study for 30 minutes total
- "Dedicated" — 10 hours total
- "Scholar" — 50 hours total
- "Master" — 200 hours total

#### 2. Streak
- "Consistent" — 3-day streak
- "Committed" — 7-day streak
- "Unstoppable" — 30-day streak
- "Legendary" — 100-day streak

#### 3. Social
- "Networker" — 5 friends added
- "Influencer" — 25 friends
- "Group Leader" — Created a study group
- "Challenger" — Won 10 friend challenges

#### 4. Academic Mastery
- "Quiz Pro" — 100% on a quiz
- "Quiz Champion" — 10 quizzes with 100%
- "Flashcard King" — Reviewed 1000 flashcards
- "Note Taker" — Created 50 notes

#### 5. Exam Prep
- "Exam Ready" — Completed first mock exam
- "Mock Master" — 10 mock exams
- "Subject Expert" — 90%+ accuracy in any subject

### Unlock Mechanics
- Achievements are computed from real-time database queries (not pre-stored counters)
- Logic in `useAchievements.ts` hook
- Checks all achievements on app load and after every major activity
- New unlocks trigger a celebration toast with XP reward

### Storage
- `achievements` table — definitions (id, name, description, icon, requirement, xp_reward)
- `user_achievements` table — which user unlocked which achievement and when

---

## 24. Safety & Parental Controls

### Location: `src/pages/Safety.tsx` + `src/components/safety/`

Built specifically for parents of younger students (ages 11–17).

### Tab 1: Controls (`ParentalControls.tsx`)

#### PIN Protection
- 4-digit PIN required to access controls
- Hashed and stored in `profiles.parental_pin`
- Without PIN, settings are read-only

#### Settings
- **Daily time limit** — block app after X minutes of use (default 120)
- **Content filter** — sanitize AI prompts to remove inappropriate topics (`profiles.content_filter_enabled`)
- **Safe search** — filter store resources for age-appropriate content (`profiles.safe_search_enabled`)
- **Under 14 mode** — extra restrictions for younger users (`profiles.is_under_14`)
- **Parent email** — for weekly progress reports (`profiles.parent_email`)

#### App Blocker Settings (`AppBlockerSettings.tsx`)
- Configure which apps to block during focus sessions
- Schedule blocking times (e.g., "Block social media weekdays 6pm–10pm")

### Tab 2: Activity (`ParentDashboard.tsx`)

Parent-facing dashboard showing:
- **Today's study time** (minutes)
- **Activities completed** (notes, quizzes, flashcards)
- **Focus sessions** completed
- **Subjects studied** (most active courses)
- **Weekly trend chart** (Recharts bar chart)
- **Streak status**
- **Achievements unlocked this week**

All data pulled live from `study_sessions`, `pomodoro_sessions`, `quiz_attempts`, `flashcards`, `notes`, `user_achievements`.

### Time Limit Enforcement
When daily limit is reached:
- Full-screen blocking overlay
- "Time's up — come back tomorrow!" message
- Override requires parental PIN

---

## 25. Subscription & Payments

### Location: `src/pages/Upgrade.tsx` + `src/lib/subscriptionConfig.ts` + `src/lib/paystackConfig.ts`

### Tiers

| Feature | Free | Plus (₦2,000/mo) | Pro (₦5,000/mo) |
|---------|------|------------------|-----------------|
| AI calls/day | 5 | 30 | 100 |
| Notes/day | 3 | 10 | Unlimited |
| Quizzes/day | 3 | 10 | Unlimited |
| Flashcards generated/day | 3 | 20 | Unlimited |
| Job searches/month | 5 | 20 | Unlimited |
| Group chat | ❌ | ✅ | ✅ |
| Advanced study tools | ❌ | ✅ | ✅ |
| Exam Prep | Limited | Full | Full |
| Resume templates | 3 | 7 | 10 |
| Ads | Google Ads shown | No ads | No ads |
| Priority support | ❌ | ❌ | ✅ |

### Yearly Plans
- Plus Yearly: ₦20,000 (save 17%)
- Pro Yearly: ₦50,000 (save 17%)

### Payment Flow

1. User clicks "Upgrade" on Upgrade page or any feature gate
2. Selects plan
3. Paystack checkout opens (cards, bank transfer, USSD all supported)
4. On success, Paystack redirects with a `reference` query param
5. Frontend calls the **`verify-payment` edge function** with the reference
6. Edge function validates reference with Paystack API server-side
7. If valid, updates `profiles.subscription_tier` + `profiles.subscription_expires_at`
8. Frontend dispatches `subscription-updated` window event
9. `useSubscription` hook re-fetches and updates UI immediately

### Subscription State Sync
- `useSubscription` hook auto-refreshes every 5 minutes
- Listens to `subscription-updated` events for instant UI updates
- Handles edge cases: expired subscriptions, downgrades, manual admin overrides

### Feature Gating
- `FeatureGateDialog.tsx` — shown when free user hits a paywall
- `UpgradePrompt.tsx` — softer inline upgrade nudges
- All gated by `useSubscription().tier` checks

### Kill Switch
- `subscriptionConfig.ts` has an `ENABLED` flag
- When `false`, all features are unlocked for everyone (useful for promotions or testing)

### Per-Exam Subscriptions
Separate from the global tiers, students can buy access to a single exam type (e.g., JAMB-only) via the `exam_subscriptions` table.

---

## 26. Profile & Settings

### Location: `src/pages/Profile.tsx`

### Sections

#### Profile Info
- Avatar (uploaded via `AvatarUpload.tsx` to Supabase Storage `avatars` bucket)
- Display name (editable)
- Username (unique, used for friend requests)
- Full name
- Email (read-only)
- School name
- Grade level (JSS1–SS3 / Year 1–4 / Postgrad)

#### Stats Display
- Total XP and current level
- Current streak / longest streak
- Achievements count
- Member since date

#### Study Preferences
- Study persona (Chill / Strict / Fun / Motivator)
- Daily study target (minutes)
- Notification preferences

#### Subscription Status
- Current tier badge
- Expiration date (if Plus/Pro)
- "Manage subscription" button → Upgrade page

#### Account Actions
- Sign out
- Delete account (with confirmation)
- Privacy policy + Terms of Service links

---

## 27. Offline Mode & PWA

### Location: `src/lib/offlineSync.ts`, `src/hooks/useOfflineData.ts`, `src/components/pwa/`

StudentOS works **fully offline** for cached content, critical for African connectivity realities.

### What Works Offline
- View previously-loaded notes
- Review flashcards (existing decks)
- View course list
- Read summaries
- Offline AI (cached responses for previously-asked questions)

### What Requires Connection
- Generating new AI content
- Sending messages
- Real-time chat
- Payment processing
- Fetching new questions for ExamPrep

### Implementation
- **Service Worker** caches the entire app shell + recently-loaded data
- **IndexedDB** via `offlineSync.ts` stores notes, flashcards, courses locally
- **Background sync** — when online again, queued mutations (e.g., quiz attempts) auto-sync to the server
- **OfflineStatusBanner** (`OfflineStatusBanner.tsx`) — yellow banner when offline
- **OfflineSyncIndicator** (`OfflineSyncIndicator.tsx`) — spinner when syncing

### PWA Install
- App is installable on iOS/Android home screens
- `Install.tsx` page with platform-specific install instructions
- Standalone mode (no browser chrome) when launched from home screen

### PWA Update Banner (`PWAUpdateBanner.tsx`)
- Detects when a new app version is deployed
- Shows banner: "New version available — Reload to update"
- One-click update via `usePWAUpdate` hook

---

## 28. PDF Export System

### Location: `src/components/export/ExportUtils.tsx` + `DownloadDropdown.tsx`

Critical infrastructure used by 10+ features (notes, cheat sheets, quizzes, flashcards, resumes, academic tools, AI tool outputs).

### Two Modes

#### Fast PDF (Default)
- Uses the **browser's native print engine** via a hidden iframe
- Calls `window.print()` → user saves as PDF via the browser's print dialog
- **Speed:** ~instant (1–2 seconds)
- **Quality:** perfect typography, native pagination, KaTeX equations render correctly via CDN-loaded fonts
- Best for most use cases

#### High-Quality (HD) PDF
- Uses **html2canvas** + **jsPDF** to capture the rendered DOM as a high-resolution image
- Scale 2× for retina-quality output
- JPEG compression at 0.85 for smaller file size
- **Speed:** 5–15 seconds depending on content length
- **Quality:** pixel-perfect — exactly what you see on screen
- Best for resumes and visually-rich documents

### Download Dropdown UI
- A unified dropdown button (replaces single "Download" buttons)
- Two options with icons: ⚡ "Fast PDF" / ✨ "HD PDF"
- Loading toasts for HD mode (which takes longer)

### KaTeX Font Handling
- Both modes inject the KaTeX CSS via CDN link to ensure math fonts (Math Italic, Symbols, AMS) load
- Fast mode waits for `document.fonts.ready` before triggering print
- HD mode waits 800ms after font load to ensure all glyphs render before capturing

---

## 29. Admin Panel

### Location: `src/pages/AdminResources.tsx` + `supabase/functions/admin-resources/`

A comprehensive admin dashboard at `/admin-resources`, password-protected via `ADMIN_PANEL_PASSWORD` secret.

### Access
- Navigate to `/admin-resources`
- Enter admin password
- Password verified by the **`admin-verify`** edge function (not stored client-side)

### Architecture
- **Lazy-loaded tabs** — content only mounts and fetches when its tab is selected
- Mobile-optimized: scrollable horizontal tab navigation
- All operations go through the `admin-resources` edge function (no direct DB access from frontend admin)

### Tabs

#### Tab 1: Analytics
The most data-rich admin view.
- **Total users** (count, weekly growth)
- **Subscription distribution** — Pie chart (Free green, Plus blue, Pro purple) with percentages
- **Daily Active Users (DAU)** — 30-day line chart via Recharts
- **Daily signups** — 30-day line chart
- **Monthly Recurring Revenue (MRR)** estimate based on active subscriptions
- **Weekly retention rate** (cohort analysis)
- **Feature usage** — top 10 most-used features this week
- **Top XP earners** leaderboard (admin-only view)
- **AI usage** — total daily AI calls across all users
- **Content health** — counts of notes, quizzes, flashcards, exam questions per subject
- **CSV export** — download all analytics for external analysis

#### Tab 2: Resources
Manage the Store.
- Add new resource (form: title, author, subject, grade, category, file upload, thumbnail upload, tier)
- Edit existing resources (inline)
- Delete resources
- Bulk upload via CSV (planned)
- Preview file before publishing

#### Tab 3: Exams
The most complex admin section.

**Exam Types Management:**
- Create exam types (WAEC, NECO, JAMB, custom)
- Set: name, slug, country, icon, description, exam_mode (per_subject / multi_subject), questions_per_subject, time_limit_minutes

**Subjects:**
- Add subjects under each exam type
- Each subject has its own `ai_prompt` for AI-generated questions

**Topics:**
- Add topics under each subject
- Each topic has a difficulty rating

**Questions:**
- Manual question entry (question text, options, correct answer, explanation, difficulty, year, topic)
- **Bulk JSON import** — paste a JSON array of questions
- **PDF Import** — upload a past-paper PDF, AI extracts and creates structured questions automatically (via `extract-pdf-text` + `exam-practice` edge functions)
- Toggle `is_active` to disable bad questions
- View question reports from users (`question_reports` table)

#### Tab 4: Announcements
- Create app-wide announcements
- Set title, content, type (info/warning/success), expiration date
- Display priority order
- Delete or deactivate

#### Tab 5: Achievements
- Define new achievements
- Set: name, description, icon, requirement type, requirement value, XP reward
- Edit existing achievements (changes affect all users retroactively)

#### Tab 6: Users
- Search users by email or username
- View user detail panel:
  - Profile info
  - Subscription status
  - Activity timeline (last 10 actions)
  - Per-subject accuracy breakdown
  - Weekly study trend chart
  - XP, streak, focus time stats
  - Resources created (notes/flashcards/courses count)
- **Block / Unblock toggle** — instantly bans a user (sets `is_blocked=true`, signs them out next visit)

#### Tab 7: Payments
- Manually grant Pro / Plus access (for refunds, gifts, support cases)
- View all subscription transactions
- Update subscription expiration dates manually
- Issue refunds (manual notation; actual Paystack refund must be done in Paystack dashboard)

### Admin Edge Function (`admin-resources/index.ts`)
- Validates admin password on every request
- Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for admin operations
- Routes ~30 different action types: `list-users`, `update-subscription`, `toggle-block-user`, `create-resource`, `bulk-import-questions`, etc.
- Returns JSON responses with appropriate error codes

### Admin Verify Edge Function (`admin-verify/index.ts`)
- Single-purpose: verify the admin password matches `ADMIN_PANEL_PASSWORD` env var
- Returns `{ valid: true }` or 401
- Frontend stores `admin_authenticated` flag in sessionStorage after success

---

## 30. Internal Documentation Portal

### Location: `src/pages/docs/`

A private documentation portal at `/docs`, also protected by `ADMIN_PANEL_PASSWORD`.

### Pages
- **DocsHome** — landing page with navigation
- **DocsArchitecture** — tech stack, database schema, edge functions, auth flow, storage buckets
- **DocsFeatures** — subscription tiers table + detailed feature descriptions
- **DocsBusiness** — pricing model, payment flow, revenue streams, key metrics, kill switch
- **DocsAdminGuide** — step-by-step admin task instructions
- **DocsLaunchPlaybook** — go-to-market strategy, marketing channels, launch timeline

### Layout (`DocsLayout.tsx`)
- Sidebar navigation
- Markdown rendering
- Code syntax highlighting
- Used internally by founders, contractors, and stakeholders

---

## 31. Database Architecture

### PostgreSQL via Supabase

### 30+ Tables (full schema in `src/integrations/supabase/types.ts`)

### Core Tables
- **profiles** — extended user data (subscription, XP, streak, settings, parental controls)
- **courses** — user-created course folders
- **notes** — uploaded or typed study notes with AI summaries
- **flashcards** — SM-2 spaced repetition cards
- **quiz_attempts** — quiz scores and history
- **chat_messages** — AI tutor conversation history
- **pomodoro_sessions** — completed focus blocks
- **focus_sessions** — extended focus mode sessions with app blocking
- **study_sessions** — daily aggregated study time
- **weekly_xp** — weekly aggregated XP for trend charts

### Exam Tables
- **exam_types** — WAEC, NECO, JAMB, IELTS, etc.
- **exam_subjects** — Math, English, Biology per exam type
- **exam_topics** — Quadratic Equations, Trigonometry per subject
- **exam_questions** — the question bank
- **exam_attempts** — per-question answer history
- **exam_bookmarks** — saved questions for review
- **exam_pdfs** — admin-uploaded past papers
- **exam_subscriptions** — per-exam premium access
- **question_reports** — user-flagged bad questions

### Social Tables
- **friendships** — friend requests and connections
- **study_groups** — group definitions
- **study_group_members** — group membership
- **messages** — DMs and group chat messages
- **group_resources** — resources shared in groups
- **peer_challenges** — friend quiz challenges

### Gamification Tables
- **achievements** — achievement definitions
- **user_achievements** — unlocked achievements per user
- **challenge_claims** — daily challenge completions

### Admin/Content Tables
- **store_resources** — Store marketplace items
- **announcements** — admin broadcasts
- **blocked_app_list** — focus mode blocked apps per user
- **study_goals** — user-set study goals

### Row-Level Security (RLS)
- **Every table has RLS enabled**
- Policies enforce `auth.uid() = user_id` for user-owned data
- Admin operations use the service role key via edge functions to bypass RLS
- Public-read tables (achievements, exam_types, store_resources, announcements) require only authenticated users
- Group/friendship tables have complex policies checking membership via subqueries

---

## 32. Edge Functions (Backend)

All in `supabase/functions/`. Deno runtime.

### 32.1 ai-study
**Purpose:** Central AI gateway for all educational content generation.
**Modes:** `summarize`, `eli5`, `quiz`, `flashcards`, `tutor`, `socratic`, `math_solver`, `code_debug`, `translate`, `youtube_summary`, `mnemonic`, `cheatsheet`, `essay_grade`, `plagiarism`, `research`, `thesis`, `bibliography`, `citation`, `cram`, `concept_link`, `fill_blanks`, `debate`, `resume_summary`, etc.
**Quota Enforcement:** Validates subscription tier and increments `ai_calls_today` BEFORE calling AI. Server-side enforcement prevents bypass.
**Streaming:** Returns SSE stream for real-time word-by-word output.
**Models:** Routes to Gemini or GPT based on task complexity.

### 32.2 exam-practice
**Purpose:** ExamPrep CBT engine.
**Actions:** `generate_questions`, `submit_answer`, `get_weaknesses`, `generate_study_plan`, `explain_topic`, `guided_learning`, `extract_pdf_questions`.
**Logic:** Pulls questions from DB; falls back to AI generation when bank is insufficient. Computes user's difficulty bias from history to serve appropriately challenging questions.

### 32.3 extract-pdf-text
**Purpose:** Extract text from native (selectable-text) PDFs.
**Library:** `unpdf`.
**Used by:** Smart Notes upload, ExamPrep PDF import.

### 32.4 extract-pdf-text-ocr
**Purpose:** OCR for scanned PDFs and images.
**Library:** Tesseract.js or vision AI fallback.
**Used by:** Book Scanner, scanned past papers.

### 32.5 job-search
**Purpose:** Search real job listings via external API.
**Used by:** Career → Job Search.

### 32.6 verify-payment
**Purpose:** Server-side Paystack payment verification.
**Logic:** Calls Paystack API with reference; if successful, updates user's subscription tier and expiration in DB.
**Critical for security:** Prevents users from forging successful-payment URLs.

### 32.7 admin-resources
**Purpose:** All admin panel operations.
**Auth:** Requires admin password header.
**Bypass RLS:** Uses service role key.

### 32.8 admin-verify
**Purpose:** Verify admin password.
**Single endpoint** for the admin login screen.

---

## 33. Security Model

### 33.1 Authentication
- JWT tokens issued by Supabase Auth
- Auto-refresh every hour via refresh tokens
- Sign-out clears all tokens and storage
- Session restored on app reload

### 33.2 Row-Level Security (RLS)
- Enabled on every public-schema table
- Policies enforce ownership: `auth.uid() = user_id`
- Even if frontend is compromised, attackers cannot access other users' data

### 33.3 Edge Function Auth
- All edge functions verify the JWT via the `Authorization` header
- Admin functions verify the admin password additionally
- Service role key never exposed to the frontend

### 33.4 AI Quota Enforcement
- **Dual-layer:** client-side gating (UX) + server-side enforcement (security)
- Client-side check via `useSubscription` hook prevents needless API calls
- Server-side check in `ai-study` enforces hard limit — bypass is impossible

### 33.5 Payment Security
- Payments verified server-side via Paystack API in `verify-payment` function
- Frontend never decides subscription state — server is sole authority

### 33.6 Content Filtering
- Optional safe-search and content filters for under-14 users
- AI prompts sanitized server-side when filters enabled

### 33.7 Admin Panel
- Password stored as edge function secret (`ADMIN_PANEL_PASSWORD`)
- Never exposed to frontend
- All admin operations gated behind verification

### 33.8 Block System
- `profiles.is_blocked` flag
- Checked on every login
- Blocked users immediately signed out

---

## 34. Design System

### Philosophy
- **Mobile-first** — primary viewport is 375–428px
- **Bold but minimal** — high contrast, generous whitespace, single accent color
- **Animation as feedback** — Framer Motion for transitions, success/failure states, loading

### Typography
- **Display font:** Custom serif/display pairing for headers
- **Body font:** Sans-serif for readability

### Color Tokens (HSL)
All colors defined in `src/index.css` and `tailwind.config.ts` as semantic tokens:
- `--background` / `--foreground`
- `--primary` / `--primary-foreground` / `--primary-glow`
- `--secondary` / `--muted` / `--accent`
- `--destructive` / `--success` / `--warning`
- `--border` / `--input` / `--ring`
- `--card` / `--card-foreground`
- `--popover` / `--popover-foreground`

### Gradients & Effects
- `--gradient-primary` — branded linear gradient used on logos, CTAs
- `--shadow-elegant` — soft drop shadow for elevated cards
- `glow-primary` — subtle glow effect for important elements

### Dark Mode
- Toggle via `ThemeToggle.tsx`
- All tokens have light + dark variants in `index.css`
- System preference detected on first load

### Components
- All built on **shadcn/ui** (Radix primitives + Tailwind)
- Customized variants per component (e.g., Button has `default`, `outline`, `ghost`, `destructive`, `gradient`)
- Fully accessible (keyboard navigation, ARIA labels, focus rings)

### Layout
- **AppLayout** wraps every authenticated page
- Sticky header with logo, theme toggle, profile, settings sheet
- Max-width 512px (lg) for mobile-optimized reading
- Bottom nav for primary navigation
- Ad banner above bottom nav (free tier only)

### Bottom Nav (`BottomNav.tsx`)
5 primary destinations:
- 🏠 Home (Dashboard)
- 📚 Study (Smart Notes / Flashcards / Quizzes hub)
- 🎯 Exams (ExamPrep)
- 👥 Social
- 👤 Profile

---

## 35. Roadmap

### v1.1 (Q2 2026)
- iOS native app (Capacitor build)
- Push notifications
- Voice typing in notes
- Live tutoring marketplace (connect with human tutors)
- School admin accounts (teachers manage their students)

### v1.2 (Q3 2026)
- Multiplayer real-time quiz battles
- AI-graded essay practice for WAEC/NECO English
- Curriculum alignment to specific textbooks
- Offline AI via on-device small models

### v1.3 (Q4 2026)
- Multi-language UI (Yoruba, Igbo, Hausa, Swahili, French, Portuguese)
- Parent app (separate companion app for parents)
- School analytics dashboard for institutional buyers

### v2.0 (2027)
- AR-powered diagram exploration
- AI-generated personalized video lessons
- University-level course content
- Job placement partnerships

---

## 36. Glossary

- **CBT** — Computer-Based Test (e.g., JAMB administered on computers since 2013)
- **JAMB** — Joint Admissions and Matriculation Board (Nigerian university entrance exam)
- **WAEC** — West African Examinations Council (secondary school certification)
- **NECO** — National Examinations Council (alternative Nigerian secondary cert)
- **SSCE** — Senior Secondary Certificate Examination (administered by WAEC/NECO)
- **UTME** — Unified Tertiary Matriculation Examination (administered by JAMB)
- **SM-2** — SuperMemo 2 algorithm for spaced repetition
- **PWA** — Progressive Web App (installable web app)
- **RLS** — Row-Level Security (Postgres feature for per-row access control)
- **SSE** — Server-Sent Events (one-way streaming protocol)
- **Pomodoro** — 25-min focus / 5-min break work technique
- **OCR** — Optical Character Recognition (extracting text from images)
- **KaTeX** — Math typesetting library (faster than MathJax)
- **MRR** — Monthly Recurring Revenue
- **DAU/MAU** — Daily / Monthly Active Users
- **Tier gating** — locking features behind subscription levels
- **Feature gate** — UI element that prompts upgrade when free user hits a paid feature

---

## Appendix A: File Structure Overview

```
src/
├── pages/                      # Route-level page components
│   ├── Dashboard.tsx           # Home hub
│   ├── SmartNotes.tsx          # Notes management
│   ├── AITutor.tsx             # Chat-based tutor
│   ├── Flashcards.tsx          # SM-2 review
│   ├── Quizzes.tsx             # Quiz history + taking
│   ├── ExamPrep.tsx            # CBT entry point
│   ├── Study.tsx               # Study tools launcher
│   ├── Plan.tsx                # Schedule + Focus + Progress
│   ├── Focus.tsx               # Focus mode setup
│   ├── FocusSession.tsx        # Active focus session UI
│   ├── Social.tsx              # Friends + Groups + Compete
│   ├── Chat.tsx                # DM list
│   ├── GroupChat.tsx           # Group chat list
│   ├── Career.tsx              # Resume + Jobs + Internships
│   ├── Store.tsx               # Resource marketplace
│   ├── Achievements.tsx        # Badge gallery
│   ├── Safety.tsx              # Parental controls
│   ├── Profile.tsx             # User profile
│   ├── Upgrade.tsx             # Subscription page
│   ├── AdminResources.tsx      # Admin panel
│   ├── Auth.tsx                # Login/signup
│   ├── Onboarding.tsx          # 7-step intro
│   └── docs/                   # Internal docs portal
│
├── components/
│   ├── layout/AppLayout.tsx    # Auth-gated wrapper
│   ├── layout/BottomNav.tsx    # Mobile bottom nav
│   ├── dashboard/              # Dashboard widgets
│   ├── notes/                  # Note components
│   ├── flashcards/             # Flashcard components
│   ├── exam-prep/              # ExamPrep components
│   ├── study/                  # Study tools
│   ├── ai-tools/               # AI utilities
│   ├── academic/               # Research/writing tools
│   ├── career/                 # Resume + jobs
│   ├── planning/               # Schedule + focus
│   ├── focus/                  # Focus mode UI
│   ├── social/                 # Social features
│   ├── chat/                   # Chat components
│   ├── store/                  # Store components
│   ├── safety/                 # Parental controls
│   ├── subscription/           # Tier gating UI
│   ├── gamification/           # XP + challenges
│   ├── profile/                # Profile widgets
│   ├── pwa/                    # PWA banners
│   ├── export/                 # PDF export utilities
│   ├── ads/                    # Google Ads
│   ├── documents/              # Document viewers
│   └── ui/                     # shadcn/ui primitives
│
├── hooks/                      # Custom React hooks
│   ├── useAuth.tsx             # Auth context
│   ├── useSubscription.ts      # Tier + quota state
│   ├── useAchievements.ts      # Achievement tracking
│   ├── useFocusMode.ts         # Focus state
│   ├── useFocusLock.ts         # Native blocking
│   ├── useOfflineData.ts       # Offline-first queries
│   ├── useOfflineSync.ts       # Background sync
│   ├── useStudyTimeTracker.ts  # Auto-log study time
│   ├── useNotifications.ts     # Push notification setup
│   ├── usePWAUpdate.ts         # Update detection
│   └── ... (15+ more)
│
├── lib/
│   ├── ai.ts                   # AI streaming client
│   ├── offlineSync.ts          # IndexedDB sync layer
│   ├── streak.ts               # Streak calculation
│   ├── subscriptionConfig.ts   # Tier definitions
│   ├── paystackConfig.ts       # Paystack settings
│   └── educationConfig.ts      # Grade levels, exam types
│
├── integrations/supabase/
│   ├── client.ts               # Supabase client (auto-generated)
│   └── types.ts                # DB type definitions (auto-generated)
│
└── plugins/
    ├── FocusModePlugin.ts      # Capacitor plugin TS interface
    └── FocusModePluginWeb.ts   # Web fallback

supabase/
├── functions/
│   ├── ai-study/               # Central AI gateway
│   ├── exam-practice/          # CBT backend
│   ├── extract-pdf-text/       # PDF text extraction
│   ├── extract-pdf-text-ocr/   # OCR for scanned PDFs
│   ├── job-search/             # Career job search
│   ├── verify-payment/         # Paystack verification
│   ├── admin-resources/        # Admin panel backend
│   └── admin-verify/           # Admin auth
└── migrations/                 # Database schema migrations

android/
├── app/src/main/java/com/studentoss/app/
│   ├── MainActivity.java
│   ├── FocusModePlugin.java    # Capacitor plugin Java
│   ├── FocusModeService.java   # Accessibility service
│   └── BootReceiver.java       # Restore on boot
└── ... (Capacitor Android scaffolding)
```

---

## Appendix B: Key Design Decisions

### Why Lovable Cloud (Supabase) over Firebase?
- Postgres > NoSQL for relational data (exams, courses, notes)
- RLS provides row-level security without backend code
- Built-in real-time subscriptions
- Open-source and self-hostable if needed

### Why Capacitor over React Native?
- Single React codebase for web + mobile
- Easier hiring (web devs)
- Native plugins available when needed (we use one for app blocking)

### Why Paystack over Stripe?
- Native Nigerian payment support (cards, bank transfer, USSD)
- Lower fees in Nigeria
- Better fraud detection for African market

### Why Lovable AI Gateway over direct OpenAI/Google APIs?
- No API key management
- Automatic model fallback if one provider is down
- Built-in rate limiting
- Cost optimization (routes simple tasks to cheaper models)

### Why SM-2 over FSRS?
- Battle-tested (Anki uses it)
- Simpler to implement
- FSRS planned for v1.2

### Why mobile-first design?
- 92% of Nigerian internet users access via mobile
- Most students cannot afford laptops
- PWA install gives near-native experience

---

## Appendix C: Performance & Scale

### Frontend Performance
- Code-splitting per route (React.lazy)
- Image optimization (lazy loading, WebP where possible)
- Service Worker caching
- IndexedDB for offline data
- Tanstack Query for smart caching and request deduplication

### Backend Performance
- Postgres indexes on all foreign keys + commonly-queried fields
- Edge functions deployed to global edge network
- AI streaming reduces perceived latency to ~200ms

### Scalability
- Supabase scales to 100k+ concurrent users on standard tier
- Stateless edge functions horizontally scalable
- CDN-served static assets (Vercel/Cloudflare)
- Database read-replicas available on Pro tier (Lovable Cloud)

### Cost Estimates at Scale
- 10,000 active users:
  - Database: ~$50/mo
  - Edge functions: ~$30/mo (mostly AI calls)
  - AI costs (via gateway): ~$200/mo (mostly Free tier — Pro/Plus revenue covers their usage)
  - Storage: ~$20/mo
  - **Total infra: ~$300/mo**
- **Revenue at 10k users (5% paid conversion):** 500 paying × ₦3,500 avg = ₦1,750,000 = ~$1,200/mo
- **Healthy unit economics from day one**

---

## Appendix D: Marketing & Positioning

### Target Personas

**1. Tomi, 16, SS2 student in Lagos**
- Studying for WAEC + JAMB next year
- Has Android phone (Tecno Spark), 2GB RAM
- Spends 4 hours/day on TikTok, knows it's hurting grades
- Parents pressure her to perform, but cannot afford lessons
- **StudentOS gives her:** AI tutor, JAMB CBT practice, app blocker, free tier to start

**2. Chinedu, 21, university student in Nsukka**
- Studying Engineering, struggling with Calculus
- Has cheap laptop + smartphone
- Can afford ₦5,000/month if it improves grades
- **StudentOS gives him:** Math Solver, AI Tutor, study group with classmates, resume builder for internships

**3. Mrs. Okafor, 42, mother of 13-year-old in Abuja**
- Worried about son's screen time
- Doesn't understand math homework
- Wants visibility into son's study habits
- **StudentOS gives her:** Parent dashboard, app blocker, content filter, peace of mind

### Acquisition Channels
1. **TikTok / Instagram organic** — short-form video showcasing AI tutor solving JAMB problems
2. **WhatsApp groups** — partner with school WhatsApp admins to share
3. **YouTube influencers** — Nigerian study YouTubers (~50k–500k subs each)
4. **School partnerships** — pilot programs with private secondary schools
5. **Google Ads** — target "JAMB CBT", "WAEC past questions" keywords
6. **Referral program** — both referrer and new user get 1 month Plus free

### Launch Marketing Playbook
See `src/pages/docs/DocsLaunchPlaybook.tsx` for the comprehensive launch strategy.

---

## Final Notes for Exhibition Visitors

**StudentOS is not just an app — it's an ecosystem.** Every feature feeds into another:

- A note becomes a flashcard becomes a quiz becomes an exam-prep weakness report.
- A focus session becomes XP becomes a streak becomes a leaderboard rank.
- A friend invite becomes a study group becomes shared resources becomes mutual achievements.
- A resume bullet becomes a job application becomes career growth.

We built StudentOS because we believe every African student deserves the same caliber of educational support that a wealthy student in Singapore or Silicon Valley takes for granted. The technology to deliver this exists today. The economics work. The need is enormous.

**This is the operating system the next generation of African scholars will study on.**

---

*Built with ❤️ for students everywhere.*
*StudentOS — © 2026*
