## Game Timer

Track how long a game lasts: the host starts the clock when the game begins, every spectator sees a live ticking timer, and the host stops it when entering results. The final duration is saved with the game record and shown in history.

### Flow

1. **Start** — In the lobby, once the draft is complete, the host sees a new "Start Game" button (in addition to / replacing the current "Game Day →" button). Clicking it stamps `started_at = now()` on the lobby and sets `status = 'in_progress'`. The button is then replaced by "Open Game Board" / "Game Day".
2. **During the game** — The Lobby, Game Board, and Game Day pages all show a live MM:SS / HH:MM:SS counter at the top (computed client-side from `started_at`, refreshed every second). Real-time already syncs `started_at` to all clients.
3. **End** — On the Game Day "Record Results" screen, when the host clicks **Save Results**, we additionally stamp `ended_at = now()` and freeze the elapsed duration. Status moves to `completed` (existing behavior). The timer stops and shows the final duration.
4. **History** — Each completed game card displays the total duration (e.g. "Duration: 3h 42m"). Win-rate and stats stay unchanged.

### Edge cases

- If an old lobby has no `started_at` (legacy data), no timer is shown — the game just behaves as today.
- If the host forgets to start the game and goes straight to Game Day, we'll auto-start the clock the first time someone visits Game Day (`started_at` is set if null).
- Host can reset the draft → that also clears `started_at` and `ended_at` so the timer restarts cleanly on the next start.
- Refreshing or re-joining mid-game: the timer keeps ticking correctly because it's derived from the DB timestamp, not local state.

### Technical details

**Schema** (migration on `lobbies`):
- Add `started_at timestamptz null`
- Add `ended_at timestamptz null`

**RPCs** (security-definer, host-only, mirroring existing patterns like `set_tile_control`):
- `start_game(p_lobby_id)` → sets `started_at = now()`, `ended_at = null`, `status = 'in_progress'` if not already started.
- `end_game(p_lobby_id)` → sets `ended_at = now()` (only if `started_at` is set and `ended_at` is null).
- Update `reset_lobby_draft` to also null out `started_at` and `ended_at`.
- Update `update_lobby_results` (or call `end_game` from `GameDay.saveResults`) to stamp `ended_at` if not already set.

**Frontend**:
- New `<GameTimer />` component: takes `startedAt` / `endedAt`, ticks every 1s while live, formats as `H:MM:SS` (or `M:SS` under an hour). Stops at `endedAt` when present.
- `useLobby` already broadcasts lobby updates → no hook changes needed; just expose `started_at` / `ended_at` on `LobbyRow`.
- `LobbyView`: replace the current "Game Day →" button with a "Start Game" button (host-only) when `started_at` is null and draft is complete; once started, show the timer + "Open Game Board" + "Go to Game Day" buttons.
- `GameBoard` and `GameDay`: render `<GameTimer />` in the header.
- `useOnlineGameHistory` + `HistoryMiniMap` / history cards: surface `started_at` / `ended_at` and render a "Duration" line on completed games.

**Files to create/modify**:
- New migration: `started_at`, `ended_at` columns + `start_game` / `end_game` RPCs + tweaks to `reset_lobby_draft`.
- New: `src/components/GameTimer.tsx`.
- Modify: `src/hooks/useLobby.ts` (add fields to type), `src/pages/LobbyView.tsx` (Start Game button + timer), `src/pages/GameBoard.tsx` (timer), `src/pages/GameDay.tsx` (timer + stamp `ended_at` on save), `src/hooks/useOnlineGameHistory.ts` + `src/types/gameHistory.ts` + history UI (display duration).
