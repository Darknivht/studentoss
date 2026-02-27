import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';

/**
 * Global mobile back-button handler.
 * - On the home route ("/"), confirms before exiting.
 * - Everywhere else, navigates back in history.
 * - Can be overridden per-component via the `examInProgress` ref pattern.
 */
export const useMobileBackNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const listener = CapApp.addListener('backButton', ({ canGoBack }) => {
      // Check if there's an active exam blocker
      const examActive = sessionStorage.getItem('exam_in_progress') === 'true';
      if (examActive) {
        const leave = window.confirm('You have an exam in progress. Are you sure you want to leave? Your progress will be saved.');
        if (!leave) return;
        sessionStorage.removeItem('exam_in_progress');
      }

      if (location.pathname === '/' || location.pathname === '/auth') {
        // On home/auth, confirm exit
        const exit = window.confirm('Exit the app?');
        if (exit) CapApp.exitApp();
      } else if (canGoBack) {
        navigate(-1);
      } else {
        navigate('/');
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [navigate, location.pathname]);
};
