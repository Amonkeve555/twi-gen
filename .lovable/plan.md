## Goal

Let the game master choose how factions are drafted when creating a lobby. Four modes:

1. **Free pick** — players freely claim any available faction in the lobby (first come, first served).
2. **Free pick, no repeat** — same as #1, but each authenticated player cannot claim the faction they played in their most recent completed game.
3. **Token draft** *(current behavior)* — players pick numbered tokens; tokens secretly map to randomized factions; chosen at Game Day.
4. **Token draft, no repeat** — same as #3, but the host's lobby pool excludes each authenticated player's most recently played faction (token mapping is generated per-player or filtered so no player's previous faction appears among their possible tokens).

Conflict fallback: if a player's exclusion would leave them with no valid choice, the rule is silently relaxed for that player (they may pick a repeat).

## Build steps

### 1. Lobby settings — store the draft mode
- Add `draft_mode` to `LobbySettings`: `"token" | "token_no_repeat" | "free" | "free_no_repeat"` (default `"token"` for back-compat).
- No DB schema migration needed — `settings` is JSONB. Update the TS type in `src/hooks/useLobby.ts`.

### 2. CreateLobby UI (`src/pages/CreateLobby.tsx`)
- Add a new "Draft Mode" section (below Picks per Player) with 4 buttons / radio cards explaining each mode briefly.
- For free-pick modes, hide / disable the **Picks per Player** control (force `picks_per_player = 1`, since free pick doesn't draft multiples).
- For free-pick modes, **don't generate `token_mapping`** on insert (leave null). Token mapping only generated for token modes.
- For *no-repeat* modes, fetch each invited player's last faction at lobby-creation time isn't possible (host doesn't know who joins yet). Instead store the rule on the lobby and enforce at join/pick time.

### 3. Previous-faction lookup helper
- New helper `getLastPlayedFaction(userId)` — query `lobby_players` joined with `lobbies` where `lobbies.status = 'completed'` and `lobby_players.user_id = userId`, ordered by `lobbies.created_at desc`, take `chosen_faction` from the first row. Returns faction name or null.
- Used by both free and token no-repeat flows on the client (RLS already allows reading `lobby_players`).

### 4. Free-pick flow (`src/pages/JoinLobby.tsx`)
- When `draft_mode` is `free` or `free_no_repeat`, replace the `TokenGrid` step with a **FactionPicker** grid showing `settings.factions`:
  - Faction cards display name + color.
  - Disable factions already taken by other players (`p.chosen_faction` set).
  - For `free_no_repeat`: also disable the player's last played faction, **unless** that would leave zero options — then re-enable with a small "repeat allowed" badge.
  - On click, atomically claim by writing both `chosen_faction` and `assigned_factions = [faction]` and `token_picks = [0]` (so existing "ready" detection in LobbyView/GameDay still works).
- Add a new RPC `claim_faction(p_lobby_id, p_player_id, p_faction jsonb)` that, inside a transaction:
  - Locks the lobby row.
  - Verifies the faction is in `settings.factions` and not already taken by any other player.
  - Sets `chosen_faction`, `assigned_factions`, `token_picks` on the player row.
  - Returns success or a typed error (`already_taken`, `not_in_pool`, `not_authorized`).

### 5. Token no-repeat flow
- Token mapping is still generated at lobby creation from `settings.factions`.
- Modify the existing `claim_token` RPC (or add a wrapper) so that when `draft_mode = 'token_no_repeat'`:
  - Look up the player's last played faction (via `user_id`).
  - If the token they're claiming maps to that faction, return `error: 'previous_faction'` **unless** every remaining token also maps to factions that match other exclusions for them — easier rule: simply don't let them claim a token that maps to their previous faction. Frontend will show this as a disabled token with a tooltip.
- Frontend `JoinLobby` for token mode:
  - For `token_no_repeat`, fetch the player's last faction, then call a small RPC `get_my_forbidden_tokens(p_lobby_id)` returning the integer token IDs that would map to their previous faction. Pass to `TokenGrid` to render disabled.
  - Fallback: if forbidden set covers all unclaimed tokens for that player, ignore it (allow repeat).

### 6. GameDay (`src/pages/GameDay.tsx`)
- For free-pick modes, players already have `chosen_faction` set on join. The "Choose Your Faction" step is skipped naturally because `picks_per_player === 1` and `hasChosen` is true. No change needed beyond verifying behavior.

### 7. LobbyView (`src/pages/LobbyView.tsx`)
- Show the active draft mode in the lobby header chip row (e.g. "Free Pick" / "Token Draft").
- For free modes, "ready" check uses `chosen_faction != null` instead of token count — adjust `allPicked` accordingly.

### 8. Memory update
- Update `mem://features/draft-mechanic` to document all four modes and the no-repeat fallback rule.

## Technical details

**New / changed files**
- `src/pages/CreateLobby.tsx` — add draft mode selector, conditional picks-per-player.
- `src/pages/JoinLobby.tsx` — branch UI on draft mode (token vs faction picker).
- `src/pages/LobbyView.tsx` — show mode, adjust ready detection for free mode.
- `src/hooks/useLobby.ts` — extend `LobbySettings` with `draft_mode`.
- `src/components/FactionPicker.tsx` *(new)* — grid of available factions for free-pick.
- `src/lib/lastPlayedFaction.ts` *(new)* — `getLastPlayedFaction(userId)` helper.
- `mem://features/draft-mechanic` — updated rules.

**Database (migration)**
- New RPC `public.claim_faction(p_lobby_id uuid, p_player_id uuid, p_faction jsonb)` — atomic free-pick claim with uniqueness check.
- New RPC `public.get_forbidden_tokens(p_lobby_id uuid)` — returns `int[]` of token IDs mapping to caller's last played faction, only when lobby `draft_mode = 'token_no_repeat'`. Returns empty array otherwise.
- Update `public.claim_token` to reject claims of tokens whose faction equals the caller's last played faction when `draft_mode = 'token_no_repeat'`, with the relaxation fallback (only reject if the player still has other valid tokens available).

**Backwards compatibility**
- Existing lobbies without `draft_mode` in settings are treated as `"token"`.
- No data migration required.
