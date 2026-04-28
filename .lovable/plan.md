# Add User Accounts (Cross-Device Identity)

## Goal

Replace fragile per-device session IDs with real user accounts. Hosts and players must sign in to create or join lobbies. Existing guest data can be claimed once into the new account.

## What Changes for Users

- **Sign up / sign in** with email + password or Google. New `/auth` page.
- **Profile**: each account has a **full name** and a **nickname** (the nickname is what appears in lobbies and stats).
- **Hosts**: must be signed in to create a lobby. No more host password — ownership is tied to the account.
- **Players**: must be signed in to join a lobby. Joining auto-uses the account's nickname (no per-lobby name typing).
- **Cross-device**: open the app on any device, sign in, and your lobbies, picks, and history are right there.
- **One-time claim**: the first time a returning user signs in, the app offers to claim their old guest player slots and game history (matched by the localStorage session ID still on that device).

## New Auth Flow

1. New `/auth` page with tabs: **Sign In** / **Sign Up**, plus a **Continue with Google** button on both.
2. App-wide auth guard: visiting `/create`, `/lobby/*`, `/my-lobbies`, `/history`, `/stats` while signed out redirects to `/auth`.
3. Public pages remain: `/factions`, `/rules`, and `/` (home shows a "Sign in to start" CTA when signed out).
4. After sign-up, user is taken to a quick **profile setup** step to enter full name + nickname before they can use the app.
5. Header gets a user menu (avatar/initials, nickname, Sign out, Profile).

## Database Changes

- New `profiles` table: `id` (FK → `auth.users`), `full_name`, `nickname` (unique), `created_at`, `updated_at`. RLS: anyone can read; only owner can update.
- New `user_roles` table + `app_role` enum + `has_role()` security-definer function (standard pattern, future-proofs admin features).
- `lobbies.host_session_id` → add `host_user_id uuid` (nullable for now to preserve old rows). Eventually drop `host_session_id` + `host_password` once migration is complete.
- `lobby_players.session_id` → add `user_id uuid` (nullable for old rows). Add unique constraint `(lobby_id, user_id)` once populated.
- Trigger on `auth.users` insert → create empty `profiles` row.
- Update RLS on `lobbies` and `lobby_players` to require `auth.uid()` for insert/update/delete (host actions limited to `host_user_id = auth.uid()`).
- Update `claim_token` RPC to use `user_id` instead of `session_id` for picks.

## One-Time Claim Flow

After first sign-in:
- App reads local `ti4-session-id` from localStorage.
- Queries `lobby_players` and `lobbies` where `session_id` / `host_session_id` matches AND `user_id` / `host_user_id` is null.
- Shows a modal: "We found N games and M lobbies on this device. Claim them?"
- On confirm: bulk-update those rows to set `user_id` / `host_user_id` to the new account.
- Stores a flag in localStorage so the prompt doesn't appear again on that device.

## Code Changes (high level)

- **New**: `src/pages/Auth.tsx`, `src/pages/ProfileSetup.tsx`, `src/components/AuthGuard.tsx`, `src/components/UserMenu.tsx`, `src/components/ClaimGuestDataDialog.tsx`, `src/hooks/useAuth.ts`, `src/hooks/useProfile.ts`.
- **Update**: `App.tsx` routes (add `/auth`, `/profile`, wrap protected routes in `AuthGuard`), `Index.tsx` (signed-out CTA), `CreateLobby.tsx` (use `auth.uid()` instead of session ID, drop host password), `JoinLobby.tsx` (auto-name from profile nickname, drop name input), `LobbyView.tsx` + `GameDay.tsx` (resolve `myPlayer` by `user_id`), `useLobby.ts`, `useOnlineGameHistory.ts`, `MyLobbies.tsx`.
- **Remove**: `ClaimHostDialog.tsx` and `ClaimPlayerDialog.tsx` (no longer needed — identity is global).
- **Keep but deprecate**: `src/lib/sessionId.ts` (used only for the one-time claim lookup, then ignored).

## Out of Scope

- Email verification customization (use Lovable defaults).
- Password reset UI (can be added later — `supabase.auth.resetPasswordForEmail` is one call).
- Friends / social features.
- Migrating existing host-password-protected lobbies that nobody on this device created — those stay accessible to whichever device originally hosted them until a user claims them.

## Open Questions Already Resolved

- Account scope: required for everyone.
- Sign-in: email/password + Google.
- Existing data: one-time claim flow on first sign-in.
- Identity: profile has both full name and nickname; nickname is shown in-game.
