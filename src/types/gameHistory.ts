import type { Faction } from "@/data/factions";

export interface PlayerResult {
  player: string;
  faction: Faction;
  vp: number;
  rank: number;
}

export interface GameRecord {
  id: string;
  date: string; // ISO string
  players: PlayerResult[];
}
