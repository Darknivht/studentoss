
Goal: fix four user-facing regressions in one pass: CBT sessions resetting, mobile PDF downloads producing screen-like output, Admin Exams > PDF Import missing controls, and Admin Exams > Questions blank screen; plus hardware back behavior on mobile.

1) Findings from code inspection (root causes)

A. CBT session loss/reset
- `MultiSubjectCBT.tsx` and `MockExamMode.tsx` keep all exam state only in component memory.
- If users navigate away, trigger back behavior, or app reloads, exam state is lost and they start over.
- No session-recovery flow exists.
- No hardware back interception exists for active exam sessions.

B. Mobile back button exits app / unexpected navigation
- There is currently no global native mobile back handler.
- The app does not currently define route-aware back behavior for native Android back presses.

C. PDF download issue on mobile
- Export utility (`ExportUtils.tsx`) currently uses hidden iframe + `window.print()`.
- On some mobile/browser combinations this yields viewport-like output behavior instead of a clean generated-content PDF flow.
- Many callers still pass `.html` filenames and at least one UI still tells users to open HTML then print.

D. Admin Exams regressions
- Missing subject selector in PDF Import:
  - Subject selector is rendered only for `topics` and `questions`, not `pdf-import`.
- Questions tab blank:
  - `AdminResources.tsx` uses multiple `<SelectItem value="">...` entries; Radix Select does not support empty item values, which can crash that section.

2) Implementation approach

A. Stabilize CBT sessions (no forced restart)
Files:
- `src/components/exam-prep/MultiSubjectCBT.tsx`
- `src/components/exam-prep/MockExamMode.tsx`

Plan:
- Add persistent draft state (local storage) keyed by exam mode + exam type + subject(s) + user.
- Autosave on:
  - answer changes
  - index/tab changes
  - timer ticks (throttled)
- Restore prompt on mount:
  - if unfinished draft exists, show “Resume previous exam” vs “Start new”.
- Clear draft on successful submit and on confirmed manual exit.
- Add guarded exit:
  - if exam is in progress, show confirmation before leaving.
  - prevent accidental loss from single taps/back actions.

B. Mobile hardware back behavior
Files:
- new hook: `src/hooks/useMobileBackNavigation.ts` (or similar)
- `src/App.tsx` to register globally
- optional exam-specific override in CBT components

Plan:
- Add native back listener for mobile app runtime:
  - default behavior: navigate to previous route if possible
  - do not immediately exit app from in-app pages
- Exam-aware behavior:
  - when an exam is active, intercept back and require confirmation first.
- Keep behavior route-safe so normal browsing still feels expected.

C. Fix one-click PDF generation on mobile (content PDF, not screen-like output)
Files:
- `src/components/export/ExportUtils.tsx`
- call sites with user-facing text/filenames, at minimum:
  - `src/components/study/CheatSheetCreator.tsx`
  - `src/components/ai-tools/AIToolLayout.tsx`
  - (and any export buttons currently passing `.html` names)

Plan:
- Replace print/iframe-first export path with direct PDF file generation for markdown content.
- Keep API compatibility so existing callers still work:
  - `downloadAsHTML(...)` will internally generate PDF for backward compatibility.
  - `printMarkdownContent(...)` will use same PDF generation path.
- Ensure filename/title handling:
  - sanitize title
  - strip `.html` suffix if passed
  - always output `.pdf`
  - preserve generated-content titles (e.g., study plan subject title, AI output title, cheat sheet title).
- Update UI copy where needed (remove “open HTML and print to PDF” messaging).

D. Fix Admin Exams: PDF Import controls + Questions blank tab
File:
- `src/pages/AdminResources.tsx`

Plan:
- Show Subject selector for `pdf-import` section too.
- Fix Select values:
  - replace empty-string item values with sentinel values (`all_topics`, `all_difficulty`, `all_source`).
  - translate sentinel values to empty filters before sending requests.
- Add defensive guards in question rendering/filtering to avoid runtime crashes from malformed records.
- Keep current tab persistence behavior intact (`forceMount` remains).

3) Sequencing and dependencies

Step 1: Admin crash + missing controls (fastest unblock for admins)
- Fix selector rendering and empty SelectItem values first.
- This immediately restores Questions and PDF Import usability.

Step 2: CBT persistence and guarded exits
- Add draft autosave/restore for both mock and multi-subject CBT.
- Add exam exit confirmation logic.

Step 3: Global mobile back handling
- Add app-wide native back behavior and ensure exam-specific override still takes priority.

Step 4: PDF export engine hardening
- Switch export implementation to deterministic file PDF generation.
- Keep compatibility wrappers so existing features continue to work without large refactors.

4) Validation checklist (end-to-end)

Admin flow:
- Open Admin > Exams > Questions:
  - no blank screen
  - filters work
  - load/edit/delete still works.
- Open Admin > Exams > PDF Import:
  - both exam type and subject are selectable
  - upload button appears once file selected
  - import submission path still functions.

CBT flow:
- Start mock exam, answer some questions, leave route, return:
  - resume prompt appears
  - resume restores timer, answers, index.
- Start multi-subject CBT and switch tabs/questions:
  - autosave works
  - back press requires confirmation.
- Submit exam:
  - draft is cleared
  - results still save correctly.

Mobile back flow:
- On native mobile, press hardware back from multiple screens:
  - navigates to previous page instead of sudden exit.
- During active exam:
  - back press prompts before exit.

PDF flow:
- Export from Study Plan, Cheat Sheet, AI tools:
  - one tap downloads `.pdf`
  - file title matches generated content
  - output contains generated content (not screen-like capture behavior).

5) Notes on scope and data model

- No backend schema change is required for this fix set.
- CBT resume persistence will be local-device/session based initially (fast, low risk).
- If needed later, we can extend to cross-device recovery via backend draft storage.
