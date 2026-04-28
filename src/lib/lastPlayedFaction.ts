import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the name of the faction the given user played in their most recent
 * completed game, or null if none.
 */
export async function getLastPlayedFactionName(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("lobby_players")
    .select("chosen_faction, lobbies!inner(created_at, status)")
    .eq("user_id", userId)
    .eq("lobbies.status", "completed")
    .not("chosen_faction", "is", null)
    .order("created_at", { foreignTable: "lobbies", ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  const cf = data.chosen_faction as { name?: string } | null;
  return cf?.name ?? null;
}
