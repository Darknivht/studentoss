

# Fix Study Modes - Complete Overhaul

## Problems Identified

### 1. **Mock Exam - No Question Count Selector**
The MockExam component always generates 10 questions with no user control.

### 2. **Study Modes Return Generic Greetings Instead of Actual Content**
Console logs show: `"Hello there! I'm StudentOS AI..."` being returned instead of actual content. This happens because:
- **ConceptLinking.tsx** uses `mode: 'chat'` (line 54) - gets generic greeting
- **MnemonicGenerator.tsx** uses `mode: 'chat'` (line 29) - gets generic greeting
- **CheatSheetCreator.tsx** uses `mode: 'chat'` (line 49) - gets generic greeting
- **DebatePartner.tsx** uses `mode: 'chat'` (line 33, 70) - gets generic greeting

The edge function `ai-study/index.ts` has a `chat` mode that gives a generic "StudentOS AI" introduction when no content is provided in the messages.

### 3. **Scrolling Issues in Reply Components**
Multiple components use `ScrollArea` with `max-h-[50vh]` or similar, but some content overflows or doesn't scroll properly. The issue is likely that:
- Some components use `pre` tags with `whitespace-pre-wrap` that don't respect height constraints
- Missing `overflow-hidden` on parent containers

### 4. **Audio Notes - No Voice/Speed Controls**
AudioNotes.tsx uses hardcoded `rate = 0.9` and auto-selects a voice. Users need:
- Voice selection dropdown
- Speed slider (0.5x - 2x)

### 5. **Voice Mode Not Working**
VoiceMode.tsx implementation looks correct but may fail due to:
- Speech recognition not being supported on all browsers
- No fallback for unsupported browsers
- Missing error handling for microphone permissions

### 6. **Text Formatting Inconsistency**
Different components format AI responses differently:
- Some use `<pre>` tags (loses markdown)
- Some use ReactMarkdown
- Some use custom MarkdownRenderer
Need a unified formatter that's used everywhere.

---

## Phase 1: Create Dedicated Edge Function Modes

### Add New Modes to `supabase/functions/ai-study/index.ts`

Add these specialized modes that include the content directly in the system prompt:

```text
case "mnemonic":
  - System prompt specialized for creating mnemonics
  - Takes content parameter and returns actual mnemonics
  - No greeting, just the content

case "cheatsheet":
  - System prompt for creating condensed study guides
  - Takes content parameter, returns formatted cheat sheet

case "debate":
  - System prompt for debate partner
  - Takes topic and position, argues opposite view

case "concept_map":
  - System prompt for creating mind maps
  - Returns strict JSON format for nodes/connections
```

---

## Phase 2: Mock Exam - Add Question Count Selector

### Changes to `src/components/study/MockExam.tsx`

1. Add state for question count:
   ```typescript
   const [questionCount, setQuestionCount] = useState(10);
   ```

2. Add a selector UI in the note selection screen:
   - Slider or dropdown: 5, 10, 15, 20 questions
   - Show estimated time (1 min per question)

3. Update `generateExam` to use the selected count:
   - Change prompt to request `questionCount` questions
   - Update timer: `questionCount * 60` seconds

---

## Phase 3: Fix Study Mode Context Issues

### 3.1 Update MnemonicGenerator.tsx

Current:
```typescript
mode: 'chat',
content: `Create memorable mnemonics...`
```

Fix:
- Change to `mode: 'mnemonic'`
- The edge function will have a dedicated prompt that returns actual mnemonics

### 3.2 Update CheatSheetCreator.tsx

Current:
```typescript
mode: 'chat',
content: `Create a one-page CHEAT SHEET...`
```

Fix:
- Change to `mode: 'cheatsheet'`
- Edge function returns formatted content, not greetings

### 3.3 Update DebatePartner.tsx

Current:
```typescript
mode: 'chat',
content: `You are a skilled debate partner...`
```

Fix:
- Change to `mode: 'debate'`
- Edge function handles the debate persona

### 3.4 Update ConceptLinking.tsx

Current:
```typescript
mode: 'chat',
content: `Analyze this content and create a concept map...`
```

Fix:
- Change to `mode: 'concept_map'`
- Edge function returns strict JSON format

---

## Phase 4: Fix Scrolling Issues

### Create a Reusable AI Response Container

Create a new component or update how ScrollArea is used:

1. Ensure parent container has fixed height
2. Add `overflow-hidden` to parent
3. Use proper ScrollArea with explicit height
4. Replace `pre` tags with proper markdown rendering

### Files to Update:
- `MnemonicGenerator.tsx` - Line 133-145
- `CheatSheetCreator.tsx` - Line 143-155
- `AIToolLayout.tsx` - Line 203-211

---

## Phase 5: Audio Notes - Voice & Speed Controls

### Changes to `src/components/study/AudioNotes.tsx`

1. Add state for voice and speed:
   ```typescript
   const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
   const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
   const [speed, setSpeed] = useState(1.0);
   ```

2. Load available voices on mount:
   ```typescript
   useEffect(() => {
     const loadVoices = () => {
       const availableVoices = synthRef.current?.getVoices() || [];
       setVoices(availableVoices);
       // Set default voice
       const defaultVoice = availableVoices.find(v => v.default) || availableVoices[0];
       setSelectedVoice(defaultVoice);
     };
     // Voices load async
     speechSynthesis.onvoiceschanged = loadVoices;
     loadVoices();
   }, []);
   ```

