import { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import StarField from "@/components/StarField";
import TokenGrid from "@/components/TokenGrid";
import FactionCard from "@/components/FactionCard";
import FactionPicker from "@/components/FactionPicker";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/sessionId";
import { useLobby, type LobbySettings } from "@/hooks/useLobby";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { getLastPlayedFactionName } from "@/lib/lastPlayedFaction";
import type { Faction } from "@/data/factions";

type JoinPhase = "intro" | "pick" | "done";

const JoinLobby = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { lobby, players, loading, error } = useLobby(inviteCode);
  const { user } = useAuth();
  const { profile } = useProfile();

  const [phase, setPhase] = useState<JoinPhase>("intro");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [tokenPicks, setTokenPicks] = useState<number[]>([]);
  const [assignedFactions, setAssignedFactions] = useState<Faction[]>([]);
  const [joining, setJoining] = useState(false);
  const [forbiddenTokens, setForbiddenTokens] = useState<Set<number>>(new Set());
  const [lastFactionName, setLastFactionName] = useState<string | null>(null);

  const existingPlayer = players.find((p) => p.user_id === user?.id);

  const settings = lobby?.settings as LobbySettings | undefined;
  const tokenMapping = lobby?.token_mapping as Record<string, Faction> | null;
  const totalTokens = settings?.factions?.length ?? 0;
  const picksPerPlayer = settings?.picks_per_player ?? 1;
  const draftMode = settings?.draft_mode ?? "token";
  const isFreeMode = draftMode === "free" || draftMode === "free_no_repeat";
  const isNoRepeat = draftMode === "free_no_repeat" || draftMode === "token_no_repeat";

  const takenTokens = useMemo(() => {
    const map = new Map<number, number>();
    players.forEach((p, pIdx) => {
      p.token_picks?.forEach((t) => map.set(t, pIdx));
    });
    return map;
  }, [players]);

  const takenFactions = useMemo(() => {
    const map = new Map<string, string>();
    players.forEach((p) => {
      const cf = p.chosen_faction as unknown as Faction | null;
      if (cf?.name) map.set(cf.name, p.player_name);
    });
    return map;
  }, [players]);

  const isFull = players.length >= (settings?.max_players ?? 99);

  // Resume in-progress pick
  useEffect(() => {
    if (existingPlayer && phase === "intro") {
      const picks = existingPlayer.token_picks ?? [];
      const factions = (existingPlayer.assigned_factions as unknown as Faction[]) ?? [];
      setPlayerId(existingPlayer.id);
      setTokenPicks(picks);
      setAssignedFactions(factions);
      const isDone = isFreeMode
        ? !!existingPlayer.chosen_faction
        : picks.length >= picksPerPlayer;
      setPhase(isDone ? "done" : "pick");
    }
  }, [existingPlayer, phase, picksPerPlayer, isFreeMode]);

  // Fetch user's last played faction (for no-repeat modes)
  useEffect(() => {
    if (!isNoRepeat || !user) {
      setLastFactionName(null);
      return;
    }
    let cancelled = false;
    getLastPlayedFactionName(user.id).then((name) => {
      if (!cancelled) setLastFactionName(name);
    });
    return () => {
      cancelled = true;
    };
  }, [isNoRepeat, user]);

  // Fetch forbidden tokens for token_no_repeat mode
  useEffect(() => {
    if (draftMode !== "token_no_repeat" || !lobby || !playerId) {
      setForbiddenTokens(new Set());
      return;
    }
    let cancelled = false;
    supabase
      .rpc("get_forbidden_tokens", { p_lobby_id: lobby.id })
      .then(({ data }) => {
        if (cancelled) return;
        const arr = (data as number[] | null) ?? [];
        setForbiddenTokens(new Set(arr));
      });
    return () => {
      cancelled = true;
    };
  }, [draftMode, lobby, playerId, players]);

  const joinLobby = async () => {
    if (!lobby || !user || !profile?.nickname) return;
    setJoining(true);
    const sessionId = getSessionId();
    const { data, error: err } = await supabase
      .from("lobby_players")
      .insert({
        lobby_id: lobby.id,
        session_id: sessionId,
        user_id: user.id,
        player_name: profile.nickname,
      })
      .select("id")
      .single();
    setJoining(false);
    if (err) {
      console.error(err);
      toast.error(err.message);
      return;
    }
    setPlayerId(data.id);
    setPhase("pick");
  };

  const selectToken = useCallback(
    async (tokenId: number) => {
      if (!lobby || !playerId) return;
      if (forbiddenTokens.has(tokenId)) {
        toast.error("That token maps to the faction you played last game");
        return;
      }
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
      if (result.error) { toast.error(result.error); return; }
      const newPicks = [...tokenPicks, tokenId];
      setTokenPicks(newPicks);
      if (result.faction) setAssignedFactions((prev) => [...prev, result.faction as Faction]);
      if (newPicks.length >= picksPerPlayer) setPhase("done");
    },
    [lobby, tokenPicks, playerId, picksPerPlayer, forbiddenTokens]
  );

  const selectFaction = useCallback(
    async (faction: Faction) => {
      if (!lobby || !playerId) return;
      const { data, error: err } = await supabase.rpc("claim_faction", {
        p_lobby_id: lobby.id,
        p_player_id: playerId,
        p_faction: JSON.parse(JSON.stringify(faction)),
      });
      if (err) {
        toast.error("Failed to claim faction");
        console.error(err);
        return;
      }
      const result = data as { success?: boolean; error?: string };
      if (result.error) {
        const msg =
          result.error === "already_taken"
            ? "That faction was just taken"
            : result.error === "previous_faction"
            ? "You played that faction last game"
            : result.error;
        toast.error(msg);
        return;
      }
      setTokenPicks([0]);
      setAssignedFactions([faction]);
      setPhase("done");
    },
    [lobby, playerId]
  );

  // For free_no_repeat: relax forbidden if no other faction is available
  const freeForbiddenRelaxed = useMemo(() => {
    if (draftMode !== "free_no_repeat" || !lastFactionName) return false;
    const pool = settings?.factions ?? [];
    const otherAvailable = pool.some(
      (f) => f.name !== lastFactionName && !takenFactions.has(f.name)
    );
    return !otherAvailable;
  }, [draftMode, lastFactionName, settings, takenFactions]);


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

  const playerName = profile?.nickname ?? "Player";

  return (
    <div className="min-h-screen relative">
      <StarField />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-black tracking-[0.15em] text-primary text-glow mb-2">
            Join Game
          </h1>
          <p className="font-display text-sm uppercase tracking-[0.4em] text-muted-foreground">
            Lobby {inviteCode}
          </p>
          <div className="imperial-divider w-48 mx-auto mt-4" />
        </motion.div>

        {phase === "intro" && !existingPlayer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {isFull ? (
              <div className="glass imperial-border rounded p-6 text-center">
                <p className="font-display text-destructive">Lobby is full ({settings?.max_players} players)</p>
              </div>
            ) : (
              <div className="glass imperial-border rounded p-6 space-y-4 text-center">
                <h2 className="font-display text-base uppercase tracking-[0.2em] text-primary text-glow">
                  Joining as
                </h2>
                <p className="font-display text-2xl text-primary">{playerName}</p>
                <p className="font-body text-base text-muted-foreground">
                  {players.length}/{settings?.max_players} players joined · {picksPerPlayer} pick{picksPerPlayer > 1 ? "s" : ""} per player
                </p>
                <Button
                  onClick={joinLobby}
                  disabled={joining}
                  className="w-full font-display text-sm uppercase tracking-[0.2em] glow-primary bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {joining ? "Joining..." : "Join Game"}
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {phase === "pick" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="text-center glass imperial-border rounded p-4">
              <p className="text-muted-foreground text-base font-body uppercase tracking-[0.15em] mb-1">
                Selecting tokens
              </p>
              <p className="font-display text-xl text-primary text-glow">{playerName}</p>
              <p className="text-muted-foreground text-base font-body mt-1">
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
            <h2 className="font-display text-base uppercase tracking-[0.3em] text-primary text-glow text-center">
              Your Assigned Factions
            </h2>
            <div className="imperial-divider w-32 mx-auto" />
            <div className="grid gap-3">
              {assignedFactions.map((f, i) => (
                <FactionCard key={f.name} playerName={playerName} faction={f} index={i} />
              ))}
            </div>
            {picksPerPlayer > 1 && (
              <p className="text-center font-body text-base text-muted-foreground">
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

        {/* keep tokenMapping referenced */}
        {false && tokenMapping && null}
      </div>
    </div>
  );
};

export default JoinLobby;
