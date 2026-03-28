# StudentOS Improvement Plan

## Context
- Project: StudentOS (studentoss.vercel.app)
- Tech: React + TypeScript + Vite + Tailwind + shadcn-ui + Supabase
- Codebase: 230+ TSX/TS files, ~18MB
- Status: Live web app with freemium model (₦2,000-5,000/mo)

---

## MY EXECUTION PLAN

I'll tackle this in **5 phases** with specific deliverables per phase. I'll work autonomously and report progress.

### PHASE 1: Analysis & Quick Wins (Day 1-2)
- [x] Clone repo & understand structure
- [ ] Run dev server & identify bugs
- [ ] Fix critical runtime errors
- [ ] Add missing empty states
- [ ] Improve loading states

### PHASE 2: Core UX Improvements (Day 3-5)
- [ ] Fix PWA (service worker + manifest)
- [ ] Add proper offline detection
- [ ] Improve navigation/UX
- [ ] Add toast notifications everywhere
- [ ] Fix empty Store (admin resource system)

### PHASE 3: Monetization Features (Day 6-10)
- [ ] Implement exam packs purchase flow
- [ ] Add one-time purchase option
- [ ] Create referral system
- [ ] Add lifetime plan option
- [ ] Implement AdMob (free tier)

### PHASE 4: New Features (Day 11-15)
- [ ] Complete Groups feature
- [ ] Add achievement system polish
- [ ] Build school/class code system
- [ ] Add analytics dashboard
- [ ] Video course library basics

### PHASE 5: App Store Prep (Day 16-20)
- [ ] Fix Android build
- [ ] Generate all icons/screenshots
- [ ] Create privacy policy page
- [ ] Test Play Store build
- [ ] Document launch steps

---

## Prioritized Issues

### MUST FIX (Blocking)
1. Empty Store - no resources
2. PWA not installable on some devices
3. Some pages show blank/error

### SHOULD FIX (High Impact)
4. Loading states inconsistent
5. No push notifications
6. Groups feature incomplete

### NICE TO HAVE (Growth)
7. Referral system
8. Video content library
9. Advanced analytics

---

## Technical Notes

### Environment Variables Needed
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- Paystack keys

### Key Dependencies
- @supabase/supabase-js
- @capacitor/core (mobile)
- @tanstack/react-query
- react-router-dom

### Supabase Tables Expected
- users
- subscriptions
- notes
- flashcards
- quizzes
- achievements
- exam_questions
- resources
- groups

---

## Progress Log

### Day 1 - 2026-03-28
- [x] Cloned repository
- [x] Analyzed structure (230 files)
- [x] Identified tech stack
- [x] Created this plan
- [x] Added lifetime plan to pricing (₦50,000)
- [x] Updated Upgrade.tsx to include lifetime plan option
- [ ] Running dev server (npm issues)
- [ ] Testing changes

### Changes Made
1. **src/lib/paystackConfig.ts** - Added lifetime plan pricing (₦50,000 one-time)
2. **src/pages/Upgrade.tsx** - Added lifetime plan tier with one-time payment flow

### TODO - Next Session
- [ ] Fix Store empty state - needs seeded resources in Supabase
- [ ] Test PWA - appears to be properly configured already
- [ ] Push changes to GitHub
- [ ] Continue with other improvements

