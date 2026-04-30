# Fix: Player can't return to faction picker after dropping out

## The bug

When a user closes the tab / navigates away mid-draft and comes back, they get stuck because of how the entry points and `JoinLobby` resume logic interact.

### Where it breaks

1. **`/lobby/:inviteCode` (`LobbyView.tsx`, lines 232–240)** only shows the **"Join This Lobby"** button when `!inLobby && !isHost`. As soon as a player has a row in `lobby_players` (which happens the moment they click Join, *before* picking tokens), `inLobby === true` and the button disappears. A half-drafted player landing here from the home page or "My Lobbies" sees the lobby but has **no visible way back into the picker**.

2. **`/join/:inviteCode` (`JoinLobby.tsx`, lines 73–84)** does have resume logic, but the `intro` screen at line 269 renders only when `!existingPlayer`. The resume `useEffect` runs on the next render and flips `phase` to `"pick"` or `"done"`. If for any reason `existingPlayer` is briefly undefined while `players` is still loading, or if the user has already finished picking (`phase === "done"`), they land on the "Your Assigned Factions" / color-picker view with no obvious "back to picker" affordance — and importantly there is no guard that handles a player whose `token_picks.length < picksPerPlayer` but who navigated to `/lobby/...` instead of `/join/...`.

3. **Home page & My Lobbies** (`Index.tsx` line 306, `MyLobbies.tsx` line 145) always send the user to `/lobby/...`, never to `/join/...`, so a half-drafted player has no link that takes them back into the draft UI.

### Net effect
A player who started picking, closed the window, and re-opens the lobby from the home page lands on `LobbyView` with their incomplete row already there → no "Join" button, no "Resume picking" button → stuck.

## Plan

### 1. Add a "Resume picking" CTA on `LobbyView` for incomplete players
In `src/pages/LobbyView.tsx`, compute whether the current user has joined but not finished:

```ts
const myPlayer = user ? players.find(p => p.user_id === user.id) : null;
const myPicksDone = isFreeMode
  ? !!myPlayer?.chosen_faction
  : (myPlayer?.token_picks?.length ?? 0) >= picksPerPlayer;
const needsToPick = !!myPlayer && !myPicksDone && !lobby.started_at;
```

Render a prominent **"Resume picking your faction"** button (same styling as "Join This Lobby") when `needsToPick`, linking to `/join/${inviteCode}`. Keep the existing "Join This Lobby" button for users with no row yet.

### 2. Make `JoinLobby` robust to all resume states
In `src/pages/JoinLobby.tsx`:

- Keep the existing resume `useEffect`, but also re-evaluate when `existingPlayer` changes after the initial mount (e.g. realtime row arrives). Today the guard `phase === "intro"` prevents it from re-syncing if `phase` was set to `"done"` first by a stale row.
- When `phase === "done"` but the player still has fewer than `picksPerPlayer` picks in token mode, treat it as `"pick"` instead. This prevents getting "stuck on Done" if state was inconsistent.
- On the `done` screen, add a small **"Pick more tokens"** / **"Change faction"** affordance only when picks are actually incomplete (defensive — should normally not show).

### 3. Route home/My Lobbies links smartly
In `src/pages/Index.tsx` (line 306) and `src/pages/MyLobbies.tsx` (line 145), when rendering the user's own lobby card, if the row indicates the player hasn't completed their picks, link to `/join/${invite_code}` instead of `/lobby/${invite_code}`. If we don't already have `lobby_players` data at those call sites, the simpler fix is: always link to `/lobby/...` and let LobbyView's new "Resume picking" button (step 1) handle it. Recommend the simpler version — single source of truth.

### 4. Sanity: handle host who hasn't drafted
Hosts currently never see a Join button (`!inLobby && !isHost`). If the host is also a player and dropped mid-draft, the same "Resume picking" button from step 1 should show for them too — the new condition is purely based on `myPlayer` and pick completeness, independent of `isHost`.

## Files to change

- `src/pages/LobbyView.tsx` — add `needsToPick` computation + "Resume picking" button.
- `src/pages/JoinLobby.tsx` — tighten resume `useEffect` so it re-syncs on `existingPlayer` change and never lands on `done` when picks are incomplete.

## Out of scope

- Backend / RPC changes — the data model already supports resuming; this is purely a UI routing fix.
- Changing how players are inserted into `lobby_players` (current behavior of inserting on Join click is fine).
