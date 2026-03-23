import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import History from "./pages/History.tsx";
import CreateLobby from "./pages/CreateLobby.tsx";
import JoinLobby from "./pages/JoinLobby.tsx";
import LobbyView from "./pages/LobbyView.tsx";
import GameDay from "./pages/GameDay.tsx";
import MyLobbies from "./pages/MyLobbies.tsx";
import FactionGuide from "./pages/FactionGuide.tsx";
import RulesAssistant from "./pages/RulesAssistant.tsx";
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
          <Route path="/history" element={<History />} />
          <Route path="/create" element={<CreateLobby />} />
          <Route path="/join/:inviteCode" element={<JoinLobby />} />
          <Route path="/lobby/:inviteCode" element={<LobbyView />} />
          <Route path="/lobby/:inviteCode/gameday" element={<GameDay />} />
          <Route path="/my-lobbies" element={<MyLobbies />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
