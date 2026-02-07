

# Chat Fixes, Reply Feature, and Career Section Overhaul

## Part 1: Fix Chat Message Input + Add Reply Feature

### Problem: Input form not showing
The `ChatRoom` component renders the input form correctly at line 220-234, but when used inside `Chat.tsx` (the DM page) and `GroupChat.tsx`, the parent container height constraints may clip the input. The `Chat.tsx` page wraps `ChatRoom` in a `div` with `flex-1 overflow-hidden` but `ChatRoom` itself uses `min-h-[400px]` and `flex flex-col h-full` -- the issue is likely the ScrollArea consuming all space. Will fix the layout to ensure the input is always visible with `flex-shrink-0`.

### Reply-to-message feature
- Add `reply_to_id` column to the `messages` table (UUID, nullable, references messages.id)
- Update `ChatRoom` to track a `replyingTo` message state
- Show a reply preview bar above the input when replying
- On each message bubble, add a swipe gesture (mobile) or hover reply button (desktop) to trigger reply
- Display replied-to message as a compact quote above the message content

### Database Migration
```sql
ALTER TABLE messages ADD COLUMN reply_to_id UUID REFERENCES messages(id);
```

### Files Modified
- `src/components/chat/ChatRoom.tsx` -- fix layout, add reply UI, swipe/hover to reply
- `src/pages/Chat.tsx` -- ensure container height is correct
- `src/pages/GroupChat.tsx` -- ensure container height is correct

---

## Part 2: Career Section Overhaul

### 2A: Resume Builder (World-Class)

Complete rewrite with:
- **10 professional templates**: Classic, Modern, Minimal, Creative, Executive, Tech, Academic, Compact, Bold, Elegant
- **Template preview and selection** with visual thumbnails
- **Structured sections**: Contact Info, Summary, Education, Experience, Skills, Projects, Certifications, Languages
- **Add/remove/reorder items** in each section
- **AI-powered summary generation** (existing, will keep)
- **Export options**: PDF print (via iframe), HTML download, plain text download
- **Live preview** panel showing the resume in the selected template
- **Skills management**: Add custom skills, remove skills, skill levels

### 2B: Jobs & Internships (Combined Tab)

Rename "Internships" tab to "Jobs & Internships" with two modes:

**Mode 1: AI-Matched (existing, improved)**
- Based on user's skills from courses
- AI suggests relevant positions

**Mode 2: Live Job Search**
- Search input with query field
- Use the Firecrawl connector (or a free scraping approach via the `ai-study` edge function) to search for real job/internship listings
- Since no external job API keys are available, the approach will use the AI model to perform web-aware searches and return structured results with links
- Filters: Location, Job Type (internship/full-time/part-time), Remote/On-site
- Display results with title, company, location, description, and "Apply" link

**Skills Management:**
- Users can add custom skills (not just from courses)
- Remove skills with X button on each skill chip
- Skills persist (stored in component state, populated from courses + manual additions)

### 2C: Career Page Layout Update
- Change tabs from 3 to 4: "Why It Matters", "Resume", "Jobs & Internships" (was "Internships"), plus keep the structure clean

### Files Created
- `src/components/career/ResumeTemplates.tsx` -- template definitions and preview renderer
- `src/components/career/ResumePreview.tsx` -- live preview component
- `src/components/career/JobSearch.tsx` -- live job search component

### Files Modified
- `src/components/career/ResumeBuilder.tsx` -- complete rewrite with templates, sections, export
- `src/components/career/InternshipMatcher.tsx` -- add jobs, search mode, skill management
- `src/pages/Career.tsx` -- update tab labels
- `supabase/functions/ai-study/index.ts` -- add `job_search` mode for AI-powered job listing generation

---

## Technical Details

### Resume Templates (10 templates)
Each template is a function that takes resume data and returns styled HTML for PDF/print output. Templates differ in layout, color scheme, typography, and section arrangement. The preview is rendered in an iframe for isolation.

### Job Search Implementation
Since there are no job API connectors available, the approach will use the existing AI edge function with a new `job_search` mode. The AI will generate realistic, current job listings based on the search query, with instructions to include real company names and realistic details. A disclaimer will note these are AI-suggested positions and users should verify on actual job boards. Each listing will include a Google search link to help users find the actual posting.

### Reply Feature Technical Flow
1. User long-presses (mobile) or hovers and clicks reply icon (desktop) on a message
2. `replyingTo` state is set with the message object
3. A compact preview bar appears above the input showing the quoted message
4. When sending, `reply_to_id` is included in the insert
5. Messages with `reply_to_id` show a quoted message block above their content
6. The original replied-to message is fetched and cached in the messages list

