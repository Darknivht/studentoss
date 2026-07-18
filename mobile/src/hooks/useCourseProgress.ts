import { supabase } from '@/integrations/supabase/client';

/**
 * Calculates and updates course progress based on notes, quizzes, and flashcard reviews
 * Progress = weighted average of: notes created (30%), quizzes taken (30%), flashcards reviewed (40%)
 */
export const updateCourseProgress = async (userId: string, courseId: string) => {
  try {
    // Count notes for this course
    const { count: notesCount } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('course_id', courseId);

    // Count quiz attempts for this course
    const { count: quizzesCount } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('course_id', courseId);

    // Get flashcards for this course and sum repetitions
    const { data: flashcards } = await supabase
      .from('flashcards')
      .select('repetitions')
      .eq('user_id', userId)
      .eq('course_id', courseId);

    const flashcardsReviewed = flashcards?.reduce((sum, fc) => sum + (fc.repetitions || 0), 0) || 0;
    const flashcardsTotal = flashcards?.length || 0;

    // Calculate progress (out of 100)
    // Target: 5 notes = 30%, 3 quizzes = 30%, all flashcards reviewed (avg 3 reps) = 40%
    const notesProgress = Math.min(30, ((notesCount || 0) / 5) * 30);
    const quizzesProgress = Math.min(30, ((quizzesCount || 0) / 3) * 30);
    const flashcardsProgress = flashcardsTotal > 0 
      ? Math.min(40, ((flashcardsReviewed / flashcardsTotal) / 3) * 40)
      : 0;

    const totalProgress = Math.round(notesProgress + quizzesProgress + flashcardsProgress);

    // Update course progress
    await supabase
      .from('courses')
      .update({ progress: totalProgress })
      .eq('id', courseId)
      .eq('user_id', userId);

    return totalProgress;
  } catch (error) {
    console.error('Error updating course progress:', error);
    return null;
  }
};

/**
 * Updates all courses progress for a user
 */
export const updateAllCoursesProgress = async (userId: string) => {
  try {
    const { data: courses } = await supabase
      .from('courses')
      .select('id')
      .eq('user_id', userId);

    if (courses) {
      for (const course of courses) {
        await updateCourseProgress(userId, course.id);
      }
    }
  } catch (error) {
    console.error('Error updating all courses progress:', error);
  }
};
