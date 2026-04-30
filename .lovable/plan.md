## Table Seating + History Mini-Map

Reuse the existing `/map-setup` hex grid to assign each player a home system seat in a lobby, persist that seat, and visualize it as a mini map in game history.

### 1. Data model

Add a per-player seat index on `lobby_players`:

- `seat_index integer NULL` — 0-based index into the home-system list of the active map template (ordered clockwise starting from a fixed reference). Unique per lobby when not null.

Migration adds the column + a partial unique index `(lobby_id, seat_index) WHERE seat_index IS NOT NULL`.

No new RLS policies needed — existing "players and hosts can update player rows" already covers it.

### 2. Seating logic

`src/data/mapSetups.ts` already lists home cells per player count. Add a helper:

```ts
// Ordered clockwise starting from the top home system
export function getHomeSeats(players: 3|4|5|6|7|8): HexCell[]
```

This is the canonical seat ordering. `seat_index` references positions in that array.

### 3. Lobby UI — Seating panel

New component `src/components/SeatingPanel.tsx` mounted in `LobbyView.tsx` (collapsible card, available anytime during the lobby — does not gate other steps).

Features:
- Renders `MapSetupHex` sized to the lobby's player count.
- Each home hex shows the assigned player's name + faction color (or "empty").
- Host: click a home hex → popover to pick an unseated player; click occupied → swap/clear.
- "Shuffle seats" button → random assignment of all current players.
- "Clear seats" button.
- Non-hosts see read-only view that updates live via existing realtime channel.

Writes go through a new RPC for atomicity:

```sql
assign_seat(p_lobby_id, p_player_id, p_seat_index int|null) returns jsonb
shuffle_seats(p_lobby_id) returns jsonb
```

Both are SECURITY DEFINER, allow host or admin, and enforce uniqueness.

### 4. Game history mini map

Extend `GameRecord` / `PlayerResult` types with `seatIndex?: number` and the game's `playerCount`. Hydrated by `useOnlineGameHistory` (already selects all `lobby_players` columns — just map `seat_index`).

New component `src/components/HistoryMiniMap.tsx`:
- Compact SVG (≈180px) reusing axial-to-pixel math from `MapSetupHex`.
- Only renders Mecatol + home hexes; equidistant/slice/hyperlane drawn faintly for context.
- Each home hex filled with the seated player's faction color and shows initials on hover/tooltip.

Rendered in `History.tsx` inside each game card, right side on desktop, stacked on mobile.

Local (offline) games: show only when seat data exists; offline path can be added later if requested — for now the mini-map only renders for online games or when seatIndex is present.

### 5. Files touched

```text
NEW    supabase migration: add lobby_players.seat_index + RPCs
NEW    src/components/SeatingPanel.tsx
NEW    src/components/HistoryMiniMap.tsx
EDIT   src/data/mapSetups.ts            (export getHomeSeats helper)
EDIT   src/pages/LobbyView.tsx          (mount SeatingPanel)
EDIT   src/hooks/useOnlineGameHistory.ts (map seat_index, playerCount)
EDIT   src/types/gameHistory.ts         (seatIndex, playerCount)
EDIT   src/pages/History.tsx            (render HistoryMiniMap per game)
EDIT   src/integrations/supabase/types.ts (auto-regenerated)
EDIT   mem://features/map-setup-tool    (note seat usage)
```

### Open considerations

- Seat order convention: clockwise from the top-most home hex. The Speaker tile (TI4 turn order) is independent of seat number; we treat seat 0 = top.
- If player count changes after seats are assigned, out-of-range seats are auto-cleared by `shuffle_seats` / surfaced as a warning in `SeatingPanel`.
