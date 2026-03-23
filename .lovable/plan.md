

## Simplify Home Page — Move Setup Into Local Draft Flow

### Overview
Remove the PlayerSetup and FactionPool controls from the home page. The landing page becomes a clean menu with two primary actions and navigation links. When "Begin Local Draft" is clicked, a new setup phase appears inline (same page) where the user configures players, picks, and factions before starting.

### Changes

**`src/pages/Index.tsx`**
- Add a new phase: `"menu"` before `"setup"` — the landing state shows only buttons (Begin Local Draft, Create Online Lobby, and nav links)
- When "Begin Local Draft" is clicked → transition to `"setup"` phase which shows PlayerSetup + FactionPool + "Start Draft" button (existing UI, just moved behind a click)
- Add a "Back" button in setup phase to return to menu
- The `reset` function returns to `"menu"` instead of `"setup"`
- Remove the "Create Online Lobby" button from the setup phase (it stays on menu only)

**No other files change** — CreateLobby already has its own setup UI for the online flow.

### Flow
```text
MENU (landing)
  ├─ Begin Local Draft → SETUP (players, picks, factions) → DRAFT → ...
  ├─ Create Online Lobby → /create (existing page)
  ├─ My Lobbies → /my-lobbies
  ├─ Game History → /history
  ├─ Faction Guide → /factions
  ├─ Rules Assistant → /rules
  └─ Stats → /stats
```

