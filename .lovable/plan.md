Implement a clear Users management area inside Admin so you can actually browse accounts and link guests without hunting through one mixed page.

Plan:
1. Split `/admin` into two obvious admin sections using tabs or segmented navigation:
   - `Users`
   - `Guest Accounts`

2. Make `Users` the first/default view:
   - Show all registered users in a full admin list/table.
   - Include email, nickname/full name, created date, and user ID.
   - Add search by email/name/nickname/user ID.
   - Add a “Link guest” action per user.

3. Make `Guest Accounts` a separate view:
   - Show unclaimed guest session IDs with known player/host names.
   - Show counts for hosted lobbies and player slots.
   - Add search by guest name/session ID.
   - Keep the existing “Link” flow, but make target user selection easier.

4. Improve the link workflow:
   - From a user row: choose one or more guest identities to attach to that user.
   - From a guest row: choose a user to attach it to.
   - Keep admin-only backend RPC usage and show success/error messages clearly.

Technical details:
- Update `src/pages/Admin.tsx` only unless routing/menu labels need small wording tweaks.
- Reuse the existing `admin_list_users` and `admin_link_guest_data` backend functions.
- Keep access protection through `AuthGuard` and `useIsAdmin`.
- No new database schema is required.