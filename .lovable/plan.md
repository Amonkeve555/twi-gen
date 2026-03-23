

## Stats Dashboard

### Overview
Add a `/stats` page that computes win rates by faction and player rankings from the localStorage game history data. Accessible from the home page.

### Stats to Display

**Faction Stats Table**
- Faction name, games played, wins, win rate %, average VP
- Sorted by win rate (descending)
- Color-coded faction indicators

**Player Leaderboard**
- Player name, games played, wins, win rate %, average VP, average rank
- Sorted by wins then win rate

**Summary Cards**
- Total games played
- Most winning faction
- Most winning player

### Implementation

**New file: `src/pages/Stats.tsx`**
- Reads game history via `useGameHistory()` hook
- Computes all stats from `GameRecord[]` data client-side
- Two tabs: "Factions" and "Players"
- Summary cards at top
- Tables using existing `Table` UI components
- Empty state when no games recorded
- TI4-themed styling (StarField, glass panels, imperial borders)
- Back button to home

**Edit: `src/App.tsx`**
- Add route `/stats`

**Edit: `src/pages/Index.tsx`**
- Add "Stats" navigation button alongside Faction Guide and Rules Assistant

### Technical Notes
- All data comes from localStorage (same `useGameHistory` hook) — no database changes needed
- No new dependencies required
- Uses existing UI components (Table, Card, Tabs)

