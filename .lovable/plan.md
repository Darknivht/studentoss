

# Plan & Social Sections: Comprehensive Upgrade

## Current State Assessment

### Plan Section
The Plan page has 3 tabs (Schedule, Focus, Progress) with:
- **Smart Scheduler**: Functional goal/exam tracker with CRUD, XP on completion
- **Weakness Detector**: Per-course analysis based on quiz scores, notes, flashcards, focus time
- **Pomodoro Timer**: Exists in Focus tab
- **Lo-Fi Radio**: 4 streaming stations with play/pause/volume
- **Sleep Calculator**: Calculates bedtimes based on wake-up time
- **Progress Tracker**: Per-course stats grid with overall stats

The Plan section is solid but could benefit from a study planner/timetable view and better visual presentation.

### Social Section
The Social page has 6 tabs across 2 rows (Ranks, Friends, Challenges, Compete, Groups, Discover):
- **Leaderboard**: Weekly and all-time XP rankings -- works but weekly XP may show 0 if weekly_xp records aren't being updated consistently
- **FriendsList**: Search, friend requests, accept/decline, DM links
- **StudyChallenges**: Daily/weekly challenges with progress bars but **claim button missing** -- XP can be claimed multiple times with no tracking
- **ChallengeAFriend**: Only shows a toast -- no actual challenge/quiz is generated or tracked (broken)
- **StudyGroups**: Create, join by code, public/private groups -- functional
- **GroupChat**: Chat + Resources + Members tabs -- resources list but no viewer
- **PeerFinder**: Global user discovery with friend request button
- **ChatRoom**: Text-only messages, no media upload, basic UI

## Issues Found

1. **Challenge a Friend is fake** -- just shows a toast, no challenge table, no quiz generation, no tracking
2. **StudyChallenges XP claim has no guard** -- users can claim XP infinitely by reloading
3. **Weekly leaderboard may show 0** -- weekly_xp records need to be consistently written when XP is earned
4. **No profile image upload** -- Profile page shows initials only, no avatar upload
5. **Chat has no media/image support** -- text only
6. **Group resources can't be viewed** -- listed but not clickable/viewable
7. **Social page has 6 tabs in 2 rows** -- confusing UX, needs consolidation
8. **No challenge completion XP propagation** -- challenge XP isn't reflected in weekly_xp table

## Implementation Plan

### Phase 1: Database Schema Changes

**New table: `peer_challenges`**
- id, challenger_id, challenged_id, note_id, quiz_data (jsonb), challenger_score, challenged_score, status (pending/active/completed/declined), xp_reward, created_at, expires_at

**New table: `challenge_claims`**
- id, user_id, challenge_id (text like 'daily_notes'), claimed_date, xp_earned -- prevents double-claiming

**Storage bucket: `avatars`** (public)
- RLS policies for users to upload/update their own avatar

**Add `image_url` column to `messages` table**
- For media uploads in chat

### Phase 2: Profile Image Upload

- Add camera/upload button on Profile page avatar circle
- Upload to `avatars` storage bucket
- Update `profiles.avatar_url` with public URL
- Avatar shows in chats, leaderboard, friends list, group members, peer finder (already reads avatar_url)

### Phase 3: Fix Peer Challenges (Challenge a Friend)

- Create actual challenge flow:
  1. Challenger selects friend + note
  2. System generates a 5-question quiz via AI from the note content
  3. Stores quiz in `peer_challenges` table
  4. Challenged user sees pending challenge in Challenges tab
  5. Both users complete the quiz, scores compared
  6. Winner gets bonus XP (e.g., 100 XP), loser gets 50 XP
- Add incoming/outgoing challenge lists
- Add challenge expiry (48 hours)

### Phase 4: Fix Challenge XP System

- Add `challenge_claims` table to track which challenges have been claimed
- Modify StudyChallenges `claimReward` to:
  1. Check if already claimed today/this week
  2. Insert claim record
  3. Update `profiles.total_xp`
  4. Update `weekly_xp` table (upsert current week)
- Add more challenge variety:
  - "Early Bird" -- study before 8am
  - "Streak Keeper" -- maintain 3-day streak
  - "Social Butterfly" -- send 5 messages
  - "Group Contributor" -- share a resource
  - "Challenge Champion" -- win a peer challenge
  - "Perfect Score" -- get 100% on a quiz

