import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useMobileBackNavigation } from "@/hooks/useMobileBackNavigation";
import PWAUpdateBanner from "@/components/pwa/PWAUpdateBanner";
import OfflineStatusBanner from "@/components/pwa/OfflineStatusBanner";
import ErrorBoundary from "@/components/ErrorBoundary";

import AppLayout from "@/components/layout/AppLayout";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import { useAuth } from "@/hooks/useAuth";
import Study from "./pages/Study";
import SmartNotes from "./pages/SmartNotes";
import AITutor from "./pages/AITutor";
import Flashcards from "./pages/Flashcards";
import Quizzes from "./pages/Quizzes";
import Focus from "./pages/Focus";
import Achievements from "./pages/Achievements";
import Plan from "./pages/Plan";
import Social from "./pages/Social";
import Career from "./pages/Career";
import Safety from "./pages/Safety";
import Profile from "./pages/Profile";
import CoursePage from "./pages/CoursePage";
import Upgrade from "./pages/Upgrade";
import Chat from "./pages/Chat";
import GroupChat from "./pages/GroupChat";
import NotFound from "./pages/NotFound";
import FocusSession from "./pages/FocusSession";
import BlockingOverlay from "./components/focus/BlockingOverlay";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Store from "./pages/Store";
import AdminResources from "./pages/AdminResources";
import ExamPrep from "./pages/ExamPrep";
import Install from "./pages/Install";
import DocsLayout from "./pages/docs/DocsLayout";
import DocsHome from "./pages/docs/DocsHome";
import DocsArchitecture from "./pages/docs/DocsArchitecture";
import DocsFeatures from "./pages/docs/DocsFeatures";
import DocsBusiness from "./pages/docs/DocsBusiness";
import DocsLaunchPlaybook from "./pages/docs/DocsLaunchPlaybook";
import DocsAdminGuide from "./pages/docs/DocsAdminGuide";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const HomeRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    const seen = localStorage.getItem('onboarding_seen');
    if (seen) {
      return <Auth />;
    }
    return <Onboarding />;
  }

  return <AppLayout><Dashboard /></AppLayout>;
};

const MobileBackHandler = () => {
  useMobileBackNavigation();
  return null;
};

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PWAUpdateBanner />
      <OfflineStatusBanner />
      <BrowserRouter>
        <AuthProvider>
            <MobileBackHandler />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<HomeRoute />} />
              <Route path="/course/:courseId" element={<AppLayout><CoursePage /></AppLayout>} />
              <Route path="/study" element={<AppLayout><Study /></AppLayout>} />
              <Route path="/notes" element={<AppLayout><SmartNotes /></AppLayout>} />
              <Route path="/tutor" element={<AppLayout><AITutor /></AppLayout>} />
              <Route path="/flashcards" element={<AppLayout><Flashcards /></AppLayout>} />
              <Route path="/quizzes" element={<AppLayout><Quizzes /></AppLayout>} />
              <Route path="/focus" element={<AppLayout><Focus /></AppLayout>} />
              <Route path="/achievements" element={<AppLayout><Achievements /></AppLayout>} />
              <Route path="/plan" element={<AppLayout><Plan /></AppLayout>} />
              <Route path="/social" element={<AppLayout><Social /></AppLayout>} />
              <Route path="/career" element={<AppLayout><Career /></AppLayout>} />
              <Route path="/safety" element={<AppLayout><Safety /></AppLayout>} />
              <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
              <Route path="/upgrade" element={<AppLayout><Upgrade /></AppLayout>} />
              <Route path="/chat" element={<AppLayout><Chat /></AppLayout>} />
              <Route path="/group/:groupId" element={<AppLayout><GroupChat /></AppLayout>} />
              <Route path="/focus-session" element={<AppLayout><FocusSession /></AppLayout>} />
              <Route path="/blocking-overlay" element={<BlockingOverlay />} />
              <Route path="/store" element={<AppLayout><Store /></AppLayout>} />
              <Route path="/exams" element={<AppLayout><ExamPrep /></AppLayout>} />
              <Route path="/admin-resources" element={<AdminResources />} />
              <Route path="/install" element={<Install />} />
              <Route path="/docs" element={<DocsLayout />}>
                <Route index element={<DocsHome />} />
                <Route path="architecture" element={<DocsArchitecture />} />
                <Route path="features" element={<DocsFeatures />} />
                <Route path="business" element={<DocsBusiness />} />
                <Route path="launch" element={<DocsLaunchPlaybook />} />
                <Route path="admin" element={<DocsAdminGuide />} />
              </Route>
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;