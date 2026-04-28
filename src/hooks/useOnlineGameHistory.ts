import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { GameRecord, PlayerResult } from "@/types/gameHistory";
import type { Faction } from "@/data/factions";

export function useOnlineGameHistory() {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompletedLobbies() {
      // Fetch completed lobbies
      const { data: lobbies, error: lobbyErr } = await supabase
        .from("lobbies")
        .select("*")
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (lobbyErr || !lobbies) {
        setLoading(false);
        return;
      }

      // Fetch all players for these lobbies
      const lobbyIds = lobbies.map((l) => l.id);
      if (lobbyIds.length === 0) {
        setGames([]);
        setLoading(false);
        return;
      }

      const { data: players, error: playerErr } = await supabase
        .from("lobby_players")
        .select("*")
        .in("lobby_id", lobbyIds);

      if (playerErr || !players) {
        setLoading(false);
        return;
      }

      // Group players by lobby_id
      const playersByLobby = new Map<string, typeof players>();
      for (const p of players) {
        const arr = playersByLobby.get(p.lobby_id) || [];
        arr.push(p);
        playersByLobby.set(p.lobby_id, arr);
      }

      // Convert to GameRecord format
      const records: GameRecord[] = lobbies
        .map((lobby) => {
          const lobbyPlayers = playersByLobby.get(lobby.id) || [];
          
          // Include lobbies where players have at least a chosen faction and rank
          const playersWithResults = lobbyPlayers.filter(
            (p) => p.chosen_faction && p.rank !== null
          );
          
          if (playersWithResults.length === 0) return null;

          const playerResults: PlayerResult[] = playersWithResults.map((p) => ({
            player: p.player_name,
            faction: p.chosen_faction as unknown as Faction,
            vp: p.vp ?? 0,
            rank: p.rank!,
          }));

          return {
            id: `online-${lobby.id}`,
            date: lobby.created_at,
            players: playerResults,
          };
        })
        .filter(Boolean) as GameRecord[];

      setGames(records);
      setLoading(false);
    }

    fetchCompletedLobbies();
  }, []);

  return { games, loading };
}
