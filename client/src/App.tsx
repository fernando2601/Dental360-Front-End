import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./lib/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import MainLayout from "./layouts/main-layout";
import Dashboard from "@/pages/dashboard";
import Appointments from "@/pages/appointments";
import Clients from "@/pages/clients";
import Inventory from "@/pages/inventory";
import Finances from "@/pages/finances";
import Services from "@/pages/services";
import Staff from "@/pages/staff";
import WhatsApp from "@/pages/whatsapp";
import Packages from "@/pages/packages";
import Subscriptions from "@/pages/subscriptions";
import ClinicInfo from "@/pages/clinic-info";
import BeforeAfter from "@/pages/before-after";
import Knowledge from "@/pages/knowledge";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import ResetPassword from "@/pages/reset-password";

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <Login />
      </Route>
      <Route path="/reset-password">
        <ResetPassword />
      </Route>
      <Route>
        <MainLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/appointments" component={Appointments} />
            <Route path="/clients" component={Clients} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/finances" component={Finances} />
            <Route path="/services" component={Services} />
            <Route path="/staff" component={Staff} />
            <Route path="/whatsapp" component={WhatsApp} />
            <Route path="/packages" component={Packages} />
            <Route path="/subscriptions" component={Subscriptions} />
            <Route path="/clinic-info" component={ClinicInfo} />
            <Route path="/before-after" component={BeforeAfter} />
            <Route path="/knowledge" component={Knowledge} />
            <Route component={NotFound} />
          </Switch>
        </MainLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;