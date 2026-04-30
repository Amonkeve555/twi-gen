import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Eraser } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import StarField from "@/components/StarField";
import MapSetupHex, { type SeatOccupant } from "@/components/MapSetupHex";
import TileControlLeaderboard from "@/components/TileControlLeaderboard";
import GameTimer from "@/components/GameTimer";
import { MAP_SETUPS, getHomeSeats } from "@/data/mapSetups";
import { useLobby } from "@/hooks/useLobby";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Faction } from "@/data/factions";

type PlayerCount = 3 | 4 | 5 | 6 | 7 | 8;

function clampCount(n: number): PlayerCount {
  if (n <= 3) return 3;
  if (n >= 8) return 8;
  return n as PlayerCount;
}

const GameBoard = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { lobby, players, loading, error } = useLobby(code);
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const isHost = !!user && lobby?.host_user_id === user.id;
  const isCompleted = lobby?.status === "completed";
  const canEdit = isHost && !isCompleted;

  const playerCount = clampCount(lobby?.settings?.max_players ?? 6);
  const setup = MAP_SETUPS[playerCount];
  const seatOrder = useMemo(() => getHomeSeats(playerCount), [playerCount]);
  const tileControl = (lobby?.tile_control ?? {}) as Record<string, number>;

  const seats = useMemo(() => {
    const m: Record<number, SeatOccupant> = {};
    for (const p of players) {
      if (p.seat_index === null || p.seat_index === undefined) continue;
      const chosen = p.chosen_faction as Faction | null;
      const assigned = (p.assigned_factions as Faction[] | null) ?? null;
      const f = chosen ?? (assigned && assigned.length === 1 ? assigned[0] : null);
      m[p.seat_index] = {
        playerId: p.id,
        playerName: p.player_name,
        factionColor: f?.color ?? null,
        factionName: f?.name,
      };
    }
    return m;
  }, [players]);

  const seatIndices = useMemo(
    () =>
      players
        .map((p) => p.seat_index)
        .filter((s): s is number => typeof s === "number")
        .sort((a, b) => a - b),
    [players]
  );

  // All non-hyperlane tiles are claimable.
  const totalClaimableTiles = useMemo(
    () => setup.cells.filter((c) => c.role !== "hyperlane").length,
    [setup]
  );

  const onTileClick = async (q: number, r: number, currentSeat: number | undefined) => {
    if (!canEdit || !lobby || seatIndices.length === 0) {
      if (!isHost && !isCompleted) toast.error("Only the host can claim tiles.");
      return;
    }
    // Cycle: undefined -> seatIndices[0] -> ... -> last -> undefined
    let nextSeat: number | null;
    if (currentSeat === undefined) {
      nextSeat = seatIndices[0];
    } else {
      const idx = seatIndices.indexOf(currentSeat);
      if (idx === -1 || idx === seatIndices.length - 1) {
        nextSeat = null;
      } else {
        nextSeat = seatIndices[idx + 1];
      }
    }

    setBusy(true);
    const { data, error: err } = await supabase.rpc("set_tile_control", {
      p_lobby_id: lobby.id,
      p_q: q,
      p_r: r,
      p_seat_index: nextSeat,
    });
    setBusy(false);
    if (err || (data as { error?: string })?.error) {
      toast.error("Failed to update tile");
      console.error(err);
    }
  };

  const onClearAll = async () => {
    if (!canEdit || !lobby) return;
    if (!confirm("Clear all tile claims on the board?")) return;
    setBusy(true);
    const { error: err } = await supabase.rpc("clear_tile_control", {
      p_lobby_id: lobby.id,
    });
    setBusy(false);
    if (err) {
      toast.error("Failed to clear board");
      return;
    }
    toast.success("Board cleared");
  };

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
          <p className="font-display text-destructive">{error || "Game not found"}</p>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="font-display text-xs uppercase tracking-[0.15em]"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <StarField />
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-black tracking-[0.15em] text-primary text-glow mb-2">
            Game Board
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <code className="font-body text-sm text-primary bg-secondary px-3 py-1 rounded">
              {code}
            </code>
          </div>
          {lobby.started_at && (
            <div className="flex justify-center mt-3">
              <GameTimer startedAt={lobby.started_at} endedAt={lobby.ended_at} />
            </div>
          )}
          <div className="imperial-divider w-48 mx-auto mt-4" />
          <p className="font-body text-xs text-muted-foreground mt-3">
            {canEdit
              ? "Click any tile to cycle its controller through the seated players."
              : isCompleted
              ? "Game completed — board is read-only."
              : "Only the host can claim tiles."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass imperial-border rounded p-3 md:p-5"
          >
            <MapSetupHex
              setup={setup}
              seats={seats}
              seatOrder={seatOrder}
              tileControl={tileControl}
              onTileClick={canEdit ? onTileClick : undefined}
            />
            {canEdit && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearAll}
                  disabled={busy || Object.keys(tileControl).length === 0}
                  className="font-display text-xs uppercase tracking-[0.15em] border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <Eraser className="mr-2 h-3 w-3" />
                  Clear Board
                </Button>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <TileControlLeaderboard
              players={players}
              tileControl={tileControl}
              totalClaimableTiles={totalClaimableTiles}
            />
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/lobby/${code}`)}
                className="font-display text-xs uppercase tracking-[0.15em] border-border text-muted-foreground hover:text-primary hover:border-primary/40"
              >
                <ArrowLeft className="mr-2 h-3 w-3" />
                Back to Lobby
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