### Phase 5: Fix Weekly Leaderboard

- Create a helper function `updateWeeklyXP(userId, xpAmount)` in a shared hook
- Call it from every XP-granting action:
  - Challenge claims
  - Peer challenge completion
  - Study goal completion
  - Quiz completion
  - Pomodoro session completion
- This ensures weekly_xp stays in sync with total_xp

### Phase 6: Chat UI Improvements + Media Upload

- Add image/file attachment button to ChatRoom input bar
- Upload media to a new `chat-media` storage bucket
- Store image_url in messages table
- Display images inline in chat bubbles with lightbox on tap
- Add typing indicator animation
- Add message timestamps grouped by day ("Today", "Yesterday", etc.)
- Show read receipts for DMs
- Improve bubble styling with tails and better spacing

### Phase 7: Group Chat Improvements

- **Resource Viewer**: Click shared note to open NoteViewerDialog or navigate to note
- **Resource Viewer for courses**: Click shared course to navigate to course page
- **Invite system polish**: Add "Share invite" button using native share API (navigator.share)
- **Join flow**: After joining via code, auto-navigate to group chat
- **Member avatars**: Use Avatar component with uploaded profile images instead of plain initials

### Phase 8: Social Page UX Consolidation

- Reduce from 6 tabs (2 rows) to 4 tabs (1 row): **Compete**, **Friends**, **Groups**, **Discover**
- Merge Leaderboard into Compete tab (leaderboard + challenges + peer challenges)
- Friends tab stays the same
- Groups tab stays the same
- Discover tab (PeerFinder) stays the same

### Phase 9: Plan Section Enhancements

- Add a **Study Timetable** view in Schedule tab -- weekly calendar grid showing scheduled study sessions
- Add **Study Streak Widget** to Progress tab showing current streak prominently
- Add motivational quotes rotation in Focus tab

---

## Technical Details

### Database Migrations

```sql
-- peer_challenges table
CREATE TABLE peer_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL,
  challenged_id UUID NOT NULL,
  note_id UUID REFERENCES notes(id),
  quiz_data JSONB NOT NULL DEFAULT '[]',
  challenger_score INT,
  challenged_score INT,
  status TEXT NOT NULL DEFAULT 'pending',
  xp_reward INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + interval '48 hours'
);

-- challenge_claims table
CREATE TABLE challenge_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_id TEXT NOT NULL,
  claimed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  xp_earned INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, challenge_id, claimed_date)
);

-- Add image_url to messages
ALTER TABLE messages ADD COLUMN image_url TEXT;

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', true);

-- RLS for all new tables and buckets
```

### Files to Create/Modify

**New files:**
- `src/hooks/useWeeklyXP.ts` -- shared XP update helper
- `src/components/social/PeerChallengesList.tsx` -- incoming/outgoing challenges UI
- `src/components/social/PeerChallengeQuiz.tsx` -- take-challenge quiz UI
- `src/components/profile/AvatarUpload.tsx` -- avatar upload component
- `src/components/chat/MediaUpload.tsx` -- chat media attachment
- `src/components/chat/ImageMessage.tsx` -- inline image in chat
- `src/components/planning/StudyTimetable.tsx` -- weekly timetable view

**Modified files:**
- `src/pages/Profile.tsx` -- add avatar upload
- `src/pages/Social.tsx` -- consolidate to 4 tabs
- `src/components/social/ChallengeAFriend.tsx` -- real challenge flow
- `src/components/social/StudyChallenges.tsx` -- add claim guards + more challenges
- `src/components/social/Leaderboard.tsx` -- fix weekly XP display
- `src/components/chat/ChatRoom.tsx` -- media upload, improved UI
- `src/components/social/GroupDetail.tsx` -- clickable resource viewer
- `src/pages/GroupChat.tsx` -- clickable resources, avatar images
- `src/components/social/StudyGroups.tsx` -- native share for invites
- `src/pages/Plan.tsx` -- add timetable
- `supabase/functions/ai-study/index.ts` -- add challenge quiz generation mode

