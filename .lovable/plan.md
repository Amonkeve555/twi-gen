

## Home Page Redesign — Side-by-side Buttons + Inline Active Lobbies

### Changes

**`src/pages/Index.tsx`**

1. **Rename** "Begin Local Draft" → "Create Local Game"
2. **Layout**: Put both primary buttons in a single row (`flex-row`) instead of stacked
3. **Inline active lobbies**: Below the nav buttons, fetch and display the user's active (non-completed) lobbies directly on the home page — reusing the same fetch logic from `MyLobbies.tsx`. Show lobby cards with invite code, host name, player count, and status. Clicking navigates to the lobby. Keep the "My Lobbies" button for viewing all (including completed).

**Data fetching**: Add a `useEffect` in `Index` that fetches lobbies where the user is host or player (same logic as `MyLobbies`), filtered to `status != 'completed'`. Display them in a section titled "Active Lobbies" with the same card style.

### Files to modify
- `src/pages/Index.tsx` — rename button, side-by-side layout, add active lobbies list with fetch logic

