import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Admin from "@/pages/Admin";
import PublicSignature from "@/pages/PublicSignature";
import Join from "@/pages/Join";
import Signup from "@/pages/Signup";
import Login from "@/pages/Login";
import Pricing from "@/pages/Pricing";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Redirect } from "wouter";

// Gate /admin behind an authenticated session. The server's DEMO_MODE flag
// (dev only) transparently binds unauthenticated visitors to the demo
// workspace, so /api/auth/me returns a company and this check passes without
// a real login. In production DEMO_MODE=false, so unauthenticated visitors
// get bounced to /login.
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { company, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }
  if (!company) return <Redirect to="/login" />;
  return <>{children}</>;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/admin">
        {() => (
          <RequireAuth>
            <Admin />
          </RequireAuth>
        )}
      </Route>
      <Route path="/s/:companySlug/:staffSlug" component={PublicSignature} />
      <Route path="/join/:token" component={Join} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router hook={useHashLocation}>
            <AppRouter />
          </Router>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
