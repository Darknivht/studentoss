

# Store Improvements + Bottom Nav Fix + Save as Note

## 1. Bottom Navigation -- All 6 Items

The current bottom nav only has 5 items (Home, Study, Store, Plan, Social). Career is missing. Update to show all 6 in proper order:

| Position | Icon | Label | Path |
|---|---|---|---|
| 1 | Home | Home | / |
| 2 | BookOpen | Study | /study |
| 3 | Library | Store | /store |
| 4 | Calendar | Plan | /plan |
| 5 | Users | Social | /social |
| 6 | Briefcase | Career | /career |

Reduce icon size and padding slightly so all 6 fit comfortably on mobile.

## 2. Save Resource as Note

Add a "Save as Note" button to each `ResourceCard`. When tapped:
- Creates a new note in the `notes` table with the resource title, description, subject, and a link to the file/video
- Shows a success toast with a link to go to Smart Notes
- The button is disabled if the resource is tier-locked
- For file-based resources, the note content will include the resource metadata and a download link
- For video resources, the note content will include the YouTube URL and video title

**Files changed**: `src/components/store/ResourceCard.tsx`

## 3. Store Page Improvements

- Add a count badge showing total resources found after filtering
- Add curated videos section in the Videos tab (shows admin-uploaded videos with category "video" from `store_resources`)
- Show a "My Grade" chip button that auto-filters to the user's grade level
- Better empty state with suggestions

**Files changed**: `src/pages/Store.tsx`, `src/components/store/YouTubeSection.tsx`

## 4. ResourceCard Improvements

- Add the "Save as Note" button (bookmark icon)
- Add a subtle share button
- Better visual hierarchy with gradient overlay on thumbnail
- Show "FREE" badge for free resources

**Files changed**: `src/components/store/ResourceCard.tsx`

---

## Technical Details

### BottomNav changes (`src/components/layout/BottomNav.tsx`)
- Add `Briefcase` import from lucide-react
- Add Career item: `{ icon: Briefcase, label: 'Career', path: '/career' }`
- Reduce padding from `px-4` to `px-2` on each NavLink so 6 items fit
- Reduce icon size from 22 to 20

### Save as Note logic (`src/components/store/ResourceCard.tsx`)
- Import `useAuth` and `Bookmark` icon
- Add `handleSaveAsNote` function that inserts into the `notes` table:
  - `title`: resource title
  - `content`: formatted markdown with description, author, subject, grade, and file/video link
  - `source_type`: "store"
  - `user_id`: from auth
- Add a bookmark button in the card actions row
- Show toast on success

### YouTubeSection curated videos (`src/components/store/YouTubeSection.tsx`)
- Fetch resources with `category = 'video'` from `store_resources` on mount
- Display them in a "Curated Videos" section above the search results
- Extract YouTube video ID from the stored URL for embedding

### Store page polish (`src/pages/Store.tsx`)
- Show "X resources found" count
- Add "My Grade" quick-filter button near the filters

