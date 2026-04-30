## Goal

Allow editing victory points and ranks on previously recorded games from the History page. Works for both local browser-stored games and online lobby games. For online games, only the original host or an admin may edit.

## User Experience

On `/history`, each game card gets an **Edit** button (pencil icon) next to the existing delete button. Visibility rules:

- **Local games** (id starts with non-`online-`): always editable, always show Edit + Delete (current behavior preserved).
- **Online games** (id `online-…`): show Edit only if the current user is the lobby host OR an admin. Otherwise the card stays read-only as today.

Clicking **Edit** opens a modal dialog listing every player row with two inputs each: **VP** (number) and **Rank** (number). The dialog mirrors the styling of `ResultsEntry` (faction color swatch, Cinzel/Rajdhani typography, glass + imperial-border).

Footer actions:
- **Cancel** — discard changes.
- **Save** — persist edits, close dialog, refresh the list. Toast on success/failure.

The winner badge, sorting, and stats automatically reflect the new ranks once the data refreshes.

## Validation

- VP: integer 0–20 (matches existing entry form).
- Rank: integer 1..N where N = number of players in the game.
- Ranks do not need to be unique (we already allow ties in the entry form), but we warn if two players share rank 1 — non-blocking.

## Technical details

### Local games
- Extend `useGameHistory` with `updateGame(id, updates: { players: { vp, rank }[] })` that rewrites the matching record in `localStorage` under `ti4-game-history` and updates state.

### Online games
- Add a Supabase RPC `update_lobby_results(p_lobby_id uuid, p_results jsonb)` (SECURITY DEFINER) that:
  - Verifies `auth.uid()` is either the lobby's `host_user_id` or has the `admin` role via `has_role`.
  - Iterates the `p_results` array `[{ player_id, vp, rank }, …]` and updates `lobby_players.vp` and `lobby_players.rank` for rows belonging to `p_lobby_id`.
  - Returns `{ success: true }` or `{ error: '…' }`.
- The History page strips the `online-` prefix to recover `lobby_id`, but each `PlayerResult` currently has no `player_id`. We extend `useOnlineGameHistory` to also expose the `lobby_players.id` per row (added to a parallel `_meta` field on `GameRecord`, kept optional so the local type stays unchanged).
- After a successful save, call `refetch()` from `useOnlineGameHistory`.

### Permissions UI
- `useOnlineGameHistory` already loads each lobby's row; expose `host_user_id` per game so the History page can check `user.id === host_user_id`.
- Use existing `useIsAdmin` hook to allow admin override.

### Files to add / change
- `src/hooks/useGameHistory.ts` — add `updateGame`.
- `src/hooks/useOnlineGameHistory.ts` — include `host_user_id` and per-player `lobby_player_id` in returned records; add an `updateOnlineGame` helper that calls the new RPC.
- `src/types/gameHistory.ts` — add optional `hostUserId?: string` and per-player `playerId?: string` (online metadata).
- `src/components/EditResultsDialog.tsx` (new) — modal with the VP/Rank grid, save/cancel.
- `src/pages/History.tsx` — Edit button gated by permissions, opens the dialog, dispatches to local vs online updater.
- New Supabase migration adding `public.update_lobby_results` RPC.

### Out of scope
- Editing player names, faction assignments, adding/removing players.
- Editing completed lobbies' draft state (already covered by `reset_lobby_draft`).
- Audit log of edits.