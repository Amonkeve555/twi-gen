import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StarField from "@/components/StarField";
import FactionPool from "@/components/FactionPool";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/sessionId";
import { generateInviteCode } from "@/lib/inviteCode";
import { TI4_FACTIONS, POK_FACTIONS, type Faction } from "@/data/factions";

const CreateLobby = () => {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState("Host");
  const [maxPlayers, setMaxPlayers] = useState(3);
  const [picksPerPlayer, setPicksPerPlayer] = useState(1);
  const [includePok, setIncludePok] = useState(false);
  const [excludedFactions, setExcludedFactions] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const availableFactions = useMemo(() => {
    return [...TI4_FACTIONS, ...(includePok ? POK_FACTIONS : [])].filter(
      (f) => !excludedFactions.has(f.name)
    );
  }, [includePok, excludedFactions]);

  const canCreate = availableFactions.length >= maxPlayers * picksPerPlayer;

  const toggleFaction = useCallback((name: string) => {
    setExcludedFactions((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const createLobby = async () => {
    setCreating(true);
    const code = generateInviteCode();
    const sessionId = getSessionId();

    // Shuffle factions and create token mapping
    const shuffled = [...availableFactions].sort(() => Math.random() - 0.5);
    const tokenMapping: Record<string, Faction> = {};
    shuffled.forEach((f, i) => tokenMapping[String(i + 1)] = f);

    const settings = {
      factions: availableFactions,
      picks_per_player: picksPerPlayer,
      max_players: maxPlayers,
    };

    const { error } = await supabase.from("lobbies").insert([{
      invite_code: code,
      host_session_id: sessionId,
      host_name: hostName,
      settings: JSON.parse(JSON.stringify(settings)),
      token_mapping: JSON.parse(JSON.stringify(tokenMapping)),
    }]);

    if (error) {
      console.error(error);
      setCreating(false);
      return;
    }

    setCreatedCode(code);
    setCreating(false);
  };

  const copyLink = () => {
    const url = `${window.location.origin}/join/${createdCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen relative">
      <StarField />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="font-display text-2xl md:text-3xl font-black tracking-[0.15em] text-primary text-glow mb-2">
            Create Game Lobby
          </h1>
          <div className="imperial-divider w-48 mx-auto mt-4" />
        </motion.div>

        {!createdCode ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="glass imperial-border rounded p-6 space-y-6 mb-6">
              <div className="space-y-3">
                <h2 className="font-display text-sm uppercase tracking-[0.2em] text-primary text-glow">
                  Host Name
                </h2>
                <Input
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="bg-input border-border font-body text-foreground focus:border-primary/40 rounded"
                />
              </div>

              <div className="imperial-divider" />

              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm uppercase tracking-[0.2em] text-primary text-glow">
                  Max Players
                </h2>
                <div className="flex items-center gap-2">
                  {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <Button
                      key={n}
                      variant={maxPlayers === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMaxPlayers(n)}
                      className={`h-8 w-8 font-display text-sm ${
                        maxPlayers === n
                          ? "bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:text-primary hover:border-primary/40"
                      }`}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="imperial-divider" />

              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm uppercase tracking-[0.2em] text-primary text-glow">
                  Picks per Player
                </h2>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((n) => (
                    <Button
                      key={n}
                      variant={picksPerPlayer === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPicksPerPlayer(n)}
                      className={`h-8 w-8 font-display text-sm ${
                        picksPerPlayer === n
                          ? "bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:text-primary hover:border-primary/40"
                      }`}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="imperial-divider" />

              <FactionPool
                includePok={includePok}
                onIncludePokChange={setIncludePok}
                excludedFactions={excludedFactions}
                onToggleFaction={toggleFaction}
              />
            </div>

            <div className="flex flex-col items-center gap-3">
              <Button
                onClick={createLobby}
                disabled={!canCreate || creating}
                size="lg"
                className="font-display text-sm uppercase tracking-[0.2em] glow-primary px-10 py-6 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {creating ? "Creating..." : "Create Lobby"}
              </Button>
              {!canCreate && (
                <p className="text-destructive text-sm font-body">
                  Not enough factions ({availableFactions.length}) for {maxPlayers} players × {picksPerPlayer} picks
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/")}
                className="font-display text-xs uppercase tracking-[0.15em] border-border text-muted-foreground hover:text-primary hover:border-primary/40"
              >
                <ArrowLeft className="mr-2 h-3 w-3" />
                Back
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="glass imperial-border rounded p-6 text-center space-y-4">
              <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Lobby Created! Share this link:
              </p>
              <div className="flex items-center gap-2 justify-center">
                <code className="font-body text-lg text-primary bg-secondary px-4 py-2 rounded">
                  {createdCode}
                </code>
                <Button variant="outline" size="icon" onClick={copyLink} className="border-border text-muted-foreground hover:text-primary hover:border-primary/40">
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="font-body text-xs text-muted-foreground">
                {`${window.location.origin}/join/${createdCode}`}
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <Button
                onClick={() => navigate(`/lobby/${createdCode}`)}
                size="lg"
                className="font-display text-sm uppercase tracking-[0.2em] glow-primary px-10 py-6 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Go to Lobby
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CreateLobby;
