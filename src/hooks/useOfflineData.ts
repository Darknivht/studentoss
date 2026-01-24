import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OfflinePack {
  notes?: any[];
  flashcards?: any[];
}

const OFFLINE_NOTES_KEY = 'offline_notes_cache';
const OFFLINE_FLASHCARDS_KEY = 'offline_flashcards_cache';
const OFFLINE_COURSES_KEY = 'offline_courses_cache';

// Cache data locally when online
export const cacheDataLocally = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn('Failed to cache data locally:', e);
  }
};

// Get cached data
export const getCachedData = <T>(key: string): T | null => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.data as T;
    }
  } catch (e) {
    console.warn('Failed to get cached data:', e);
  }
  return null;
};

// Get all downloaded offline packs
const getDownloadedPacks = (): OfflinePack => {
  const result: OfflinePack = { notes: [], flashcards: [] };
  
  try {
    for (const key in localStorage) {
      if (key.startsWith('offline_pack_')) {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        
        // Handle different pack types
        if (Array.isArray(data)) {
          // It's either all notes or all flashcards based on the key
          if (key.includes('notes')) {
            result.notes = [...(result.notes || []), ...data];
          } else if (key.includes('flashcards')) {
            result.flashcards = [...(result.flashcards || []), ...data];
          }
        } else if (data.notes || data.flashcards) {
          // It's a course pack with both
          if (data.notes) {
            result.notes = [...(result.notes || []), ...data.notes];
          }
          if (data.flashcards) {
            result.flashcards = [...(result.flashcards || []), ...data.flashcards];
          }
        }
      }
    }
  } catch (e) {
    console.warn('Failed to get downloaded packs:', e);
  }
  
  // Deduplicate by id
  if (result.notes) {
    result.notes = Array.from(new Map(result.notes.map(n => [n.id, n])).values());
  }
  if (result.flashcards) {
    result.flashcards = Array.from(new Map(result.flashcards.map(f => [f.id, f])).values());
  }
  
  return result;
};

export const useOfflineData = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Fetch notes with offline fallback
  const fetchNotes = useCallback(async (): Promise<any[]> => {
    if (!user?.id) return [];
    
    // Try online fetch first
    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          // Cache the data for offline use
          cacheDataLocally(OFFLINE_NOTES_KEY, data);
          return data;
        }
      } catch (e) {
        console.warn('Online fetch failed, falling back to offline:', e);
      }
    }
    
    // Fallback to cached/downloaded data
    const cached = getCachedData<any[]>(OFFLINE_NOTES_KEY);
    if (cached && cached.length > 0) {
      return cached;
    }
    
    // Check downloaded packs
    const packs = getDownloadedPacks();
    return packs.notes || [];
  }, [user?.id, isOnline]);
  
  // Fetch flashcards with offline fallback
  const fetchFlashcards = useCallback(async (): Promise<any[]> => {
    if (!user?.id) return [];
    
    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('flashcards')
          .select('*')
          .eq('user_id', user.id)
          .order('next_review', { ascending: true });
        
        if (!error && data) {
          cacheDataLocally(OFFLINE_FLASHCARDS_KEY, data);
          return data;
        }
      } catch (e) {
        console.warn('Online fetch failed, falling back to offline:', e);
      }
    }
    
    const cached = getCachedData<any[]>(OFFLINE_FLASHCARDS_KEY);
    if (cached && cached.length > 0) {
      return cached;
    }
    
    const packs = getDownloadedPacks();
    return packs.flashcards || [];
  }, [user?.id, isOnline]);
  
  // Fetch courses with offline fallback
  const fetchCourses = useCallback(async (): Promise<any[]> => {
    if (!user?.id) return [];
    
    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true });
        
        if (!error && data) {
          cacheDataLocally(OFFLINE_COURSES_KEY, data);
          return data;
        }
      } catch (e) {
        console.warn('Online fetch failed, falling back to offline:', e);
      }
    }
    
    return getCachedData<any[]>(OFFLINE_COURSES_KEY) || [];
  }, [user?.id, isOnline]);
  
  // Check if we have any offline data available
  const hasOfflineData = useCallback((): boolean => {
    const notesCache = getCachedData(OFFLINE_NOTES_KEY);
    const flashcardsCache = getCachedData(OFFLINE_FLASHCARDS_KEY);
    const packs = getDownloadedPacks();
    
    return !!(
      (notesCache && (notesCache as any[]).length > 0) ||
      (flashcardsCache && (flashcardsCache as any[]).length > 0) ||
      (packs.notes && packs.notes.length > 0) ||
      (packs.flashcards && packs.flashcards.length > 0)
    );
  }, []);
  
  return {
    isOnline,
    fetchNotes,
    fetchFlashcards,
    fetchCourses,
    hasOfflineData,
    cacheDataLocally,
    getCachedData,
  };
};

export default useOfflineData;
