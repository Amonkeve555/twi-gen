import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index.tsx";
import History from "./pages/History.tsx";
import CreateLobby from "./pages/CreateLobby.tsx";
import JoinLobby from "./pages/JoinLobby.tsx";
import LobbyView from "./pages/LobbyView.tsx";
import GameDay from "./pages/GameDay.tsx";
import MyLobbies from "./pages/MyLobbies.tsx";
import FactionGuide from "./pages/FactionGuide.tsx";
import RulesAssistant from "./pages/RulesAssistant.tsx";
import Stats from "./pages/Stats.tsx";
import Auth from "./pages/Auth.tsx";
import ProfileSetup from "./pages/ProfileSetup.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile-setup" element={<AuthGuard requireProfile={false}><ProfileSetup /></AuthGuard>} />
          <Route path="/factions" element={<FactionGuide />} />
          <Route path="/rules" element={<RulesAssistant />} />
          <Route path="/history" element={<AuthGuard><History /></AuthGuard>} />
          <Route path="/stats" element={<AuthGuard><Stats /></AuthGuard>} />
          <Route path="/create" element={<AuthGuard><CreateLobby /></AuthGuard>} />
          <Route path="/join/:inviteCode" element={<AuthGuard><JoinLobby /></AuthGuard>} />
          <Route path="/lobby/:inviteCode" element={<AuthGuard><LobbyView /></AuthGuard>} />
          <Route path="/lobby/:inviteCode/gameday" element={<AuthGuard><GameDay /></AuthGuard>} />
          <Route path="/my-lobbies" element={<AuthGuard><MyLobbies /></AuthGuard>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
