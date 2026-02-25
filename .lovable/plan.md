

# Mind Maps, Voice Mode, Audio Notes Upgrade + Cleanup Plan

## Current Website Readiness: ~62/100

**Exam Prep:** ~70/100 (strong after recent upgrades)
**Study Tools:** ~55/100 (many tools functional but shallow)
**Admin:** ~60/100 (recently enhanced)
**Focus/App Blocker:** ~40/100 (native-only features shown on web, confusing UX)

---

## Part 1: Interactive Mind Maps with Canvas (Major Rewrite)

The current ConceptLinking component is a basic 400px box with fixed-position nodes on an SVG -- no pan, no zoom, no expanding concepts, no real interaction.

**Rewrite `ConceptLinking.tsx` completely:**

- Replace fixed SVG+absolute-div layout with a proper pannable/zoomable canvas using CSS transforms and pointer events (no external library needed)
- Canvas state: `scale` (zoom), `offset` (pan position), managed via wheel events (zoom) and pointer drag on background (pan)
- Nodes become expandable: each node has `expanded` state. Clicking a node toggles its detail panel showing a short AI-generated explanation
- Hierarchical layout: center node = main topic, second ring = key concepts, third ring = sub-concepts. Use force-directed-like positioning with concentric circles
- Connection lines drawn as curved SVG paths (quadratic bezier) between nodes
- Node sizing: center node is largest, outer nodes smaller
- Touch support: pinch-to-zoom, drag to pan on mobile
- "Expand concept" on click: calls AI to generate 2-3 sub-concepts for that node, which appear as new connected nodes
- Color coding: different colors for different depth levels

**Technical approach:**
- Manage canvas transform with `useState<{x: number, y: number, scale: number}>`
- onWheel handler for zoom (clamped 0.3 to 3.0)
- onPointerDown/Move/Up on canvas background for panning
- Nodes rendered as absolutely positioned divs inside a transform container
- SVG overlay for connection lines (same transform)
- Node click: if not expanded, fetch AI explanation and add child nodes

---

## Part 2: Voice Mode Improvements

Current issues: basic Web Speech API, no conversation memory, no context awareness, robotic browser TTS.

**Enhancements to `VoiceMode.tsx`:**

- Add conversation context: let users optionally select a note or course before starting, so AI responses are contextual
- Add "conversation starters" when empty: suggested prompts like "Explain photosynthesis", "Quiz me on history", "Help me understand calculus"
- Add message actions: copy text, regenerate response
- Improve speech output: add voice selection (reuse AudioNotes voice picker pattern), speed control
- Add visual audio waveform animation while listening (CSS-based pulsing circles)
- Persist recent conversations to localStorage so users can resume
- Better error handling with retry buttons

---

## Part 3: Audio Notes Improvements

Current: generates summary then reads it. Basic but functional.

**Enhancements to `AudioNotes.tsx`:**

- Add "Read Full Note" option (not just summary) for users who want the complete content read
- Add progress indicator showing how far through the text the reader is
- Add "Read All Notes" playlist mode: queue multiple notes to play sequentially
- Add highlight/follow-along: show the current text being read (split text into sentences, highlight current one)
- Save audio preferences per session (voice + speed already exist but reset on page reload -- persist to localStorage)

---

## Part 4: Remove/Hide Incomplete Features

Several features only work on native Android and show confusing "Beta" or "Native App Required" warnings on web. Since most users are on web, these hurt the experience.

**Changes:**

1. **Focus Session page (`FocusSession.tsx`)**: The "App Blocking" and "Permissions Setup" sections only work on Android native. On web, hide the app selector and permissions sections entirely. Show only the timer functionality (duration picker + start button). Remove the "BETA" badge from the Focus Session card on the Focus page.

2. **App Blocker Settings (`AppBlockerSettings.tsx`)**: On web, simplify to just show the study goal tracker and Pomodoro link. Hide all app blocking UI (blocked apps list, custom app input, popular apps chips) since they do nothing on web.

3. **Focus Mode Overlay (`FocusModeOverlay.tsx`)** and **Blocking Overlay (`BlockingOverlay.tsx`)**: These are fine -- they work on web as soft overlays. Keep them.

4. **Lecture Recorder (`LectureRecorder.tsx`)**: Uses Web Speech API which has spotty browser support. Add a clearer "not supported" state rather than failing silently. Already partially handled but can be improved.

---

## Part 5: UI Polish Across the Platform

- **Study page grid**: The 2-column grid on Study.tsx is functional. Add subtle hover effects and better visual hierarchy between sections
- **Bottom navigation**: Ensure active state is clearly visible
- **Empty states**: Many features show basic "No notes yet" text. Add illustrations or icons with clear CTAs

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/study/ConceptLinking.tsx` | Full rewrite: pannable/zoomable canvas, expandable nodes with AI details, hierarchical layout, curved connections, touch support |
| `src/components/study/VoiceMode.tsx` | Add note/course context selector, conversation starters, message actions, voice settings, conversation persistence |
| `src/components/study/AudioNotes.tsx` | Add full-note reading, progress indicator, playlist mode, text follow-along, persist voice preferences |
| `src/pages/FocusSession.tsx` | Hide app blocking UI on web platform, show timer-only experience |
| `src/pages/Focus.tsx` | Remove "BETA" badge from Focus Session card |
| `src/components/settings/AppBlockerSettings.tsx` | On web, hide app blocking sections, show only study goal + timer link |

### No new files needed -- all improvements are to existing components.

### No database changes needed.

### Mind Map Canvas Architecture

```text
ConceptLinking
  |-- Canvas Container (overflow: hidden, touch-action: none)
      |-- Transform Wrapper (CSS transform: translate + scale)
          |-- SVG Layer (bezier connection lines)
          |-- Node Layer (absolutely positioned divs)
              |-- Each node:
                  - Click to select/expand
                  - Shows label + depth-based color
                  - When expanded: shows description panel
                  - "Expand" button: AI generates sub-nodes
```

### Implementation Order

| Step | Task |
|------|------|
| 1 | Rewrite ConceptLinking.tsx with interactive canvas |
| 2 | Improve VoiceMode.tsx with context and conversation features |
| 3 | Enhance AudioNotes.tsx with playlist and follow-along |
| 4 | Clean up FocusSession.tsx and AppBlockerSettings.tsx for web |
| 5 | Remove BETA badge from Focus page |

