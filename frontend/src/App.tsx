import { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BottomNavBar } from "@/components/BottomNavBar";
import { SplashScreen } from "@/components/SplashScreen";
import { useHabitReminder } from "@/hooks/useHabitReminder";
import { useBackButton } from "@/hooks/useBackButton";
import { useAndroidBackButton } from "@/hooks/useAndroidBackButton";
import { supabase } from "@/integrations/supabase/client";
import { App as CapacitorApp } from "@capacitor/app";
import { checkSubscriptionStatus } from "@/utils/subscriptionUtils";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import OtpVerification from "./pages/OtpVerification";
import PasswordReset from "./pages/PasswordReset";
import ChapterSelect from "./pages/ChapterSelect";
import QuestionList from "./pages/QuestionList";
import QuestionScreen from "./pages/QuestionScreen";
import Subscription from "./pages/Subscription";
import MockTestList from "./pages/MockTestList";
import MockTestInstructions from "./pages/MockTestInstructions";
import MockTest from "./pages/MockTest";
import MockTestResult from "./pages/MockTestResult";
import AIChat from "./pages/AIChat";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import RefundPolicy from "./pages/RefundPolicy";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import WeeklyContest from "./pages/WeeklyContest";
import TeamDashboard from "./pages/TeamDashboard";
import TeamBattleMockTest from "./pages/TeamBattleMockTest";
import SundayResults from "./pages/SundayResults";
import ContestPage from "./pages/ContestPage";
import StudyPlanner from "./pages/StudyPlanner";
import StudyHours from "./pages/StudyHours";
import FocusRoom from "./pages/FocusRoom";
import RankJourney from "./pages/RankJourney";
import MentorDiscovery from "./pages/MentorDiscovery";
import BecomeMentor from "./pages/BecomeMentor";
import MockTestSolutions from "./pages/MockTestSolutions";
import MentorProfilePage from "./pages/MentorProfilePage";
import MentorApplication from "./pages/MentorApplication";
import GoalSelection from "./pages/GoalSelection";
import AdminPanel from "./pages/AdminPanel";
import StudentMentorDashboard from "./pages/StudentMentorDashboard";
import MentorDashboard from "./pages/MentorDashboard";
import MentorChat from "./pages/MentorChat";
import Posts from "./pages/Posts";
import NotesList from "./pages/NotesList";
import NotesViewer from "./pages/NotesViewer";
import AdminNotesUpload from "./pages/AdminNotesUpload";

const queryClient = new QueryClient();

const AppContent = () => {
  const [userGoal, setUserGoal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useHabitReminder();
  useBackButton();
  useAndroidBackButton();

  // Deep link handler — catches OAuth callback on Android
  useEffect(() => {
    let listener: any;

    const setup = async () => {
      listener = await CapacitorApp.addListener("appUrlOpen", async ({ url }) => {
        console.log("AppContent deep link:", url);

        if (!url.includes("auth/callback") && !url.includes("access_token")) return;

        // Retry up to 10 times with 500ms intervals (5 seconds total)
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 500));
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            window.dispatchEvent(new Event("goalSaved"));
            navigate("/", { replace: true });
            return;
          }
        }

        // If session never appeared, send to goal selection as fallback
        console.warn("AppContent: session never established after OAuth callback");
        navigate("/goal-selection", { replace: true });
      });
    };

    setup();
    return () => { listener?.remove(); };
  }, [navigate]);

  useEffect(() => {
    const fetchUserGoal = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        if (location.pathname === "/") {
          navigate("/goal-selection");
        }
        return;
      }

      // Check subscription status on app load
      const { isActive, daysRemaining } = await checkSubscriptionStatus(user.id);
      if (!isActive && daysRemaining === 0) {
        console.log("📅 Subscription expired. User needs to renew.");
        // Subscription is expired but we don't force navigation here
        // User can still browse and will be prompted when accessing premium features
      } else if (isActive && daysRemaining <= 3) {
        console.log(`⚠️ Subscription expiring soon: ${daysRemaining} days remaining`);
      }

      const { data } = await supabase
        .from("users")
        .select("goal")
        .eq("id", user.id)
        .maybeSingle();

      if (!data || !data.goal) {
        setLoading(false);
        if (location.pathname === "/") {
          navigate("/goal-selection");
        }
        return;
      }

      setUserGoal(data.goal);
      setLoading(false);
    };

    fetchUserGoal();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        fetchUserGoal();
      }
    });

    const handleGoalSaved = () => fetchUserGoal();
    window.addEventListener("goalSaved", handleGoalSaved);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("goalSaved", handleGoalSaved);
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <>
      <Routes>
        <Route path="/goal-selection" element={<GoalSelection />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/otp-verification" element={<OtpVerification />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsConditions />} />
        <Route path="/refund" element={<RefundPolicy />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/buildlife" element={<Navigate to="/goal-selection" replace />} />
        <Route path="/buildlife-subscription" element={<Navigate to="/subscription" replace />} />

        <Route
          path="/"
          element={
            (userGoal === "JEE" || userGoal === "NEET")
              ? <Index />
              : <Navigate to="/goal-selection" replace />
          }
        />

        {(userGoal === "JEE" || userGoal === "NEET") ? (
          <>
            <Route path="/chapters/:subject" element={<ChapterSelect />} />
            <Route path="/questions/:chapterName" element={<QuestionList />} />
            <Route path="/question/:questionId" element={<QuestionScreen />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/mock-tests" element={<MockTestList />} />
            <Route path="/mock-test/instructions/:testId" element={<MockTestInstructions />} />
            <Route path="/mock-test/:testId" element={<MockTest />} />
            <Route path="/mock-test/result/:resultId" element={<MockTestResult />} />
            <Route path="/mock-test-solutions/:resultId" element={<MockTestSolutions />} />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="/weekly-contest" element={<WeeklyContest />} />
            <Route path="/contest/:contestId" element={<ContestPage />} />
            <Route path="/team" element={<TeamDashboard />} />
            <Route path="/team/:teamId" element={<TeamDashboard />} />
            <Route path="/team-battle/:challengeId" element={<TeamBattleMockTest />} />
            <Route path="/sunday-results" element={<SundayResults />} />
            <Route path="/planner" element={<StudyPlanner />} />
            <Route path="/study-hours" element={<StudyHours />} />
            <Route path="/focus-room" element={<FocusRoom />} />
            <Route path="/rank-journey" element={<RankJourney />} />
            <Route path="/mentors" element={<MentorDiscovery />} />
            <Route path="/mentor/:id" element={<MentorProfilePage />} />
            <Route path="/become-mentor" element={<BecomeMentor />} />
            <Route path="/mentor-application" element={<MentorApplication />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/student-mentors" element={<StudentMentorDashboard />} />
            <Route path="/mentor-dashboard" element={<MentorDashboard />} />
            <Route path="/mentor-chat/:sessionId" element={<MentorChat />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/notes" element={<NotesList />} />
            <Route path="/notes/:noteId" element={<NotesViewer />} />
            <Route path="/admin/notes" element={<AdminNotesUpload />} />
            <Route path="/pyq" element={<ChapterSelect />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/goal-selection" replace />} />
        )}

        <Route path="/404" element={<NotFound />} />
      </Routes>

      {(userGoal === "JEE" || userGoal === "NEET") && <BottomNavBar />}
    </>
  );
};

const App = () => {
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashComplete = useCallback(() => {
    setSplashDone(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {!splashDone ? (
          <SplashScreen onComplete={handleSplashComplete} />
        ) : (
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
