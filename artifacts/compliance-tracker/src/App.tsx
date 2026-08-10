import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Redirect, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";
import { LocationProvider } from "@/context/location-context";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

// Build appearance matching the Program Quality Manager brand
const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#10B981",
    colorForeground: "#1F2937",
    colorMutedForeground: "#6B7280",
    colorDanger: "#EF4444",
    colorBackground: "#FFFFFF",
    colorInput: "#F9FAFB",
    colorInputForeground: "#1F2937",
    colorNeutral: "#D1D5DB",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-xl w-[440px] max-w-full overflow-hidden shadow-lg",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-gray-900 font-semibold",
    headerSubtitle: "text-gray-500",
    socialButtonsBlockButtonText: "text-gray-700",
    formFieldLabel: "text-gray-700 font-medium",
    footerActionLink: "text-green-600 font-medium hover:text-green-700",
    footerActionText: "text-gray-500",
    dividerText: "text-gray-400",
    identityPreviewEditButton: "text-green-600",
    formFieldSuccessText: "text-green-600",
    alertText: "text-red-600",
    logoBox: "mb-2",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton: "border border-gray-200 hover:bg-gray-50",
    formButtonPrimary: "bg-green-600 hover:bg-green-700 text-white",
    formFieldInput: "border-gray-200 bg-gray-50 text-gray-900",
    footerAction: "bg-gray-50",
    dividerLine: "bg-gray-200",
    alert: "bg-red-50 border-red-200",
    otpCodeFieldInput: "border-gray-300",
    formFieldRow: "gap-2",
    main: "gap-4",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Texas Childcare Advisors</h1>
          <p className="text-gray-500 mt-1">Program Quality Manager</p>
        </div>
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Texas Childcare Advisors</h1>
          <p className="text-gray-500 mt-1">Create your account</p>
        </div>
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

// Import all pages lazily — build them below
import Dashboard from "@/pages/dashboard";
import LandingPage from "@/pages/landing";
import DemoPage from "@/pages/demo";
import StaffPage from "@/pages/staff";
import CertificationsPage from "@/pages/certifications";
import RisingStarPage from "@/pages/rising-star";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { AppShell } from "@/components/app-shell";

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/dashboard" /></Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function AuthenticatedApp() {
  return (
    <Show when="signed-in" fallback={<Redirect to="/" />}>
      <LocationProvider>
        <AppShell>
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/staff" component={StaffPage} />
            <Route path="/certifications" component={CertificationsPage} />
            <Route path="/rising-star" component={RisingStarPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route component={NotFound} />
          </Switch>
        </AppShell>
      </LocationProvider>
    </Show>
  );
}

function Router() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back", subtitle: "Sign in to your quality dashboard" } },
        signUp: { start: { title: "Create your account", subtitle: "Free tier: 15 staff, 3 locations" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <ErrorBoundary resetKey="app">
            <Switch>
              <Route path="/" component={HomeRedirect} />
              <Route path="/demo" component={DemoPage} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route path="/dashboard" component={AuthenticatedApp} />
              <Route path="/staff" component={AuthenticatedApp} />
              <Route path="/certifications" component={AuthenticatedApp} />
              <Route path="/rising-star" component={AuthenticatedApp} />
              <Route path="/settings" component={AuthenticatedApp} />
              <Route component={NotFound} />
            </Switch>
          </ErrorBoundary>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <Router />
    </WouterRouter>
  );
}

export default App;
