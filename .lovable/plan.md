

## Show All Active Lobbies to Everyone

### Problem
The home page only fetches lobbies where the current session is the host or a joined player. On a new device, you see no lobbies because your session ID doesn't match any records.

### Solution
Replace the session-filtered fetch with a single query that fetches **all non-completed lobbies**. Determine the user's role (host/player/none) client-side.

### Changes — `src/pages/Index.tsx`

Replace the `fetchActiveLobbies` logic (lines 52–108) with:

1. Fetch **all** lobbies where `status != 'completed'`, ordered by `created_at desc`
2. Fetch the current session's `lobby_players` entries to determine role
3. For each lobby, set role as `"host"` (if `host_session_id` matches), `"player"` (if in lobby_players), or `"—"` (not involved)
4. Fetch player counts for all returned lobbies

This way, any device visiting the site sees all active games and can navigate to one, then use the host password to claim host privileges.

