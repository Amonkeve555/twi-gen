

## Fix: Player Can't Pick Faction on Different Device

### Problem
Session IDs are stored in `localStorage`, meaning they're unique per browser/device. If Swifftik opens the game on a different browser or device than the one they used to join, `myPlayer` resolves to `undefined` because the session ID doesn't match. The GameDay page then shows no faction choice UI for them.

### Solution
Add a "Claim Player" mechanism on the GameDay page (and optionally LobbyView) so a user on a new device can associate themselves with an existing player entry.

### Changes

**1. Add "Claim Player" dialog to GameDay page (`src/pages/GameDay.tsx`)**
- When `myPlayer` is `undefined` (no matching session), show a list of unclaimed/unmatched players with a "This is me" button next to each
- Clicking it updates that player's `session_id` in the database to the current device's session ID
- After claiming, the faction choice UI appears normally

**2. Add same capability to LobbyView (`src/pages/LobbyView.tsx`)**
- If the current session doesn't match any player in the lobby, show a "Rejoin as..." section listing all players, letting the user claim their identity
- This covers the case where someone switches devices during the token-picking phase too

**3. Optional safeguard**
- Only show "claim" for players who haven't been active recently, or require confirmation (to prevent accidentally stealing another player's slot)
- A simple approach: just allow it freely since the group is physically together and can coordinate

### Technical Detail
- Both pages already have access to `players` and `sessionId`
- The update is a single Supabase call: `supabase.from("lobby_players").update({ session_id: sessionId }).eq("id", playerId)`
- After updating, the real-time subscription will refetch and `myPlayer` will resolve correctly

