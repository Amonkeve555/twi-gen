# Add / edit game date on existing lobbies

Hosts can currently only set the game date when *creating* a new lobby. Legacy lobbies (created before the feature) have no date, and there is no way to change a date if plans shift. This plan adds a host-only "Set / Edit game date" control on the **Lobby view** and on the **My Lobbies** list, allowing hosts to set or update the date any time before the 3-day lock window.

## Scope

- Hosts can set a game date on lobbies that don't have one yet.
- Hosts can edit an existing date as long as the lobby is not yet locked (more than 3 days before the current `game_date`).
- Once the lock window has begun, the edit control is hidden / disabled with clear messaging.
- The chosen date must be in the future (same rule as the create form).
- Non-hosts never see the edit control.

## Database

The existing `lobbies_validate_game_date` trigger only enforces validation `IF TG_OP = 'INSERT'`, so UPDATEs already pass through unchanged. To prevent hosts from sneaking past-dated edits or bypassing the lock via direct UPDATE, the trigger will be extended:

- On `UPDATE`, when `NEW.game_date IS DISTINCT FROM OLD.game_date`:
  - Reject if `NEW.game_date` is `NULL`.
  - Reject if `NEW.game_date < now()` (must be future).
  - Reject if `OLD.game_date IS NOT NULL AND OLD.game_date - interval '3 days' <= now()` — i.e. lobby is already locked.

No table changes; only the trigger function is updated. RLS already allows the host to UPDATE their lobby.

## UI

### Lobby view (`src/pages/LobbyView.tsx`)
- Next to the "Game date: …" line, when `isHost` and not locked, show a small "Edit" (pencil) button.
- When `isHost` and `game_date` is `null`, replace the line with a prominent "Set game date" call-to-action (so hosts of legacy lobbies notice it).
- Clicking opens a dialog with the existing shadcn date picker (future-only, `pointer-events-auto`). Confirm calls `supabase.from('lobbies').update({ game_date }).eq('id', lobby.id)`.
- Toast on success / error. Realtime already pushes the update to all viewers.
- Hidden completely once `isLocked(game_date)` is true.

### My Lobbies (`src/pages/MyLobbies.tsx`)
- Add a "Game date" column showing the date or "—".
- For each row where the current user is host **and** the lobby is not locked, show an inline "Set / Edit" button that opens the same date-picker dialog (extracted into a shared component).
- Same realtime / toast behavior.

### Shared component
- New `src/components/EditGameDateDialog.tsx`: encapsulates the date picker + update call. Props: `lobbyId`, `currentDate`, `open`, `onOpenChange`. Reused by both pages.

## Out of scope

- Editing the date on locked lobbies (host needs to start a new lobby in that case).
- Notifying joined players when the date changes (could be a follow-up).

## Files touched

- `supabase/migrations/...` — extend `lobbies_validate_game_date` trigger to cover UPDATE.
- `src/components/EditGameDateDialog.tsx` (new).
- `src/pages/LobbyView.tsx` — add edit button + dialog wiring; legacy "Set date" CTA.
- `src/pages/MyLobbies.tsx` — add Game date column + inline edit button.
