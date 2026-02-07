
# Fix Resume Focus, Subscription Tiers, Ads, Chat Gating, and Reply Navigation

## 1. Fix Resume Builder Input Focus Loss

The `InputRow` component is defined as a nested function inside `ResumeBuilder` (line 136). Every keystroke triggers a re-render, which recreates `InputRow` as a new component type, causing React to unmount/remount the input and lose focus.

**Fix**: Move `InputRow` outside the `ResumeBuilder` component as a standalone component.

**File**: `src/components/career/ResumeBuilder.tsx`

---

## 2. Subscription Tiers (3-Tier Model)

### Tier Structure

```text
+-------------------------+----------+-----------------+-----------------+
| Feature                 | Free     | Plus (N1,500/mo)| Pro (N2,500/mo) |
+-------------------------+----------+-----------------+-----------------+
| AI calls/day            | 5        | 20              | Unlimited       |
| Quizzes/day             | 3        | 10              | Unlimited       |
| Flashcards/day          | 10       | 30              | Unlimited       |
| Notes/day               | 2        | 8               | Unlimited       |
| DM Chat                 | Yes      | Yes             | Yes             |
| Group Chat              | No       | Yes             | Yes             |
| Resume templates        | 3        | 7               | All 10          |
| Job searches/day        | 3        | 10              | Unlimited       |
| Advanced AI tools       | No       | No              | Yes             |
| Ads                     | Yes      | No              | No              |
+-------------------------+----------+-----------------+-----------------+
```

### Global Kill Switch

Create `src/lib/subscriptionConfig.ts`:
- `SUBSCRIPTION_ENABLED = true` -- when `false`, all users get full access regardless of plan

### Files Modified
- `src/hooks/useSubscription.ts` -- Add `plus` tier, `isPlus`, `canUseGroupChat` (separate from `canUseChat`), `showAds`, import the toggle
- `src/pages/Upgrade.tsx` -- 3-tier pricing UI (Free, Plus, Pro) with plan comparison

---

## 3. Ads Feature for Free Users

Create `src/components/ads/AdBanner.tsx` -- a banner ad component that shows contextual, non-intrusive ads to free-tier users only. Uses the `useSubscription` hook to check `showAds`. When `SUBSCRIPTION_ENABLED` is `false`, ads are hidden.

**Ad placement locations** (added to existing layouts):
- `src/components/layout/AppLayout.tsx` -- a sticky banner ad above the bottom nav
- `src/pages/Dashboard.tsx` -- inline ad card between dashboard widgets

The ads will be placeholder/house ads promoting the upgrade to Plus/Pro (self-promotional). This avoids needing an external ad network. Each ad shows a compelling upgrade message with a link to `/upgrade`.

---

## 4. Chat Access Gating

- **DMs (`src/pages/Chat.tsx`)**: Allowed for ALL tiers (free, plus, pro) -- no gate needed
- **Group Chat (`src/pages/GroupChat.tsx`)**: Gate for Plus/Pro only. Free users see an `UpgradePrompt` when trying to access group chat
- **Social page group actions**: The "Join Group" / "Create Group" buttons in the Social tab should also show the gate for free users

### Files Modified
- `src/pages/GroupChat.tsx` -- Add subscription check, show UpgradePrompt if free tier
- `src/components/social/StudyGroups.tsx` -- Gate "Create Group" and "Join Group" for free users

---

## 5. Chat Reply Navigation (Scroll to Original)

When a user clicks the quoted reply preview in a message bubble, scroll to and highlight the original message.

### Implementation in `src/components/chat/ChatRoom.tsx`:
- Add `id={`msg-${message.id}`}` attribute to each message div
- Make reply quote clickable with `onClick` handler
- Use `scrollIntoView({ behavior: 'smooth', block: 'center' })` on click
- Add a brief highlight animation (yellow flash) via a temporary CSS class

---

## 6. Feature Gating Across the App

Add subscription checks to key pages:
- `src/pages/AITutor.tsx` -- Check `canUseAI` before AI session
- `src/pages/Quizzes.tsx` -- Check `canCreateQuiz` before quiz generation
- `src/pages/SmartNotes.tsx` -- Check `canCreateNote` before saving
- `src/pages/Flashcards.tsx` -- Check `canCreateFlashcard` before generating

Each shows `UpgradePrompt` (compact variant) with remaining uses when approaching limit.

---

## Summary of All Files

### New Files (2)
- `src/lib/subscriptionConfig.ts` -- Global subscription toggle
- `src/components/ads/AdBanner.tsx` -- Self-promo ad banner component

### Modified Files (11)
- `src/components/career/ResumeBuilder.tsx` -- Move InputRow outside component
- `src/hooks/useSubscription.ts` -- 3-tier model, group chat permission, showAds flag, kill switch
- `src/pages/Upgrade.tsx` -- 3-tier pricing UI
- `src/components/subscription/UpgradePrompt.tsx` -- Support tier-specific messaging (Plus vs Pro)
- `src/components/chat/ChatRoom.tsx` -- Reply navigation with scroll and highlight
- `src/pages/GroupChat.tsx` -- Gate group chat for Plus/Pro only
- `src/components/social/StudyGroups.tsx` -- Gate group creation/joining
- `src/components/layout/AppLayout.tsx` -- Add ad banner placement
- `src/pages/AITutor.tsx` -- Subscription gate
- `src/pages/Quizzes.tsx` -- Subscription gate
- `src/pages/SmartNotes.tsx` -- Subscription gate
- `src/pages/Flashcards.tsx` -- Subscription gate
