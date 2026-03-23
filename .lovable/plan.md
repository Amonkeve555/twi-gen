

## Game Lobby System — Online Multiplayer Draft

### Overview
Transform the app from a single-device experience into an online lobby system where a host creates a game, shares a link, and each player independently picks tokens and sees their factions. On game day, players confirm their chosen faction and record results.

### Flow
```text
HOST                          PLAYERS (via shared link)
─────                         ────────────────────────
Create lobby                  
  - Set available factions    
  - Set player count          
  - Set picks per player      
  - Get invite link ────────► Open link
                               Enter name
                               Pick token(s)
                               See assigned faction(s)
                               (choice deferred to game day)

Pending Games tab              
  - See who has picked         
  - See all faction results    

Game Day ◄──────────────────► Each player confirms chosen faction
Record results (VP, rank)     
```

### Backend: Supabase (Lovable Cloud)

A backend is required to share game state between players. We'll use **Lovable Cloud** (managed Supabase) — no external account needed.

**Database tables:**

- **`lobbies`** — id, invite_code (unique short code), host_name, settings (JSON: factions, picks_per_player, max_players), status (waiting/ready/completed), created_at
- **`lobby_players`** — id, lobby_id (FK), player_name, token_picks (int[]), assigned_factions (JSON), chosen_faction (JSON, nullable), vp (nullable), rank (nullable), joined_at

RLS: Public access via invite_code (no auth). Players identified by a session token stored in localStorage.

### Frontend Changes

**New pages:**
1. **`/create`** — Host creates lobby (reuse existing faction pool + player count UI), generates invite link
2. **`/join/:inviteCode`** — Player enters name, picks tokens, sees assigned factions
3. **`/lobby/:inviteCode`** — Live lobby view showing all players and their status (picked/pending)
4. **`/lobby/:inviteCode/gameday`** — Game day: players confirm faction choice, host records results

**Updated pages:**
- **Index** — Add "Create Game Lobby" button alongside existing local draft flow
- **History** — Show completed online games alongside local games

### Key Details

- **Invite codes**: Short random strings (e.g., `TI4-ABCX`) for easy sharing
- **Real-time updates**: Use Supabase Realtime subscriptions so the lobby view updates as players join and pick
- **No auth**: Players get a random session ID stored in localStorage to identify themselves within a lobby
- **Token picking**: Reuse existing `TokenGrid` component; faction assignment happens server-side (or on first pick) to prevent cheating
- **Game day flow**: Each player with 2-3 picks sees their factions and confirms one; host can then enter VP/rank results

### Files to create/modify
- **Supabase migration**: `lobbies` and `lobby_players` tables with RLS
- **`src/pages/CreateLobby.tsx`** — Lobby creation form
- **`src/pages/JoinLobby.tsx`** — Player join + token pick flow  
- **`src/pages/LobbyView.tsx`** — Real-time lobby status
- **`src/pages/GameDay.tsx`** — Faction confirmation + results entry
- **`src/App.tsx`** — New routes
- **`src/pages/Index.tsx`** — Add lobby creation button
- **`src/lib/supabase.ts`** — Supabase client setup
- **`src/hooks/useLobby.ts`** — Lobby data fetching and real-time subscription

