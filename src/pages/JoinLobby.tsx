import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StarField from "@/components/StarField";
import TokenGrid from "@/components/TokenGrid";
import FactionCard from "@/components/FactionCard";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/sessionId";
import { useLobby, type LobbySettings } from "@/hooks/useLobby";
import type { Faction } from "@/data/factions";

type JoinPhase = "name" | "pick" | "done";

const JoinLobby = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { lobby, players, loading, error } = useLobby(inviteCode);
  const sessionId = getSessionId();

  const [playerName, setPlayerName] = useState("");
  const [phase, setPhase] = useState<JoinPhase>("name");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [tokenPicks, setTokenPicks] = useState<number[]>([]);
  const [assignedFactions, setAssignedFactions] = useState<Faction[]>([]);

  // Check if already joined
  const existingPlayer = players.find((p) => p.session_id === sessionId);

  const settings = lobby?.settings as LobbySettings | undefined;
  const tokenMapping = lobby?.token_mapping as Record<string, Faction> | null;
  const totalTokens = settings?.factions?.length ?? 0;
  const picksPerPlayer = settings?.picks_per_player ?? 1;

  // Build taken tokens map from all players
  const takenTokens = useMemo(() => {
    const map = new Map<number, number>();
    players.forEach((p, pIdx) => {
      p.token_picks?.forEach((t) => map.set(t, pIdx));
    });
    return map;
  }, [players]);

  const isFull = players.length >= (settings?.max_players ?? 99);

  const joinLobby = async () => {
    if (!lobby || !playerName.trim()) return;

    const { data, error: err } = await supabase
      .from("lobby_players")
      .insert({
        lobby_id: lobby.id,
        session_id: sessionId,
        player_name: playerName.trim(),
      })
      .select("id")
      .single();

    if (err) {
      console.error(err);
      return;
    }

    setPlayerId(data.id);
    setPhase("pick");
  };

  const selectToken = useCallback(
    async (tokenId: number) => {
      if (!lobby || !playerId) return;

      const { data, error: err } = await supabase.rpc("claim_token", {
        p_lobby_id: lobby.id,
        p_player_id: playerId,
        p_token_id: tokenId,
      });

      if (err) {
        toast.error("Failed to claim token");
        console.error(err);
        return;
      }

      const result = data as { success?: boolean; error?: string; faction?: Faction };

      if (result.error) {
        toast.error(result.error);
        return;
      }

      const newPicks = [...tokenPicks, tokenId];
      setTokenPicks(newPicks);
      if (result.faction) {
        setAssignedFactions((prev) => [...prev, result.faction as Faction]);
      }

      if (newPicks.length >= picksPerPlayer) {
        setPhase("done");
      }
    },
    [lobby, tokenPicks, playerId, picksPerPlayer]
  );

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <StarField />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <p className="font-display text-primary text-glow">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !lobby) {
    return (
      <div className="min-h-screen relative">
        <StarField />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="font-display text-destructive">{error || "Lobby not found"}</p>
          <Button variant="outline" onClick={() => navigate("/")} className="font-display text-xs uppercase tracking-[0.15em] border-border text-muted-foreground hover:text-primary hover:border-primary/40">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // If player already joined and picked
  if (existingPlayer && existingPlayer.token_picks && existingPlayer.token_picks.length >= picksPerPlayer) {
    return (
      <div className="min-h-screen relative">
        <StarField />
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-12 space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <h1 className="font-display text-3xl text-primary text-glow mb-2">
              You've already picked!
            </h1>
            <p className="font-body text-muted-foreground">{existingPlayer.player_name}</p>
          </motion.div>

          <div className="glass imperial-border rounded p-6 space-y-3">
            <h2 className="font-display text-base uppercase tracking-[0.2em] text-primary text-glow text-center mb-4">
              Your Factions
            </h2>
            {(existingPlayer.assigned_factions as unknown as Faction[])?.map((f, i) => (
              <FactionCard key={f.name} playerName={existingPlayer.player_name} faction={f} index={i} />
            ))}
          </div>

          <div className="flex justify-center">
            <Button onClick={() => navigate(`/lobby/${inviteCode}`)} className="font-display text-sm uppercase tracking-[0.2em] glow-primary px-10 py-6 bg-primary text-primary-foreground hover:bg-primary/90">
              View Lobby
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <StarField />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-black tracking-[0.15em] text-primary text-glow mb-2">
            Join Game
          </h1>
          <p className="font-display text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Lobby {inviteCode}
          </p>
          <div className="imperial-divider w-48 mx-auto mt-4" />
        </motion.div>

        {phase === "name" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {isFull ? (
              <div className="glass imperial-border rounded p-6 text-center">
                <p className="font-display text-destructive">Lobby is full ({settings?.max_players} players)</p>
              </div>
            ) : (
              <div className="glass imperial-border rounded p-6 space-y-4">
                <h2 className="font-display text-sm uppercase tracking-[0.2em] text-primary text-glow">
                  Enter Your Name
                </h2>
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Your name"
                  className="bg-input border-border font-body text-foreground focus:border-primary/40 rounded"
                  onKeyDown={(e) => e.key === "Enter" && joinLobby()}
                />
                <p className="font-body text-xs text-muted-foreground">
                  {players.length}/{settings?.max_players} players joined · {picksPerPlayer} pick{picksPerPlayer > 1 ? "s" : ""} per player
                </p>
                <Button
                  onClick={joinLobby}
                  disabled={!playerName.trim()}
                  className="w-full font-display text-sm uppercase tracking-[0.2em] glow-primary bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Join Game
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {phase === "pick" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="text-center glass imperial-border rounded p-4">
              <p className="text-muted-foreground text-sm font-body uppercase tracking-[0.15em] mb-1">
                Selecting tokens
              </p>
              <p className="font-display text-xl text-primary text-glow">{playerName}</p>
              <p className="text-muted-foreground text-xs font-body mt-1">
                Pick {tokenPicks.length + 1} of {picksPerPlayer}
              </p>
            </div>

            <TokenGrid
              totalTokens={totalTokens}
              takenTokens={takenTokens}
              players={players.map((p) => p.player_name)}
              onSelectToken={selectToken}
            />
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h2 className="font-display text-sm uppercase tracking-[0.3em] text-primary text-glow text-center">
              Your Assigned Factions
            </h2>
            <div className="imperial-divider w-32 mx-auto" />
            <div className="grid gap-3">
              {assignedFactions.map((f, i) => (
                <FactionCard key={f.name} playerName={playerName} faction={f} index={i} />
              ))}
            </div>
            {picksPerPlayer > 1 && (
              <p className="text-center font-body text-sm text-muted-foreground">
                You'll choose which faction to play on game day
              </p>
            )}
            <div className="flex justify-center">
              <Button onClick={() => navigate(`/lobby/${inviteCode}`)} className="font-display text-sm uppercase tracking-[0.2em] glow-primary px-10 py-6 bg-primary text-primary-foreground hover:bg-primary/90">
                View Lobby
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default JoinLobby;
