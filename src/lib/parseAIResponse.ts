/**
 * Shared utilities for parsing AI responses
 * Handles various JSON formats returned by the AI
 */

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface FillBlank {
  sentence: string;
  blank: string;
  hint: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface ConceptNode {
  id: string;
  label: string;
}

export interface ConceptConnection {
  from: string;
  to: string;
  label?: string;
}

export interface ConceptMap {
  nodes: ConceptNode[];
  connections: ConceptConnection[];
}

/**
 * Extracts JSON content from AI response
 * Handles fenced code blocks, raw JSON, and mixed content
 */
export function extractJsonFromAI(raw: string): string {
  // Strategy 1: Try fenced JSON block (```json ... ```)
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  // Strategy 2: Try to find a JSON object { ... }
  const objectMatch = raw.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }

  // Strategy 3: Try to find a JSON array [ ... ]
  const arrayMatch = raw.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }

  // Return cleaned raw string as fallback
  return raw.trim();
}

/**
 * Parses quiz response from AI
 * Handles both { questions: [...] } and flat array [...] formats
 */
export function parseQuizResponse(raw: string): QuizQuestion[] {
  try {
    const jsonStr = extractJsonFromAI(raw);
    const parsed = JSON.parse(jsonStr);

    // Handle nested { questions: [...] } format
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return validateQuizQuestions(parsed.questions);
      }
      // Single question object? Wrap it
      if (parsed.question && parsed.options) {
        return validateQuizQuestions([parsed]);
      }
    }

    // Handle flat array format
    if (Array.isArray(parsed)) {
      return validateQuizQuestions(parsed);
    }

    throw new Error('Invalid quiz format - expected array or { questions: [...] }');
  } catch (e) {
    console.error('Failed to parse quiz response:', e, '\nRaw response:', raw);
    throw new Error(`Failed to parse quiz: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

/**
 * Validates quiz questions have required fields
 */
function validateQuizQuestions(questions: unknown[]): QuizQuestion[] {
  if (!questions || questions.length === 0) {
    throw new Error('No questions found in response');
  }

  return questions.map((q, index) => {
    const question = q as Record<string, unknown>;
    
    if (!question.question || typeof question.question !== 'string') {
      throw new Error(`Question ${index + 1} missing 'question' field`);
    }
    if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
      throw new Error(`Question ${index + 1} missing valid 'options' array`);
    }
    if (typeof question.correct !== 'number' || question.correct < 0 || question.correct >= question.options.length) {
      throw new Error(`Question ${index + 1} has invalid 'correct' index`);
    }

    return {
      question: question.question,
      options: question.options as string[],
      correct: question.correct,
      explanation: (question.explanation as string) || 'No explanation provided',
    };
  });
}

/**
 * Parses fill-in-the-blanks response from AI
 * Handles JSON array, block format, and numbered list formats
 */
export function parseFillBlanksResponse(raw: string): FillBlank[] {
  console.log('Parsing fill-in-the-blanks response:', raw.substring(0, 500));
  
  // Strategy 1: Try JSON array first
  try {
    const jsonStr = extractJsonFromAI(raw);
    const parsed = JSON.parse(jsonStr);
    
    // Handle nested { exercises: [...] } format
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      if (parsed.exercises && Array.isArray(parsed.exercises)) {
        return validateFillBlanks(parsed.exercises);
      }
    }
    
    if (Array.isArray(parsed) && parsed.length > 0) {
      return validateFillBlanks(parsed);
    }
  } catch {
    // JSON parsing failed, try other strategies
    console.log('JSON parsing failed, trying block format...');
  }

  // Strategy 2: Block-based parsing (--- separator)
  // Note: Only split on line separators, NOT on ___ within sentences
  const blockParsed: FillBlank[] = [];
  const blocks = raw.split(/\n-{3,}\n|\n\*{3,}\n/);
  
  for (const block of blocks) {
    if (!block.trim()) continue;

    const sentenceMatch = block.match(/Sentence:\s*(.+?)(?:\n|$)/i);
    const answerMatch = block.match(/(?:Answer|Blank):\s*(.+?)(?:\n|$)/i);
    const hintMatch = block.match(/Hint:\s*(.+?)(?:\n|$)/i);

    if (sentenceMatch && answerMatch) {
      blockParsed.push({
        sentence: sentenceMatch[1].trim(),
        blank: answerMatch[1].trim(),
        hint: hintMatch ? hintMatch[1].trim() : 'Think about the key concept',
      });
    }
  }

  if (blockParsed.length > 0) {
    return blockParsed;
  }

  // Strategy 3: Numbered list format (1. Sentence: ... Answer: ...)
  const numberedParsed: FillBlank[] = [];
  const lines = raw.split('\n');
  let currentExercise: Partial<FillBlank> = {};

  for (const line of lines) {
    const sentenceMatch = line.match(/^\d+\.\s*(?:Sentence:\s*)?(.+___+.+)/i);
    const answerOnlyMatch = line.match(/^\s*(?:Answer|Blank):\s*(.+)/i);
    const hintOnlyMatch = line.match(/^\s*Hint:\s*(.+)/i);

    if (sentenceMatch) {
      // Start new exercise
      if (currentExercise.sentence && currentExercise.blank) {
        numberedParsed.push({
          sentence: currentExercise.sentence,
          blank: currentExercise.blank,
          hint: currentExercise.hint || 'Think about the key concept',
        });
      }
      currentExercise = { sentence: sentenceMatch[1].trim() };
    } else if (answerOnlyMatch && currentExercise.sentence) {
      currentExercise.blank = answerOnlyMatch[1].trim();
    } else if (hintOnlyMatch && currentExercise.sentence) {
      currentExercise.hint = hintOnlyMatch[1].trim();
    }
  }

  // Don't forget the last exercise
  if (currentExercise.sentence && currentExercise.blank) {
    numberedParsed.push({
      sentence: currentExercise.sentence,
      blank: currentExercise.blank,
      hint: currentExercise.hint || 'Think about the key concept',
    });
  }

  if (numberedParsed.length > 0) {
    return numberedParsed;
  }

  // Strategy 4: Pipe format (Sentence | Answer | Hint)
  const pipeParsed: FillBlank[] = [];
  for (const line of lines) {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 2 && parts[0].includes('___')) {
      pipeParsed.push({
        sentence: parts[0],
        blank: parts[1],
        hint: parts[2] || 'Think about the key concept',
      });
    }
  }

  if (pipeParsed.length > 0) {
    return pipeParsed;
  }

  console.error('All parsing strategies failed for:', raw);
  throw new Error('Could not parse fill-in-the-blanks exercises');
}

/**
 * Validates fill-in-the-blanks exercises
 */
function validateFillBlanks(exercises: unknown[]): FillBlank[] {
  if (!exercises || exercises.length === 0) {
    throw new Error('No exercises found');
  }

  return exercises.map((ex, index) => {
    const exercise = ex as Record<string, unknown>;
    
    if (!exercise.sentence || typeof exercise.sentence !== 'string') {
      throw new Error(`Exercise ${index + 1} missing 'sentence' field`);
    }
    if (!exercise.blank || typeof exercise.blank !== 'string') {
      // Try alternative field names
      const answer = exercise.answer || exercise.word || exercise.term;
      if (!answer || typeof answer !== 'string') {
        throw new Error(`Exercise ${index + 1} missing 'blank' field`);
      }
      exercise.blank = answer;
    }

    return {
      sentence: exercise.sentence,
      blank: exercise.blank as string,
      hint: (exercise.hint as string) || 'Think about the key concept',
    };
  });
}

/**
 * Parses flashcards response from AI
 * Handles both { flashcards: [...] } and flat array [...] formats
 */
export function parseFlashcardsResponse(raw: string): Flashcard[] {
  try {
    const jsonStr = extractJsonFromAI(raw);
    const parsed = JSON.parse(jsonStr);

    // Handle nested { flashcards: [...] } format
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
        return validateFlashcards(parsed.flashcards);
      }
    }

    // Handle flat array format
    if (Array.isArray(parsed)) {
      return validateFlashcards(parsed);
    }

    throw new Error('Invalid flashcards format');
  } catch (e) {
    console.error('Failed to parse flashcards response:', e, '\nRaw response:', raw);
    throw new Error(`Failed to parse flashcards: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

/**
 * Validates flashcard data
 */
function validateFlashcards(cards: unknown[]): Flashcard[] {
  if (!cards || cards.length === 0) {
    throw new Error('No flashcards found');
  }

  return cards.map((card, index) => {
    const fc = card as Record<string, unknown>;
    
    if (!fc.front || typeof fc.front !== 'string') {
      throw new Error(`Flashcard ${index + 1} missing 'front' field`);
    }
    if (!fc.back || typeof fc.back !== 'string') {
      throw new Error(`Flashcard ${index + 1} missing 'back' field`);
    }

    return {
      front: fc.front,
      back: fc.back,
    };
  });
}

/**
 * Parses concept map response from AI
 */
export function parseConceptMapResponse(raw: string): ConceptMap {
  try {
    const jsonStr = extractJsonFromAI(raw);
    const parsed = JSON.parse(jsonStr);

    if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
      throw new Error('Missing nodes array');
    }

    return {
      nodes: parsed.nodes.map((n: unknown) => {
        const node = n as Record<string, unknown>;
        return {
          id: String(node.id || ''),
          label: String(node.label || ''),
        };
      }),
      connections: (parsed.connections || []).map((c: unknown) => {
        const conn = c as Record<string, unknown>;
        return {
          from: String(conn.from || ''),
          to: String(conn.to || ''),
          label: conn.label ? String(conn.label) : undefined,
        };
      }),
    };
  } catch (e) {
    console.error('Failed to parse concept map:', e, '\nRaw response:', raw);
    throw new Error(`Failed to parse concept map: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}
