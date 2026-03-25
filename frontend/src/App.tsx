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

const queryClient = new QueryClient();

const AppContent = () => {
  const [goalChecked, setGoalChecked] = useState(false);
  const [userGoal, setUserGoal] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useHabitReminder();
  useBackButton();

  useEffect(() => {
    const checkGoalAndNavigate = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAuthenticated(false);
          setGoalChecked(true);
          
          // If accessing root after splash, redirect to goal selection
          if (location.pathname === "/" && !location.state) {
            setTimeout(() => navigate("/goal-selection"), 100);
          }
          return;
        }

        setIsAuthenticated(true);

        // Fetch user goal
        const { data, error } = await supabase
          .from("users")
          .select("goal")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user goal:", error);
          setGoalChecked(true);
          return;
        }

        if (!data || !data.goal) {
          // No goal set, redirect to goal selection
          if (location.pathname !== "/goal-selection") {
            navigate("/goal-selection");
          }
        } else {
          setUserGoal(data.goal);
          
          // Redirect to appropriate home based on goal
          if (location.pathname === "/" || location.pathname === "/goal-selection") {
            if (data.goal === "JEE") {
              // JEE users stay on home
              if (location.pathname === "/goal-selection") {
                navigate("/");
              }
            } else {
              // Non-JEE users go to BuildLife
              navigate("/buildlife");
            }
          }
        }
        
        setGoalChecked(true);
      } catch (error) {
        console.error("Error in goal check:", error);
        setGoalChecked(true);
      }
    };

    checkGoalAndNavigate();
  }, [location.pathname]);

  if (!goalChecked) {
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

        {/* Home route - conditional based on goal */}
        <Route 
          path="/" 
          element={
            !isAuthenticated ? (
              <Navigate to="/goal-selection" replace />
            ) : userGoal === "JEE" ? (
              <Index />
            ) : (
              <Navigate to="/buildlife" replace />
            )
          } 
        />

        {/* JEE-only routes */}
        {userGoal === "JEE" && (
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
            <Route path="/pyq" element={<ChapterSelect />} />
          </>
        )}

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
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
        {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
