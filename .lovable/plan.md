## Overview

Three new features for game lobbies:

1. **Mandatory game date** when creating a lobby (future dates only).
2. **3-day lock window** — once the game is less than 3 days away, picking/editing is frozen and anyone without a faction is auto-assigned a random one.
3. **"Davidovo tlačítko"** — a button on the faction picker (free-pick modes only) that randomly picks an available faction for the player.

---

## 1. Mandatory game date

### Database
- Add `game_date timestamptz` to `lobbies` (nullable for legacy rows; new rows required via app validation).
- No CHECK constraint (must be immutable). Validation lives in app + a `BEFORE INSERT` trigger that rejects new lobbies with `game_date IS NULL` or `game_date < now()`.

### UI — `src/pages/CreateLobby.tsx`
- Add a shadcn date picker (Popover + Calendar) above "Lobby Name".
- Disable past dates in the calendar (`disabled={(d) => d < startOfToday()}`).
- "Create Lobby" button disabled until a date is selected.
- Pass `game_date` in the insert payload.

### Display
- Show game date on `LobbyView`, `JoinLobby` header, `MyLobbies` list, and home `Public Lobbies` table.
- Update `useLobby.ts` `LobbyRow` type to include `game_date`.

---

## 2. 3-day lock window + auto-assign

### Helper
- New `src/lib/lobbyLock.ts` exporting:
  - `getLockTime(gameDate)` → `gameDate − 3 days`.
  - `isLocked(gameDate)` → `now >= lockTime`.
  - `formatTimeUntilLock(gameDate)` for UI hints.

### Auto-assign — server side
- New SQL function `public.auto_assign_missing_factions(p_lobby_id uuid)`:
  - Reads lobby settings, draft mode, `token_mapping`.
  - For every `lobby_player` in the lobby missing a complete pick:
    - **Token modes**: assign random unclaimed token(s) up to `picks_per_player`, append to `token_picks`, build `assigned_factions` from `token_mapping`.
    - **Free modes**: pick a random faction not yet in any other player's `chosen_faction`, set `chosen_faction` + `assigned_factions`.
  - Idempotent — skips players already complete.
  - `SECURITY DEFINER`, callable by anyone (so the lock can fire from any client viewing the lobby).

### Lock enforcement — server side
- Update `claim_token`, `claim_faction`, and `reset_lobby_draft` to check `game_date` and return `{ error: 'locked' }` once the 3-day window has begun.

### Client trigger
- In `useLobby.ts`, after fetching the lobby, if `isLocked(game_date)` and any player still has incomplete picks, call `supabase.rpc("auto_assign_missing_factions", ...)` once. Realtime will broadcast the resulting updates to everyone.

### UI changes
- `JoinLobby.tsx`: when locked, hide TokenGrid / FactionPicker, show a "Picks locked" banner with the assigned faction(s) for that player.
- `LobbyView.tsx`: show a lock badge ("Picks locked — game starts in X") near the game date; hide "Reset Draft" host button while locked.
- Disable the new edit/change controls (below) when `isLocked`.

### Edit / change picks (before lock)
- Add a "Change pick" button on `JoinLobby`'s `done` view and on `LobbyView` for each player's own row. Clicking it:
  - Calls a new `clear_player_pick(p_player_id)` RPC that resets `token_picks`, `assigned_factions`, `chosen_faction` for that single player (host or self only, and only when `!isLocked`).
  - Returns the user to the picker phase.

---

## 3. "Davidovo tlačítko" (free-pick random)

### UI — `src/components/FactionPicker.tsx` (or its host in `JoinLobby.tsx`)
- Add a prominent button labeled **"Davidovo tlačítko"** above the faction grid, visible only in `free` / `free_no_repeat` modes and only while the player can pick (not locked, not done).
- On click:
  - Build a list of factions from `settings.factions` excluding entries in `takenFactions` and (for `free_no_repeat`) the player's `lastFactionName` unless `freeForbiddenRelaxed`.
  - Pick one with `Math.random()` and call the existing `selectFaction(faction)` flow — server still validates via `claim_faction`.
- Disabled when no eligible faction remains, with a tooltip explaining why.

---

## Technical Details

**Files to edit**
- `src/pages/CreateLobby.tsx` — date picker + validation + insert payload.
- `src/pages/JoinLobby.tsx` — locked banner, "Davidovo tlačítko", change-pick button.
- `src/pages/LobbyView.tsx` — game date, lock badge, change-pick per player, hide reset when locked.
- `src/pages/MyLobbies.tsx` and home Public Lobbies table — show game date.
- `src/hooks/useLobby.ts` — new `game_date` field, auto-assign trigger effect.
- `src/components/FactionPicker.tsx` — accept and render the random-pick button.
- New `src/lib/lobbyLock.ts`.

**New / updated SQL** (single migration)
- `ALTER TABLE lobbies ADD COLUMN game_date timestamptz;`
- Validation trigger `lobbies_game_date_validate` (BEFORE INSERT).
- Functions: `auto_assign_missing_factions`, `clear_player_pick`.
- Edits to `claim_token`, `claim_faction`, `reset_lobby_draft` to enforce lock.

**Backwards compatibility**
- Existing lobbies without `game_date` are treated as never locked; date column remains nullable. New lobbies require a date through the trigger + UI.

**Design tokens**
- Lock banner: amber/destructive accent using existing `glass imperial-border` + `text-amber-400`.
- "Davidovo tlačítko": primary glow style consistent with existing CTA buttons (Cinzel uppercase tracking).
