# 06 — CoursePage

**Web reference:** `src/pages/CoursePage.tsx`

Single course detail with notes, study activities, and progress.

## Sections

- Header: course icon + name + edit/delete menu (`...` opens action sheet)
- Progress bar (uses `useCourseProgress`)
- Tabs: **Notes** | **Flashcards** | **Quizzes** | **Activity**
- Each tab's list is a separate component (port from web `CourseCard`/`StudyStatistics`)

## Tabs implementation

Use `react-native-tab-view` or a custom tab strip with state. Animate via Moti.

## Add note FAB

Same as SmartNotes but pre-fills `course_id`.

## Acceptance

- [ ] All 4 tabs render real data
- [ ] Editing course name persists
- [ ] Deleting course (with confirmation) removes it
