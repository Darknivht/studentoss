

# Fix Payments, Add Install Button, Build Admin Documentation, and Google Ads

## Readiness Score: 78/100

Here's the breakdown:
- **Core features** (study tools, AI tutor, notes, flashcards, quizzes): 90% ready
- **Payment system**: Currently broken due to a configuration typo -- will be fixed in this update
- **Exam prep**: Functional with recent fixes
- **Social features**: Working (chat, groups, friends)
- **PWA/offline**: Recently added, functional
- **Admin panel**: Functional with recent fixes
- **Marketing/documentation**: 0% -- will be built in this update
- **Google Ads monetization**: 0% -- will be added in this update

**What's blocking launch:** The payment system typo (critical fix below), missing admin documentation, and no ad revenue for free users.

---

## 1. Fix Payment System (Critical)

**Root cause found:** The secret is stored as `PAYSTACK_SERCET_KEY` (typo: "SERCET") but the edge function reads `PAYSTACK_SECRET_KEY`. This causes every payment verification to fail.

**Fix:** Update the edge function to read from `PAYSTACK_SERCET_KEY` (the actual stored name) instead. This is the fastest, safest fix.

**Yearly expiry:** The existing code already correctly adds 1 year for yearly plans and 1 month for monthly plans. Once the secret name is fixed, this will work as intended.

**File:** `supabase/functions/verify-payment/index.ts` -- change line 24 from `PAYSTACK_SECRET_KEY` to `PAYSTACK_SERCET_KEY`.

---

## 2. Add Install Button to Profile Page

Add a "Get the App" card to the Profile page (between the Subscription Badge and Streak Calendar) that links to `/install`.

**File:** `src/pages/Profile.tsx` -- add a Download/Install link card with a smartphone icon.

---

## 3. Google Ads Integration for Free Plan

Add Google AdSense banner ads that show only to free-tier users. This generates real ad revenue from users who don't pay.

**Implementation:**
- Create a `GoogleAdBanner` component that renders a Google AdSense ad unit
- Replace the current self-promotional `AdBanner` with the real Google ad for free users
- The ad slot ID will need to be configured once you have a Google AdSense account
- Ads will automatically hide for Plus/Pro subscribers (existing logic)

**Files:**
- New: `src/components/ads/GoogleAdBanner.tsx`
- Update: `src/components/ads/AdBanner.tsx` to show Google ads instead of self-promo
- Update: `index.html` to load the AdSense script

**Note:** You'll need a Google AdSense account and an ad unit ID. I'll add a placeholder that you can swap with your real ID.

---

## 4. Hidden Admin Documentation Portal

Build a multi-page documentation site at `/docs` that is password-protected (using the existing `ADMIN_PANEL_PASSWORD`). Only you and your team can access it.

### Pages to create:

**a) `/docs` -- Documentation Hub (main index)**
- Overview of StudentOS
- Quick links to all doc sections
- Password gate on entry

**b) Platform Architecture page**
- Tech stack overview
- Database schema summary
- Edge functions list
- Authentication flow

**c) Feature Guide page**
- Every feature explained with how it works
- Subscription tiers and what each unlocks
- AI integration details

**d) Business & Revenue page**
- Pricing model breakdown
- Payment flow (Paystack integration)
- Google Ads revenue model
- Growth metrics to track

**e) Launch & Marketing Playbook page**
- Step-by-step launch checklist
- Marketing channels and strategies
- Social media plan
- School partnership approach
- Influencer outreach template
- App Store listing tips

**f) Admin Guide page**
- How to use the admin panel
- Adding exam questions
- Managing resources
- Viewing user analytics

### Files:
- New: `src/pages/docs/DocsLayout.tsx` (password-protected wrapper)
- New: `src/pages/docs/DocsHome.tsx`
- New: `src/pages/docs/DocsArchitecture.tsx`
- New: `src/pages/docs/DocsFeatures.tsx`
- New: `src/pages/docs/DocsBusiness.tsx`
- New: `src/pages/docs/DocsLaunchPlaybook.tsx`
- New: `src/pages/docs/DocsAdminGuide.tsx`
- Update: `src/App.tsx` to add `/docs/*` routes

---

## 5. Launch & Marketing Plan (embedded in docs)

The Launch Playbook documentation page will include:

1. **Pre-Launch Checklist**
   - Switch Paystack from test to live keys
   - Set up Google AdSense account
   - Set up custom domain
   - Test all payment flows end-to-end
   - Publish to app stores (PWA listing)

2. **Marketing Channels**
   - School WhatsApp groups and class reps
   - TikTok/Instagram student study content
   - Twitter/X education community
   - Student ambassadors program
   - School partnerships (bulk licensing)

3. **Growth Strategy**
   - Free tier as acquisition funnel
   - Exam season push campaigns
   - Referral/invite code system
   - Content marketing (study tips blog)

4. **Revenue Projections Model**
   - Google Ads CPM estimates for Nigerian traffic
   - Conversion funnel: Free to Plus to Pro
   - Target metrics for first 90 days

---

## Technical Summary

| Change | Files | Impact |
|--------|-------|--------|
| Fix payment secret typo | 1 edge function | Critical -- unblocks all payments |
| Install button on profile | 1 file | Small UI addition |
| Google Ads integration | 3 files | New revenue stream |
| Documentation portal | 8 new files + 1 update | Admin-only, hidden pages |

## Sequencing

1. Fix payment (immediate unblock)
2. Profile install button (quick win)
3. Google Ads component (revenue)
4. Documentation portal (all pages in parallel)

