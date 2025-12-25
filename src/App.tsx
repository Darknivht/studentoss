import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Study from "./pages/Study";
import SmartNotes from "./pages/SmartNotes";
import AITutor from "./pages/AITutor";
import Flashcards from "./pages/Flashcards";
import Quizzes from "./pages/Quizzes";
import Focus from "./pages/Focus";
import Plan from "./pages/Plan";
import Social from "./pages/Social";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/study" element={<AppLayout><Study /></AppLayout>} />
            <Route path="/notes" element={<AppLayout><SmartNotes /></AppLayout>} />
            <Route path="/tutor" element={<AppLayout><AITutor /></AppLayout>} />
            <Route path="/flashcards" element={<AppLayout><Flashcards /></AppLayout>} />
            <Route path="/quizzes" element={<AppLayout><Quizzes /></AppLayout>} />
            <Route path="/focus" element={<AppLayout><Focus /></AppLayout>} />
            <Route path="/plan" element={<AppLayout><Plan /></AppLayout>} />
            <Route path="/social" element={<AppLayout><Social /></AppLayout>} />
            <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;