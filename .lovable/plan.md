## Goal

After seating is set, give the host a live galaxy map where they can click any tile to assign it to a seated player's color (cycling through players + unclaimed). A live leaderboard shows tile counts per player throughout the game. Final tile-control stays attached to the saved game and shows up in the History mini-map.

## User flow

1. Host sets seating in lobby as today.
2. Host clicks a new "Start Game" / "Open Game Board" button → opens `/game/:invite_code`.
3. On `/game/:code`:
   - Big galaxy map (reusing `MapSetupHex`) with all tiles clickable for the host.
   - Click a tile → cycles ownership: unclaimed → seat 1 → seat 2 → … → seat N → unclaimed. Mecatol Rex included; hyperlanes excluded (they're fixed lanes, not systems).
   - Right/below the map: a "Tile Control" leaderboard listing each seated player with their faction color swatch and current tile count, sorted descending. Updates in realtime via Supabase.
   - Players (non-hosts) see the same view in read-only mode.
4. Tile control persists with the lobby and is shown in History via the existing mini-map (colored tiles instead of just home systems).

## Data model

Add a `tile_control` JSONB column on `lobbies` storing a map from `"q,r"` to `seat_index`:
```
{ "0,-3": 2, "1,-3": 2, "0,0": 5, ... }
```
- Compact, easy to merge atomically, no extra table needed.
- Unclaimed tiles are simply absent from the map.
- `seat_index` (not player_id) so it survives if a player row is deleted and matches the existing seating model.

## Backend (one migration)

1. `ALTER TABLE lobbies ADD COLUMN tile_control jsonb NOT NULL DEFAULT '{}'::jsonb;`
2. New SECURITY DEFINER RPC `set_tile_control(p_lobby_id uuid, p_q int, p_r int, p_seat_index int | null)`:
   - Verifies caller is host (or admin).
   - If `p_seat_index` is null → removes the `"q,r"` key.
   - Else → sets `tile_control["q,r"] = p_seat_index`.
   - Uses `jsonb_set` / `- text` operators atomically.
3. New RPC `clear_tile_control(p_lobby_id uuid)` (host-only) for a "reset board" button.
4. Realtime is already enabled for `lobbies` (used by `useLobby`); the JSON column will stream automatically.

## Frontend changes

### New page `src/pages/GameBoard.tsx` (route `/game/:code`)

- Uses existing `useLobby(code)` hook to get lobby + players + realtime updates.
- Renders:
  - Page header with invite code, status, "Back to lobby" link.
  - `<GameBoardHex />` (new component, see below) — full-size interactive map.
  - `<TileControlLeaderboard />` — sorted list of seated players with color swatch + count + percentage.
  - Host-only toolbar: "Reset board" button.
- Auth: anyone with the link can view; only host gets click handlers (mirrors SeatingPanel pattern).

### New component `src/components/GameBoardHex.tsx`

- Thin wrapper around `MapSetupHex`, or extend `MapSetupHex` with two new optional props:
  - `tileControl?: Record<string, number>` (key `"q,r"` → seat index)
  - `onTileClick?: (q: number, r: number) => void`
- Rendering rules when `tileControl` is present:
  - For each cell (except `hyperlane`), if `tileControl["q,r"]` is set, fill with that seat's faction color (look up via `seats[seatIndex].factionColor`, fallback to `PLAYER_COLORS[seatIndex]`).
  - Home systems remain colored by their own seat occupant by default (already implemented), but can be re-claimed (e.g., conquered home) — `tileControl` overrides.
  - Mecatol Rex: keep its cyan ring style but fill body with controller color when claimed.
  - Hyperlanes: not clickable, stay as-is.
- Click handler (host only): cycles seat through `[null, 0, 1, …, N-1]`.

I'll extend the existing `MapSetupHex` rather than fork it, gated by the new props, to keep one source of truth.

### New component `src/components/TileControlLeaderboard.tsx`

- Receives `tileControl`, `players`, `seats` map.
- Computes counts per `seat_index`.
- Renders sorted list: color swatch · player name · faction name · tile count · % of board.

### Lobby integration `src/pages/LobbyView.tsx`

- Add a "Open Game Board" button (host + players see it; only after seating has at least 1 seat) linking to `/game/:invite_code`.

### History integration `src/components/HistoryMiniMap.tsx`

- Already gets the lobby record. Read `tile_control` and color hex bodies accordingly.
- If `tile_control` is empty, fall back to current seating-only display.

### Routing `src/App.tsx`

- Add `<Route path="/game/:code" element={<GameBoard />} />`.

### Hook updates

- `src/hooks/useLobby.ts` — add `tile_control` to the selected columns and to the realtime payload typing.
- `src/integrations/supabase/types.ts` is auto-generated post-migration.
- `src/types/gameHistory.ts` — add `tileControl?: Record<string, number>` field; hydrate in `useOnlineGameHistory`.

## Visual design

- Match existing imperial theme: glassmorphism panels, gold accents, Cinzel headings.
- Leaderboard uses the same `PLAYER_COLORS` palette (or faction color when chosen) — keeps continuity with seating panel.
- Animate tile color transitions (200ms, already in MapSetupHex).
- Mobile: leaderboard stacks below map; map remains responsive (max 70vh as today).

## Edge cases

- **Player not seated**: their seat_index is null, so they don't appear as a click target. If `seatedCount === 0`, show a message: "Assign seats in the lobby before claiming tiles."
- **Hyperlane tiles**: not clickable, can't be claimed.
- **Lobby finished**: tile control becomes read-only for everyone (status = 'completed').
- **Realtime conflict**: last write wins per tile (acceptable for a host-only tool).

## Out of scope (not changed)

- VP / rank / faction picking — untouched.
- No "scoring" rules — tile counts are informational only.
- Players still can't claim tiles themselves; hosts only (per your answer).

## Files to create / edit

**Created**
- `src/pages/GameBoard.tsx`
- `src/components/TileControlLeaderboard.tsx`
- `supabase/migrations/<ts>_tile_control.sql`

**Edited**
- `src/components/MapSetupHex.tsx` (add `tileControl` + `onTileClick` props)
- `src/components/HistoryMiniMap.tsx` (render tile_control overlay)
- `src/hooks/useLobby.ts` (select tile_control, type updates)
- `src/hooks/useOnlineGameHistory.ts` (hydrate tile_control)
- `src/types/gameHistory.ts` (add field)
- `src/pages/LobbyView.tsx` (add "Open Game Board" link)
- `src/App.tsx` (new route)
- `mem://features/...` — add a new memory entry for the tile-control feature.
