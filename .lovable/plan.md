## Goal

Give your account `admin` rights and a dedicated **Admin** page where you can:

1. See all registered users (with profile name/nickname).
2. See all unclaimed "guest" identities — grouped by `session_id`, with the names used and counts of hosted lobbies / player slots.
3. Pick a guest identity → pick a target user → **link** (assign all matching `lobbies.host_user_id` and `lobby_players.user_id` to that user).

The infrastructure is already mostly there — `app_role` enum, `user_roles` table, `has_role()` function, and the `claim_guest_data(session_ids[])` RPC all exist. We just need an admin variant that targets *another* user, plus a UI.

## Plan

### 1. Database (one migration)

- Grant `admin` role to your account (`marek.sedlak555@gmail.com`, id `bf1319b4-...`) by inserting into `user_roles`.
- Add a SECURITY DEFINER RPC **`admin_link_guest_data(p_session_ids text[], p_target_user_id uuid)`** that:
  - Checks `has_role(auth.uid(), 'admin')` and rejects otherwise.
  - Updates `lobbies.host_user_id` and `lobby_players.user_id` for the given session IDs (only where currently NULL, to stay safe).
  - Returns `{hosted_lobbies, player_slots}`.
- Add a SECURITY DEFINER RPC **`admin_list_users()`** that returns `id, email, created_at, full_name, nickname` for every user (joins `auth.users` + `profiles`). Admin-only. This is needed because `auth.users` is not directly readable from the client.
- Add an RLS policy on `user_roles` so admins can SELECT all rows (currently only own rows are visible).

### 2. Frontend

- New hook **`useIsAdmin()`** — checks `user_roles` for the current user.
- New route **`/admin`** guarded by `AuthGuard` + admin check (redirect home if not admin).
- New page **`src/pages/Admin.tsx`** with two sections:
  - **Unclaimed guest identities** — same query the claim dialog already uses (groups unclaimed `lobbies` + `lobby_players` by `session_id`, shows names + counts).
  - **Users** — list from `admin_list_users()` RPC, searchable by email/nickname.
  - For each unclaimed identity row: a "Link to user…" button that opens a small dialog to pick a user, then calls `admin_link_guest_data`. Toast on success and refresh the list.
- Add an **Admin** entry in `UserMenu.tsx`, only shown when `useIsAdmin()` returns true.

### 3. Out of scope

- No changes to the existing self-service `claim_guest_data` flow.
- No edits to RLS on `lobbies`/`lobby_players` (the new RPC runs SECURITY DEFINER, so it bypasses them).
- No user deletion / role management UI — this is just a linking tool.

## Files

- New: `supabase/migrations/<timestamp>_admin_link_guest.sql`
- New: `src/hooks/useIsAdmin.ts`
- New: `src/pages/Admin.tsx`
- Edited: `src/App.tsx` (add `/admin` route)
- Edited: `src/components/UserMenu.tsx` (conditional Admin link)

## What you'll be able to do after this ships

Open the user menu → **Admin** → see "Mareček" (and any other guest identities) in one list, click "Link to user…", pick `marek.sedlak555@gmail.com` (or any other account), confirm. The history/stats for that user update on next load.
