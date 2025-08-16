import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import InventoryApp from "@/pages/inventory/InventoryApp";
import JarvisApp from "@/pages/jarvis/JarvisApp";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/inventory" component={InventoryApp} />
      <Route path="/login/callback" component={InventoryApp} />
      <Route path="/jarvis" component={JarvisApp} />
      <Route path="/jarvis/callback" component={JarvisApp} />
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