3. Add UI controls:
   - Voice dropdown (Select component)
   - Speed slider (0.5x - 2x) with Slider component

4. Update `speakText` to use selected voice and speed

---

## Phase 6: Fix Voice Mode

### Changes to `src/components/study/VoiceMode.tsx`

1. Add better browser support detection:
   ```typescript
   const [isSupported, setIsSupported] = useState(true);
   
   useEffect(() => {
     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
     if (!SpeechRecognition) {
       setIsSupported(false);
     }
   }, []);
   ```

2. Show fallback UI when not supported:
   - Text input alternative
   - Message explaining browser requirements

3. Add microphone permission handling:
   - Request permission explicitly before starting
   - Show helpful error if denied

4. Use the `socratic` mode with context for better responses

---

## Phase 7: Universal Text Formatting

### Create `src/lib/formatters.ts`

```typescript
/**
 * Universal text formatting utilities
 * Called before displaying any AI-generated content
 */

// Clean and format AI response text
export function formatAIResponse(content: string): string {
  if (!content) return '';
  
  let formatted = content;
  
  // Remove excessive whitespace
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // Ensure proper markdown spacing
  formatted = formatted.replace(/^(#+)([^\s])/gm, '$1 $2');
  
  // Clean up list formatting
  formatted = formatted.replace(/^[-*•]\s*/gm, '- ');
  
  return formatted.trim();
}

// Strip markdown for plain text contexts (audio, etc.)
export function stripMarkdown(content: string): string {
  return content
    .replace(/\*\*(.+?)\*\*/g, '$1')  // Bold
    .replace(/\*(.+?)\*/g, '$1')       // Italic
    .replace(/#{1,6}\s/g, '')          // Headers
    .replace(/`(.+?)`/g, '$1')         // Inline code
    .replace(/```[\s\S]*?```/g, '')    // Code blocks
    .trim();
}
```

### Update All Components to Use ReactMarkdown

Replace all instances of `<pre className="whitespace-pre-wrap">` with:
```tsx
import ReactMarkdown from 'react-markdown';
import { formatAIResponse } from '@/lib/formatters';

// In render:
<div className="prose prose-sm dark:prose-invert max-w-none">
  <ReactMarkdown>{formatAIResponse(content)}</ReactMarkdown>
</div>
```

Files to update:
- `MnemonicGenerator.tsx` (line 140)
- `CheatSheetCreator.tsx` (line 150)
- `AIToolLayout.tsx` (line 205)
- `BibliographyBuilder.tsx` (line 150)
- `ResearchAssistant.tsx` (line 90)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/formatters.ts` | Universal text formatting utilities |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/ai-study/index.ts` | Add mnemonic, cheatsheet, debate, concept_map modes |
| `src/components/study/MockExam.tsx` | Add question count selector UI and state |
| `src/components/study/MnemonicGenerator.tsx` | Use new mode, fix formatting and scrolling |
| `src/components/study/CheatSheetCreator.tsx` | Use new mode, fix formatting and scrolling |
| `src/components/study/DebatePartner.tsx` | Use new mode |
| `src/components/study/ConceptLinking.tsx` | Use new mode |
| `src/components/study/AudioNotes.tsx` | Add voice selection and speed controls |
| `src/components/study/VoiceMode.tsx` | Add fallback UI and better error handling |
| `src/components/ai-tools/AIToolLayout.tsx` | Use ReactMarkdown for formatting |
| `src/components/academic/BibliographyBuilder.tsx` | Use ReactMarkdown for formatting |
| `src/components/academic/ResearchAssistant.tsx` | Use ReactMarkdown for formatting |

---

## Technical Implementation Details

### Edge Function Mode Prompts

**Mnemonic Mode:**
```text
Create memorable mnemonics for the given content. Include:
1. Acronyms (funny ones work best!)
2. Rhymes or songs
3. Visual associations
4. Memory palace suggestions
5. Silly sentences using first letters

Make them FUNNY and MEMORABLE. Students remember humor!
Return only the mnemonics, no greetings or introductions.
```

**Cheatsheet Mode:**
```text
Create a one-page CHEAT SHEET from this content. Make it:
- Ultra-condensed (fit on one printed page)
- Use bullet points, abbreviations
- Include key formulas, definitions, dates
- Use sections for different topics
- Perfect for quick reference during exams

Format in clean markdown. No greetings, just the content.
```

**Concept Map Mode:**
```text
Analyze this content and create a concept map with 5-8 key concepts.
Return ONLY valid JSON in this exact format:
{
  "nodes": [{"id": "1", "label": "Main Concept"}],
  "connections": [{"from": "1", "to": "2", "label": "relates to"}]
}
No other text, just JSON.
```

---

## Expected Outcome

After these fixes:
1. Mock exams allow choosing 5/10/15/20 questions
2. All study modes (Mnemonics, Cheat Sheets, Debate, Mind Maps) return actual content, not greetings
3. Scrolling works properly in all response areas
4. Audio notes have voice selection and speed control
5. Voice mode has fallback for unsupported browsers
6. All AI responses are consistently formatted with markdown

