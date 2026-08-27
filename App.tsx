import { Switch, Route, useRoute, Router as WouterRouter } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/layout/navbar";
import Home from "@/pages/home";
import Contacts from "@/pages/contacts";
import Settings from "@/pages/settings";
import Consent from "@/pages/consent";
import CallCenters from "@/pages/call-centers";
import PrivacyPolicy from "@/pages/privacy-policy";
import NotFound from "@/pages/not-found";
import { Redirect } from "./components/ui/redirect";
import { useEffect } from "react";

interface ConsentProtectedRouteProps {
  component: React.ComponentType<any>;
  params?: any;
}

function ConsentProtectedRoute({ component: Component, ...rest }: ConsentProtectedRouteProps) {
  const [isConsentRoute] = useRoute("/consent");
  
  // Check if user has accepted all consent terms
  const { data: consentStatus, isLoading } = useQuery<{ hasConsent: boolean }>({
    queryKey: ["/api/consent/status"],
    retry: false,
  });
  
  // Emergency access for testing - check for bypass parameter
  const urlParams = new URLSearchParams(window.location.search);
  const bypassConsent = urlParams.get('bypass') === 'true';
  
  // If bypass is active, just render the component
  if (bypassConsent) {
    console.log("Bypassing consent check for testing purposes");
    return <Component {...rest} />;
  }
  
  // If loading, don't redirect yet
  if (isLoading) {
    return null;
  }
  
  // If user hasn't given consent and is not already on the consent page, redirect to consent
  if (!consentStatus?.hasConsent && !isConsentRoute) {
    console.log("No consent yet, redirecting to consent page");
    return <Redirect to="/consent" />;
  }
  
  // If user has consented, render the requested component
  return <Component {...rest} />;
}

// Import the test view
import TestView from "@/pages/test-view";

function Router() {
  return (
    <Switch>
      <Route path="/consent" component={Consent} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/test-view">
        {(params) => <TestView {...params} />}
      </Route>
      <Route path="/">
        {(params) => <ConsentProtectedRoute component={Home} {...params} />}
      </Route>
      <Route path="/contacts">
        {(params) => <ConsentProtectedRoute component={Contacts} {...params} />}
      </Route>
      <Route path="/settings">
        {(params) => <ConsentProtectedRoute component={Settings} {...params} />}
      </Route>
      <Route path="/call-centers">
        {(params) => <ConsentProtectedRoute component={CallCenters} {...params} />}
      </Route>
      <Route>
        {(params) => <NotFound {...params} />}
      </Route>
    </Switch>
  );
}

// Import the accessibility provider
import { AccessibilityProvider } from "@/lib/accessibilityContext";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <Navbar />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <Router />
            </main>
            {/* Mobile-friendly bottom spacing */}
            <div className="h-8 sm:h-4"></div>
          </div>
        </WouterRouter>
        <Toaster />
      </AccessibilityProvider>
    </QueryClientProvider>
  );
}

export default App;
