import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useWelcome } from "@/hooks/useWelcome";
import WelcomeScreen from "@/components/welcome-screen";
import LoadingScreen from "@/components/ui/loading-screen";
import Home from "@/pages/home";
import ConversationPage from "@/pages/conversation";
import AuthPage from "@/pages/auth";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { showWelcome, isLoading: welcomeLoading, completeWelcome } = useWelcome();

  if (isLoading || welcomeLoading) {
    return <LoadingScreen />;
  }

  // Show welcome screen for authenticated users who haven't seen it
  if (isAuthenticated && showWelcome) {
    return (
      <WelcomeScreen 
        onComplete={completeWelcome}
        userName={user?.firstName || user?.username || undefined}
      />
    );
  }

  return (
    <Switch>
      <Route path="/login" component={AuthPage} />
      <Route path="/" component={isAuthenticated ? Home : AuthPage} />
      <Route path="/conversation/:id" component={isAuthenticated ? ConversationPage : AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
