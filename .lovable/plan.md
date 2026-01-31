

# Fix Study Modes - Quiz, Fill-in-the-Blanks, and All Study Tools

## Problem Summary

Based on exploration, I identified these issues:

1. **Quiz Generation "Failed to generate quiz"**: The AI returns a nested JSON structure `{ "questions": [...] }` but the parsing code expects a flat array `[...]`
2. **Fill-in-the-Blanks "Failed to generate exercises"**: The parsing logic is fragile and can fail when AI returns slightly different formats
3. **Inconsistent Error Handling**: Several study modes lack robust fallback parsing and error recovery
4. **Missing Quiz Mode in Edge Function**: The edge function quiz prompt asks for a nested format, but frontend parsing is inconsistent

---

## Root Cause Analysis

### Quiz Generation Issue
- Edge function returns: `{ "questions": [{ "question": "...", "options": [...], "correct": 0, "explanation": "..." }] }`
- Frontend tries: `JSON.parse(response)` as array directly
- Fix needed: Handle both nested `{ questions: [...] }` and flat array `[...]` formats

### Fill-in-the-Blanks Issue
- AI response format varies (block-based, pipe-based, or JSON)
- Current parsing splits on `---|___|\*\*\*` which breaks sentences containing `___` blanks
- Fix needed: Better regex that doesn't split on `___` within sentences

---

## Phase 1: Fix Quiz Generation (Quizzes.tsx)

### Changes to `generateQuizFromCourse` and `generateQuizFromNote`:

Update the JSON parsing in both functions to handle nested structures:

```text
Current parsing (lines ~184-192, ~267-275):
const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/);
let quizData: QuizQuestion[];
if (jsonMatch) {
  quizData = JSON.parse(jsonMatch[1]);
} else {
  quizData = JSON.parse(fullResponse);
}

New parsing:
// Strategy 1: Try fenced JSON block
// Strategy 2: Try raw JSON object/array
// Handle both { questions: [...] } and [...] formats
// Add detailed console.error for debugging
```

**Key improvement**: Check if parsed result has a `questions` property and extract it.

---

## Phase 2: Fix Fill-in-the-Blanks (FillBlanks.tsx)

### Update `generateBlanks` parsing:

Current issue: Line 83 splits on `---|___|\*\*\*` which incorrectly splits sentences containing blanks.

**Fix**:
1. Remove `___` from the split regex (only split on `---` or `***` as block separators)
2. Add more robust pattern matching for the sentence extraction
3. Better JSON fallback parsing
4. Add structured prompt to edge function

### Updated parsing logic:

```text
1. First try: Parse JSON array if response is pure JSON
2. Second try: Parse block format with --- separators
3. Third try: Parse numbered list format (1. Sentence: ... Answer: ...)
4. Add better error messages and console logging
```

---

## Phase 3: Add Dedicated Fill-in-the-Blanks Mode to Edge Function

### Add new mode `fill_blanks` to `supabase/functions/ai-study/index.ts`:

```text
case "fill_blanks":
  systemPrompt = `Create 5 fill-in-the-blank exercises from the provided content.
Return ONLY valid JSON array format:
[
  {
    "sentence": "The ___ is the powerhouse of the cell.",
    "blank": "mitochondria", 
    "hint": "Organelle responsible for energy production"
  }
]
Replace exactly one key term with ___ in each sentence.
Only return valid JSON, no other text.`;
```

This ensures consistent, parseable output.

---

## Phase 4: Improve MockExam (MockExam.tsx)

### Current issue:
Mock exam uses `mode: 'chat'` instead of a dedicated mode, leading to inconsistent output.

**Fix**: Update to use `mode: 'quiz'` and handle the nested format:

```text
Current (line 70-76):
mode: 'chat',
content: `Create a 10-question multiple choice exam...`

Updated:
mode: 'quiz',
content: `Create a 10-question exam from this content: ${note.content}`
// Then parse result to handle nested { questions: [...] } format
```

---

## Phase 5: Create Shared JSON Parsing Utility

### New file: `src/lib/parseAIResponse.ts`

Consolidate the scattered `extractJsonFromAI` functions into one utility:

