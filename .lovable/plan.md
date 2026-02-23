

# Resource Store + Admin Upload System

## Overview

Build a **Resource Store** where students can browse textbooks, books, and YouTube videos organized by grade, subject, and category. You (the admin) get a secret, password-protected page to upload and manage resources. YouTube videos get their own integrated section with search.

---

## Architecture

### Two Main Sections

1. **Books/Textbooks Store** -- You upload PDFs/files, tagged by grade + subject. Students browse and download.
2. **YouTube Videos** -- A dedicated section where students can search YouTube videos (using the existing RapidAPI integration) and also see curated videos you've added via the admin panel.

### Admin Access

- A hidden route (`/admin-resources`) protected by a hardcoded password stored as a Cloud secret called `ADMIN_PANEL_PASSWORD`
- The password is checked client-side against the secret fetched via a tiny edge function (so it's never in the codebase)
- You can change the password anytime by updating the secret -- no code changes needed

---

## Database Changes

### New table: `store_resources`

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| title | text | Resource name |
| description | text | Optional description |
| category | text | "textbook", "book", "video", "past_paper" |
| subject | text | e.g., "Mathematics", "English" |
| grade_level | text | e.g., "9th", "10th", "freshman" |
| file_url | text | Storage URL (for books/PDFs) |
| youtube_url | text | YouTube link (for videos) |
| thumbnail_url | text | Cover image URL |
| author | text | Book author or channel name |
| is_free | boolean | Whether resource is free or requires Plus/Pro |
| required_tier | text | "free", "plus", or "pro" |
| download_count | integer | Track popularity |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

**RLS**: All authenticated users can SELECT. Only the admin edge function can INSERT/UPDATE/DELETE (via service role key).

### New storage bucket: `store-resources`

Public bucket for uploaded textbooks and book files.

---

## New Files

### Pages
- **`src/pages/Store.tsx`** -- Main store page with two tabs: "Books" and "Videos"
  - Books tab: Filter by grade, subject, category. Card grid showing cover, title, author, grade badge
  - Videos tab: YouTube search bar + curated videos grid. Clicking plays in an embedded player
  - Subscription gating: Some resources marked as Plus/Pro only
- **`src/pages/AdminResources.tsx`** -- Secret admin page
  - Password gate (input field, verified via edge function)
  - Once unlocked: form to add resources (title, description, category, subject, grade, file upload, YouTube URL, tier requirement)
  - Table of existing resources with edit/delete actions
  - Bulk management capabilities

### Edge Functions
- **`supabase/functions/admin-verify/index.ts`** -- Verifies the admin password against the `ADMIN_PANEL_PASSWORD` secret. Returns a simple `{ valid: true/false }`
- **`supabase/functions/admin-resources/index.ts`** -- CRUD operations for resources using the service role key (bypasses RLS). Validates the admin password on every request

### Components
- **`src/components/store/ResourceCard.tsx`** -- Card component for books/textbooks
- **`src/components/store/YouTubeSection.tsx`** -- YouTube search + curated videos with embedded player
- **`src/components/store/ResourceFilters.tsx`** -- Grade, subject, category filter bar

---

## Navigation

- Add "Store" to the bottom nav (replace or add a 6th item using a `ShoppingBag` or `Library` icon)
- Route: `/store`
- Admin route: `/admin-resources` (not linked anywhere in the UI -- you access it directly by URL)

---

## Security Model

1. **Admin password**: Stored as Cloud secret `ADMIN_PANEL_PASSWORD`, never in code
2. **Admin edge function**: Checks password server-side before any write operation
3. **RLS on store_resources**: SELECT for all authenticated users; no INSERT/UPDATE/DELETE policies (admin writes bypass RLS via service role)
4. **Resource tier gating**: Books marked `required_tier: "pro"` show a lock overlay and redirect to upgrade page
5. **No client-side admin check**: Password verification always goes through the edge function

---

## User Flow

1. Student opens Store tab in bottom nav
2. Sees "Books" and "Videos" tabs
3. Books tab: Filters by their grade (auto-detected from profile), browses resources, downloads free ones or sees upgrade prompt for locked ones
4. Videos tab: Searches YouTube or browses curated educational videos, watches inline
5. Admin (you): Navigates to `/admin-resources`, enters password, uploads resources with metadata

---

## Technical Details

- YouTube search reuses the existing `RAPIDAPI_KEY` secret for the YouTube Search API
- Book files uploaded to `store-resources` storage bucket via the admin edge function
- The admin page uses a simple `useState` password gate -- once verified via edge function, the admin UI renders
- Grade auto-detection pulls from the user's `profiles.grade_level` to pre-filter results
- Download count incremented via a simple RPC or direct update when a user downloads

