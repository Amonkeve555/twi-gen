## Why it feels slow (it's not the guest accounts)

Your database currently has **1 lobby** and **4 player rows** total — that's nothing. Guest/unclaimed records are not the bottleneck. The slowness comes from **how the pages load**, not how much data they load.

Concretely:

1. **History and Stats each refetch from scratch.** `useOnlineGameHistory` runs on every mount with no cache, so navigating Home → History → Stats triggers the full query chain twice.
2. **Three sequential round-trips per visit.** The hook does: (a) fetch hosted lobby IDs, (b) fetch played lobby IDs, (c) fetch lobbies by ID, (d) fetch all players by lobby ID — four awaits, two of them sequential. Each round-trip to Supabase from the browser is ~150–400 ms.
3. **No loading skeleton on History.** History renders the empty state instantly while data is still loading, then pops in — which reads as "slow / broken".
4. **Auth call on every fetch.** `supabase.auth.getUser()` hits the network each time instead of using the cached session.

## Plan

### 1. Make the online history hook fast and cached
- Run the hosted-lobby and played-lobby ID queries **in parallel** (`Promise.all`).
- Replace `supabase.auth.getUser()` with `supabase.auth.getSession()` (synchronous, no network).
- Add a tiny module-level cache (Map keyed by user id, ~30 s TTL) so navigating between History and Stats reuses the result instead of refetching.
- Expose a `refetch()` for manual refresh.

### 2. Share one hook between History and Stats
- Both pages already call `useOnlineGameHistory` independently. With the cache above they'll share results automatically — no duplicate network work when switching pages.

### 3. Add a proper loading state to History
- History currently has no `loading` flag wired up. Show the same "Loading…" placeholder Stats uses, so the page doesn't flash the empty state.

### 4. (Optional, low-effort) Server-side aggregation
- Not needed at current data volume. Revisit only if completed-lobby count grows past a few hundred. At that point we'd add a `get_user_history` RPC that returns lobbies + players in one round-trip.

## What you'll notice

- First visit to History/Stats: ~1 round-trip instead of 3–4 (noticeably snappier).
- Switching between History and Stats within 30 s: instant (served from cache).
- No more "empty state then content" flash on History.

## Files touched

- `src/hooks/useOnlineGameHistory.ts` — parallel queries, cached session, in-memory cache, refetch.
- `src/pages/History.tsx` — consume `loading`, show placeholder.
- `src/pages/Stats.tsx` — no change needed (already handles `loading`).

No database or RLS changes. No changes to the guest-claim flow.
