

# Improvements: PDF Exports, Admin Analytics, Student Exam Analytics, Docs & Marketing

## 1. Real PDF Downloads (Replace HTML exports)

**Problem:** All downloads currently produce `.html` files. Users want actual `.pdf` files.

**Solution:** Install `html2pdf.js` (lightweight, client-side, no server needed) and update `ExportUtils.tsx` to generate real PDF blobs.

**Changes:**
- Install `html2pdf.js` package
- `src/components/export/ExportUtils.tsx`: Replace `downloadAsHTML` internals to use `html2pdf.js` -- convert the styled HTML doc to a PDF blob and trigger download as `.pdf`. Keep the same function signature so all 10+ callers work without changes.
- `printMarkdownContent` will open a print dialog using the same HTML (unchanged behavior)
- Resume `exportPDF` in `ResumeBuilder.tsx`: Replace the iframe+print hack with `html2pdf.js` to download an actual PDF file
- Resume `exportHTML` stays as-is for users who want raw HTML

## 2. Enhanced Student-Facing Exam Analytics

**Problem:** Current `ExamPerformance.tsx` only shows overall accuracy and per-topic breakdown with a line chart. Needs richer visualizations.

**Changes to `src/components/exam-prep/ExamPerformance.tsx`:**
- Add **Radar Chart** (from recharts) showing per-topic scores as a spider/radar for visual weak-area identification
- Add **Session History Table** showing last 10 sessions with date, questions attempted, accuracy, time spent
- Add **Streak & Improvement** summary cards: total sessions, best score, average score, improvement trend (comparing first 5 vs last 5 sessions)
- Add **Time Analysis**: average time per question, fastest/slowest topics
- Add **Difficulty Breakdown**: accuracy by easy/medium/hard questions (requires fetching `exam_questions.difficulty` joined with attempts)

## 3. Improved Admin Pie Chart & More Admin Features

**Changes to `src/pages/AdminResources.tsx`:**

**Pie Chart improvements:**
- Use distinct, vibrant colors (green for Free, blue for Plus, purple for Pro) instead of CSS variable colors that are hard to see
- Add percentage labels and a legend below the chart
- Make it larger (200px height instead of 160px)

**New admin features:**
- **Revenue Estimator card**: Calculate estimated monthly revenue = (Plus users × ₦2000) + (Pro users × ₦5000), show in a card
- **Content Health summary**: Questions without explanations count, subjects with < 10 questions
- **User Growth Rate**: Show week-over-week growth percentage
- **Export analytics as CSV**: Button to download summary stats as CSV
- **Quick user count by grade level**: Group profiles by `grade_level` and show distribution

## 4. Updated Docs: Admin Guide, Features, Marketing Playbook

**`src/pages/docs/DocsAdminGuide.tsx`:**
- Add section for new analytics features (revenue estimator, CSV export, user growth)
- Document the block/unblock user workflow
- Document payment duration selector (monthly/yearly)

**`src/pages/docs/DocsFeatures.tsx`:**
- Add entry for enhanced exam analytics (radar chart, session history, difficulty breakdown)
- Update export description: "Downloads as PDF" instead of HTML

**`src/pages/docs/DocsLaunchPlaybook.tsx` -- Expanded Marketing:**
- Add **"Free Tier Strategy"** section: Yes, keep free tier generous -- it's your growth engine. Free users become ambassadors. Key insight: give enough value for free that students tell friends, gate advanced features (unlimited AI, exam prep) behind paid tiers
- Add **"University/Polytechnic Marketing"** section (since you're in 3rd year):
  - Start with YOUR department -- demo in class, get lecturer buy-in
  - Create a "Study Group Challenge" -- first group to hit 1000 XP gets free Pro for a semester
  - Partner with SUG (Student Union) for official endorsement
  - Target exam period (2-3 weeks before) with urgency messaging
  - Put up posters in libraries, hostels, lecture halls with QR codes
- Add **"Referral Program"** section: Each user gets a unique invite code (already in DB). Reward: referrer gets 1 week Pro free per 3 referrals
- Add **"Content Marketing"** section: Create a WhatsApp channel posting daily study tips with app screenshots, Create YouTube shorts showing "How to pass JAMB with AI"
- Add **"Pricing Psychology"** section: Anchor on yearly pricing (show monthly as expensive), offer first month at 50% off, create urgency with "Exam season special"
- Add **"Metrics to Track Weekly"** checklist: New signups, DAU/WAU ratio, free→paid conversion, referral rate, feature adoption

## 5. Resume Export as PDF

**`src/components/career/ResumeBuilder.tsx`:**
- Replace `exportPDF` (currently uses iframe print dialog) with `html2pdf.js` for direct PDF download
- Label button as "Download PDF" instead of "Print PDF"

---

## Technical Summary

| Change | Files | Complexity |
|--------|-------|------------|
| PDF exports via html2pdf.js | ExportUtils.tsx, ResumeBuilder.tsx + install | Medium |
| Student exam analytics | ExamPerformance.tsx | Medium |
| Admin pie chart & features | AdminResources.tsx | Low-Medium |
| Docs updates | 3 docs files | Low |
| Marketing playbook expansion | DocsLaunchPlaybook.tsx | Low |

## Sequencing
1. Install html2pdf.js and update ExportUtils (all exports become PDF instantly)
2. Fix resume export to use html2pdf.js
3. Enhance ExamPerformance with radar chart, session history, difficulty breakdown
4. Improve admin pie chart colors and add revenue estimator + CSV export
5. Update all three docs pages

