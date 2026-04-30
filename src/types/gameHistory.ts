import type { Faction } from "@/data/factions";

export interface PlayerResult {
  player: string;
  faction: Faction;
  vp: number;
  rank: number;
  /** lobby_players.id — present only for online games */
  playerId?: string;
  /** Optional override HSL color string (e.g. "42 85% 55%"). */
  displayColor?: string | null;
}

export interface GameRecord {
  id: string;
  date: string; // ISO string
  players: PlayerResult[];
  /** lobby host user id — present only for online games */
  hostUserId?: string;
}
