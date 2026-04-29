## Goal

Make the no-repeat draft rule **opponent-aware** instead of global. A faction is only blocked for a player if they last played it in a completed game where **every** authenticated opponent currently in the new lobby was also present.

This way, the rule "you can't play the same race twice in a row" follows the *group*, not the player. Joining a different group resets your repeat history with that group.

## Behavior

For each authenticated player A in a no-repeat lobby L:
- Let `opponents(A, L)` = the set of other authenticated `user_id`s currently in lobby L.
- If `opponents(A, L)` is empty (A is the only authenticated player), the rule does nothing for A.
- Find A's most recent **completed** lobby P where:
  - A participated, and
  - **Every** user in `opponents(A, L)` also participated in P.
- If such a P exists, block the faction A chose in P. Otherwise, no block.

Existing fallback still applies: if the block would leave A with zero options, silently relax it.

This **replaces** the current global no-repeat behavior — the two no-repeat modes (`free_no_repeat`, `token_no_repeat`) keep their names and UI, only the lookup logic changes.

## Key edge cases

- Guest (non-authenticated) opponents are ignored when computing the opponent set — no `user_id` means we can't track them.
- If A is the only authenticated player in the lobby, no faction is blocked for A.
- For `token_no_repeat`, the forbidden-tokens list is computed per-caller (already the case via `auth.uid()`), so different players see different blocks. ✅ already structured correctly.
- Token mapping is generated once at lobby creation. Forbidden tokens are still derived from that mapping per player at claim time — no change to mapping generation.

## Implementation

All changes are server-side SQL — frontend keeps calling the same RPCs.

### 1. Replace `get_last_played_faction_name`

Replace the single-arg function with a new signature that takes the opponent set:

```sql
CREATE OR REPLACE FUNCTION public.get_last_played_faction_vs_opponents(
  p_user_id uuid,
  p_opponent_ids uuid[]
) RETURNS text
```

Logic:
- If `p_opponent_ids` is empty/null → return NULL (no block).
- Find the most recent completed lobby where:
  - `lobby_players.user_id = p_user_id` AND `chosen_faction IS NOT NULL`, AND
  - For every `oid` in `p_opponent_ids`, there exists a `lobby_players` row in that same lobby with `user_id = oid`.
- Return that row's `chosen_faction->>'name'`, or NULL.

SQL sketch:
```sql
SELECT (lp.chosen_faction->>'name')
FROM public.lobby_players lp
JOIN public.lobbies l ON l.id = lp.lobby_id
WHERE lp.user_id = p_user_id
  AND l.status = 'completed'
  AND lp.chosen_faction IS NOT NULL
  AND NOT EXISTS (
    SELECT unnest(p_opponent_ids) AS oid
    EXCEPT
    SELECT lp2.user_id FROM public.lobby_players lp2
    WHERE lp2.lobby_id = lp.lobby_id AND lp2.user_id IS NOT NULL
  )
ORDER BY l.created_at DESC
LIMIT 1;
```

Keep the old `get_last_played_faction_name` as a thin wrapper that calls the new function with an empty array, OR drop it after updating callers — drop it since `claim_faction` and `get_forbidden_tokens` are the only callers.

### 2. Update `claim_faction`

Inside the `free_no_repeat` branch, before the existing check:
- Build `v_opponents uuid[]` = all `user_id` values from `lobby_players` where `lobby_id = p_lobby_id AND id <> p_player_id AND user_id IS NOT NULL`.
- Call `get_last_played_faction_vs_opponents(v_player_user_id, v_opponents)` instead of the old global lookup.
- Rest of the logic (taken-check, fallback) unchanged.

### 3. Update `get_forbidden_tokens`

- Build `v_opponents` = all `user_id` from `lobby_players` for `p_lobby_id` excluding the caller (`auth.uid()`), where `user_id IS NOT NULL`.
- Call `get_last_played_faction_vs_opponents(v_user_id, v_opponents)` to get `v_last_faction`.
- Rest of the function (mapping lookup, fallback if all unclaimed are forbidden) unchanged.

### 4. Frontend

No changes. `claim_faction`, `claim_token`, and `get_forbidden_tokens` keep their signatures. The picker UI's "Played last game" / "Repeat allowed" badges remain accurate — they just now reflect group-aware history.

### 5. Memory update

Update `mem://features/draft-mechanic` to document the per-opponent semantics so future sessions know the rule is group-scoped, not global.

## Files touched

- **Migration** — drop `get_last_played_faction_name`; create `get_last_played_faction_vs_opponents`; replace `claim_faction` and `get_forbidden_tokens` to compute the opponent set and call the new helper.
- `mem://features/draft-mechanic` — document the new rule.

No frontend or schema changes.
