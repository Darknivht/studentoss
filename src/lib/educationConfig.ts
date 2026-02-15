// Education level configuration that impacts AI behavior across the app

export interface EducationLevel {
  id: string;
  label: string;
  category: 'middle_school' | 'high_school' | 'college' | 'graduate';
  aiPromptModifier: string;
  recommendedSleepHours: { min: number; max: number };
  recommendedStudyMinutes: number;
}

export const EDUCATION_LEVELS: EducationLevel[] = [
  { id: '6th', label: '6th Grade', category: 'middle_school', aiPromptModifier: 'The student is in 6th grade (age ~11-12). Use simple, clear language. Avoid jargon. Use relatable examples from everyday life. Keep explanations concise and age-appropriate.', recommendedSleepHours: { min: 9, max: 11 }, recommendedStudyMinutes: 60 },
  { id: '7th', label: '7th Grade', category: 'middle_school', aiPromptModifier: 'The student is in 7th grade (age ~12-13). Use simple, clear language with some academic vocabulary. Use relatable examples.', recommendedSleepHours: { min: 9, max: 11 }, recommendedStudyMinutes: 75 },
  { id: '8th', label: '8th Grade', category: 'middle_school', aiPromptModifier: 'The student is in 8th grade (age ~13-14). Use moderate academic language. Introduce subject-specific terms with brief definitions.', recommendedSleepHours: { min: 9, max: 11 }, recommendedStudyMinutes: 90 },
  { id: '9th', label: '9th Grade', category: 'high_school', aiPromptModifier: 'The student is in 9th grade (age ~14-15). Use standard academic language. Include subject-specific terminology. Provide more detailed explanations.', recommendedSleepHours: { min: 8, max: 10 }, recommendedStudyMinutes: 90 },
  { id: '10th', label: '10th Grade', category: 'high_school', aiPromptModifier: 'The student is in 10th grade (age ~15-16). Use academic language appropriate for high school. Include analytical thinking prompts.', recommendedSleepHours: { min: 8, max: 10 }, recommendedStudyMinutes: 105 },
  { id: '11th', label: '11th Grade', category: 'high_school', aiPromptModifier: 'The student is in 11th grade (age ~16-17). Use advanced academic language. Encourage critical thinking and analysis. Reference exam preparation.', recommendedSleepHours: { min: 8, max: 10 }, recommendedStudyMinutes: 120 },
  { id: '12th', label: '12th Grade', category: 'high_school', aiPromptModifier: 'The student is in 12th grade (age ~17-18). Use advanced academic language. Focus on exam readiness and deeper understanding.', recommendedSleepHours: { min: 8, max: 10 }, recommendedStudyMinutes: 120 },
  { id: 'freshman', label: 'College Freshman', category: 'college', aiPromptModifier: 'The student is a college freshman. Use university-level academic language. Encourage independent thinking and research skills.', recommendedSleepHours: { min: 7, max: 9 }, recommendedStudyMinutes: 150 },
  { id: 'sophomore', label: 'College Sophomore', category: 'college', aiPromptModifier: 'The student is a college sophomore. Use university-level language with field-specific terminology. Encourage deeper analysis.', recommendedSleepHours: { min: 7, max: 9 }, recommendedStudyMinutes: 150 },
  { id: 'junior', label: 'College Junior', category: 'college', aiPromptModifier: 'The student is a college junior. Use advanced academic language. Reference research methodology and critical evaluation.', recommendedSleepHours: { min: 7, max: 9 }, recommendedStudyMinutes: 180 },
  { id: 'senior', label: 'College Senior', category: 'college', aiPromptModifier: 'The student is a college senior. Use advanced academic language. Focus on synthesis, research, and professional application.', recommendedSleepHours: { min: 7, max: 9 }, recommendedStudyMinutes: 180 },
  { id: 'graduate', label: 'Graduate School', category: 'graduate', aiPromptModifier: 'The student is in graduate school. Use expert-level academic language. Focus on research, critical analysis, and field-specific depth.', recommendedSleepHours: { min: 7, max: 9 }, recommendedStudyMinutes: 240 },
];

export function getEducationLevel(gradeLevel: string | null | undefined): EducationLevel | null {
  if (!gradeLevel) return null;
  const normalized = gradeLevel.toLowerCase().trim();
  
  // Try exact match first
  const exact = EDUCATION_LEVELS.find(l => l.id === normalized || l.label.toLowerCase() === normalized);
  if (exact) return exact;
  
  // Try partial match
  if (normalized.includes('6')) return EDUCATION_LEVELS[0];
  if (normalized.includes('7')) return EDUCATION_LEVELS[1];
  if (normalized.includes('8')) return EDUCATION_LEVELS[2];
  if (normalized.includes('9')) return EDUCATION_LEVELS[3];
  if (normalized.includes('10')) return EDUCATION_LEVELS[4];
  if (normalized.includes('11')) return EDUCATION_LEVELS[5];
  if (normalized.includes('12')) return EDUCATION_LEVELS[6];
  if (normalized.includes('fresh')) return EDUCATION_LEVELS[7];
  if (normalized.includes('soph')) return EDUCATION_LEVELS[8];
  if (normalized.includes('junior') || normalized.includes('3rd year')) return EDUCATION_LEVELS[9];
  if (normalized.includes('senior') || normalized.includes('4th year')) return EDUCATION_LEVELS[10];
  if (normalized.includes('grad') || normalized.includes('master') || normalized.includes('phd')) return EDUCATION_LEVELS[11];
  
  return null;
}

export function getEducationContext(gradeLevel: string | null | undefined): string {
  const level = getEducationLevel(gradeLevel);
  if (!level) return '';
  return level.aiPromptModifier;
}