```text
export function extractJsonFromAI(raw: string): string {
  // 1. Try ```json fenced block
  // 2. Try ```code fenced block  
  // 3. Try raw JSON object/array detection
  // 4. Return cleaned string ready for JSON.parse
}

export function parseQuizResponse(raw: string): QuizQuestion[] {
  const json = extractJsonFromAI(raw);
  const parsed = JSON.parse(json);
  // Handle { questions: [...] } or [...] format
  return Array.isArray(parsed) ? parsed : (parsed.questions || []);
}

export function parseFillBlanksResponse(raw: string): FillBlank[] {
  // Robust parsing with multiple strategies
}

export function parseFlashcardsResponse(raw: string): Flashcard[] {
  // Handle { flashcards: [...] } or [...] format
}
```

---

## Phase 6: Review and Fix Other Study Modes

### Cram Mode (CramMode.tsx)
- Status: Works correctly - uses existing flashcards from database
- No changes needed

### Mnemonic Generator (MnemonicGenerator.tsx)
- Status: Works correctly - streams markdown text
- No changes needed

### Audio Notes (AudioNotes.tsx)
- Status: Works correctly - uses Web Speech API
- No changes needed

### Voice Mode (VoiceMode.tsx)
- Status: Works correctly - uses Web Speech Recognition
- No changes needed

### Debate Partner (DebatePartner.tsx)
- Status: Works correctly - chat-based conversation
- No changes needed

### Cheat Sheet Creator (CheatSheetCreator.tsx)
- Status: Works correctly - streams markdown text
- No changes needed

### Concept Linking (ConceptLinking.tsx)
- Status: Needs minor fix - JSON parsing could be more robust
- Add fallback handling for malformed JSON

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/parseAIResponse.ts` | Shared JSON parsing utilities |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Quizzes.tsx` | Fix quiz JSON parsing to handle nested format |
| `src/components/study/FillBlanks.tsx` | Fix parsing regex, use new mode, add better error handling |
| `src/components/study/MockExam.tsx` | Use quiz mode, fix JSON parsing |
| `src/components/study/ConceptLinking.tsx` | Add robust JSON parsing fallback |
| `supabase/functions/ai-study/index.ts` | Add fill_blanks mode for consistent output |
| `src/pages/SmartNotes.tsx` | Use shared parsing utility |
| `src/pages/CoursePage.tsx` | Use shared parsing utility |
| `src/components/notes/NoteViewerDialog.tsx` | Use shared parsing utility |

---

## Technical Details

### Quiz Parsing Fix (Quizzes.tsx)

```typescript
// In onDone callback
const extractQuizData = (raw: string): QuizQuestion[] => {
  // Try fenced JSON first
  const fenceMatch = raw.match(/```json\s*([\s\S]*?)\s*```/i);
  const jsonStr = fenceMatch ? fenceMatch[1].trim() : raw.trim();
  
  // Try to find JSON object or array
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
  
  let parsed;
  if (objectMatch) {
    parsed = JSON.parse(objectMatch[0]);
  } else if (arrayMatch) {
    parsed = JSON.parse(arrayMatch[0]);
  } else {
    throw new Error('No valid JSON found in response');
  }
  
  // Handle nested { questions: [...] } format
  if (parsed.questions && Array.isArray(parsed.questions)) {
    return parsed.questions;
  }
  
  // Handle flat array format
  if (Array.isArray(parsed)) {
    return parsed;
  }
  
  throw new Error('Invalid quiz format');
};
```

### Fill-in-the-Blanks Parsing Fix

```typescript
// Strategy 1: Try JSON first
const jsonMatch = fullResponse.match(/\[[\s\S]*?\]/);
if (jsonMatch) {
  const parsed = JSON.parse(jsonMatch[0]);
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed;
  }
}

// Strategy 2: Block-based parsing (only split on --- not ___)
const blocks = fullResponse.split(/\n---\n|\n\*\*\*\n/);
// ... rest of parsing
```

---

## Expected Outcome

After these fixes:
1. Quiz generation will work reliably from both courses and notes
2. Fill-in-the-blanks will generate exercises correctly
3. Mock exams will generate properly
4. All study modes will have consistent error handling
5. JSON parsing will be centralized and robust

