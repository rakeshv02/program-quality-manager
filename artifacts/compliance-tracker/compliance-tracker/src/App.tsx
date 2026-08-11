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
import Dashboard from "@/pages/dashboard";
import LandingPage from "@/pages/landing";
import DemoPage from "@/pages/demo";
import StaffPage from "@/pages/staff";
import CertificationsPage from "@/pages/certifications";
import RisingStarPage from "@/pages/rising-star";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { AppShell } from "@/components/app-shell";

const queryClient = new QueryClient();
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');

function SignInPage() {
  return <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}

function SignUpPage() {
  return <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) queryClient.clear();
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);
  return null;
}

function HomeRedirect() {
  return <><Show when="signed-in"><Redirect to="/dashboard" /></Show><Show when="signed-out"><LandingPage /></Show></>;
}

function AuthenticatedApp() {
  return <Show when="signed-in" fallback={<Redirect to="/" />}><LocationProvider><AppShell><Switch><Route path="/dashboard" component={Dashboard} /><Route path="/staff" component={StaffPage} /><Route path="/certifications" component={CertificationsPage} /><Route path="/rising-star" component={RisingStarPage} /><Route path="/settings" component={SettingsPage} /><Route component={NotFound} /></Switch></AppShell></LocationProvider></Show>;
}

function Router() {
  const [, setLocation] = useLocation();
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={{ theme: shadcn }} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} routerPush={(to) => setLocation(stripBase(to))} routerReplace={(to) => setLocation(stripBase(to), { replace: true })}><QueryClientProvider client={queryClient}><TooltipProvider><ClerkQueryClientCacheInvalidator /><ErrorBoundary resetKey="app"><Switch><Route path="/" component={HomeRedirect} /><Route path="/demo" component={DemoPage} /><Route path="/sign-in/*?" component={SignInPage} /><Route path="/sign-up/*?" component={SignUpPage} /><Route path="/dashboard" component={AuthenticatedApp} /><Route path="/staff" component={AuthenticatedApp} /><Route path="/certifications" component={AuthenticatedApp} /><Route path="/rising-star" component={AuthenticatedApp} /><Route path="/settings" component={AuthenticatedApp} /><Route component={NotFound} /></Switch></ErrorBoundary><Toaster /></TooltipProvider></QueryClientProvider></ClerkProvider>;
}

function App() {
  return <WouterRouter base={basePath}><Router /></WouterRouter>;
}

export default App;
