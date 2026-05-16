# 15 — Career

> **Web source of truth:** `src/pages/Career.tsx`
> **RN target:** `src/screens/CareerScreen.tsx`
> **Route name:** `Career`
> **Auth:** Required
> **Bottom nav visible:** Yes

---

## 1. Purpose

Career tools: Resume Builder, Resume Templates, Job Search, Internship Matcher, Real-World Why.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `supabase.from('resumes').select().eq('user_id', user.id)`
- `supabase.functions.invoke('job-search', { body: { query, location } })`
- `useSubscription()` for template gating

## 3. Layout (top → bottom)

Top tabs: Resume | Jobs | Internships | Why. Each renders the relevant tool.

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| ResumeBuilder | port section-by-section using InputRow component | accordion sections (Personal, Education, Experience, Skills, Projects) |
| ResumePreview | render via WebView with HTML template, or native rendering using Skia/SVG | export to PDF via `expo-print` |
| ResumeTemplates | grid of template cards with lock badges per tier | |
| JobSearch | search bar + result cards | infinite scroll |

## 5. Animations

- Section expand/collapse with `LayoutAnimation`
- Template selection scales + ring
- Job card swipe to save

## 6. Interactions & navigation

- Resume changes auto-save (debounced 1.5s)
- 'Preview' opens full-screen modal
- 'Export PDF' → `expo-print.printToFileAsync` then `expo-sharing`

## 7. Edge cases (MUST handle)

- Template locked → FeatureGate
- Empty section → don't render in PDF
- Job search rate-limited → 'Try again in 30s' toast

## 8. Native enhancements (mobile-only wins)

- PDF generation native (no html2canvas!)
- Share resume via system share sheet

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] Resume CRUD + autosave
- [ ] PDF export works on iOS & Android
- [ ] Job search returns results

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

