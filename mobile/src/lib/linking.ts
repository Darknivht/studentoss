import * as Linking from 'expo-linking';
import type { LinkingOptions } from '@react-navigation/native';

export const linking: LinkingOptions<any> = {
  prefixes: [Linking.createURL('/'), 'https://studentoss.lovable.app'],
  config: {
    screens: {
      Auth: 'auth',
      OAuthCallback: 'oauth-callback',
      ResetPassword: 'reset-password',
      Onboarding: 'onboarding',
      ExamPrep: 'exam/:examType?/:subject?',
      GroupChat: 'group/:code',
      Chat: 'chat/:id?',
      SmartNotes: 'notes',
      CoursePage: 'course/:id',
      AITutor: 'tutor',
      Flashcards: 'flashcards',
      Quizzes: 'quizzes',
      Achievements: 'achievements',
      Focus: 'focus',
      FocusSession: 'focus-session',
      Safety: 'safety',
      Profile: 'profile',
      Settings: 'settings',
      Upgrade: 'upgrade',
      Privacy: 'privacy',
      Terms: 'terms',
      AdminResources: 'admin-resources',
      MainTabs: {
        path: '',
        screens: {
          Dashboard: '',
          Study: 'study',
          Plan: 'plan',
          Social: 'social',
          Career: 'career',
          Store: 'store',
        },
      },
      NotFound: '*',
    },
  },
};

/**
 * Handle Supabase OAuth callback URLs.
 * Called from an OAuthCallback screen or root deep-link listener.
 */
export async function handleOAuthCallback(url: string) {
  const { supabase } = await import('../integrations/supabase/client');
  const parsed = Linking.parse(url);
  const params = (parsed.queryParams ?? {}) as Record<string, string | undefined>;

  // Fragment tokens (implicit flow) — expo-linking puts them in queryParams for us
  const access_token = params.access_token;
  const refresh_token = params.refresh_token;
  if (access_token && refresh_token) {
    await supabase.auth.setSession({ access_token, refresh_token });
    return { ok: true } as const;
  }

  // PKCE flow
  const code = params.code;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return { ok: !error, error } as const;
  }

  return { ok: false, error: new Error('No auth params in callback URL') } as const;
}
