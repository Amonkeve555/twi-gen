

## Host Password for Lobby Management

### Overview
When creating a lobby, the host sets a custom password. On any device, entering this password on the lobby view grants host privileges (manage game, kick players, delete lobby, start Game Day).

### Database Change
- Add `host_password` (text, not null) column to `lobbies` table

### Frontend Changes

**`src/pages/CreateLobby.tsx`**
- Add a "Host Password" input field in the lobby creation form
- Store password in the `host_password` column on insert

**`src/pages/LobbyView.tsx`**
- If current session is not the host, show a "Claim Host" button
- Clicking it opens a password input dialog
- On correct password: update `host_session_id` to current session ID → user becomes host on this device
- On wrong password: show error

**`src/pages/GameDay.tsx`**
- Same "Claim Host" button + password dialog for non-host users

**`src/lib/inviteCode.ts`**
- No changes needed (user sets their own password)

### Flow
```text
CREATE LOBBY
  → Enter host password (your choice)
  → Lobby created

LOBBY VIEW (any device)
  → Not recognized as host?
  → Click "Claim Host" → enter password → verified → you're the host
```

### Security Note
Password is stored as plain text since there's no auth system — this is a lightweight access control for a game lobby, not sensitive data protection. RLS is already fully open on these tables.

