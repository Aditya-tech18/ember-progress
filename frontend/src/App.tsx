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
import BuildLifePlanner from "./pages/BuildLifePlanner";
import BuildLifeSubscription from "./pages/BuildLifeSubscription";
import AdminPanel from "./pages/AdminPanel";
import StudentMentorDashboard from "./pages/StudentMentorDashboard";
import MentorDashboard from "./pages/MentorDashboard";
import MentorChat from "./pages/MentorChat";
import Posts from "./pages/Posts";

const queryClient = new QueryClient();

const AppContent = () => {
  const [userGoal, setUserGoal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useHabitReminder();
  useBackButton();
  useAndroidBackButton(); // Add Android back button handler

  useEffect(() => {
    const fetchUserGoal = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        setInitialCheckDone(true);
        // Not logged in, check if on root path
        if (location.pathname === "/") {
          navigate("/goal-selection");
        }
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("goal")
        .eq("id", user.id)
        .maybeSingle();

      if (!data || !data.goal) {
        // User logged in but no goal
        setLoading(false);
        setInitialCheckDone(true);
        if (location.pathname === "/") {
          navigate("/goal-selection");
        }
        return;
      }

      // User has a goal
      setUserGoal(data.goal);
      setLoading(false);
      setInitialCheckDone(true);
      
      // Only redirect on initial load from root
      if (!initialCheckDone && location.pathname === "/") {
        if (data.goal === "JEE") {
          // Stay on home for JEE users
        } else {
          // Redirect to buildlife for non-JEE users
          navigate("/buildlife");
        }
      }
    };

    fetchUserGoal();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserGoal();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/goal-selection" element={<GoalSelection />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/otp-verification" element={<OtpVerification />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsConditions />} />
        <Route path="/refund" element={<RefundPolicy />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />

        {/* BuildLife routes (non-JEE users) */}
        <Route path="/buildlife" element={<BuildLifePlanner />} />
        <Route path="/buildlife-subscription" element={<BuildLifeSubscription />} />

        {/* Home route */}
        <Route 
          path="/" 
          element={
            userGoal === "JEE" ? <Index /> : <Navigate to="/goal-selection" replace />
          } 
        />

        {/* JEE-only routes */}
        {userGoal === "JEE" ? (
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
            <Route path="/pyq" element={<ChapterSelect />} />
          </>
        ) : (
          // Non-JEE users trying to access JEE routes get redirected
          <Route path="*" element={<Navigate to="/goal-selection" replace />} />
        )}

        {/* 404 for truly unknown routes */}
        <Route path="/404" element={<NotFound />} />
      </Routes>
      
      {/* Only show bottom nav for JEE users */}
      {userGoal === "JEE" && <BottomNavBar />}
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
