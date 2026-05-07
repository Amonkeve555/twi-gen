## Goal

In the Map Editor, drop all auto-numbering and per-seat colors. Hosts paint a neutral map and place "Home" tiles wherever they want — no seat assignment, no template-driven player coloring.

## Changes

### 1. `src/pages/MapEditor.tsx`
- Remove the seat-number picker UI (the `Seat #` row with 1..N buttons).
- Remove the `seatForBrush` state and stop writing `seat` onto painted cells.
- Keep brushes: Mecatol, Home, Blue, Red, Hyperlane, Empty (no seat metadata on Home).

### 2. `src/components/MapSetupHex.tsx` (editor-only mode)
Add a new prop `neutral?: boolean`. When `true`:
- Do not render any text labels on tiles (no "MR", no "P1", no slice numbers, no seat numbers, no "HL").
- Render every non-hyperlane tile with a single neutral style (dark fill, muted border).
- Render `home` tiles with a uniform accent (single gold/amber stroke + subtle fill) — the same for every home, no per-player palette.
- Hyperlanes keep their dashed purple style so they remain visually distinct.
- User-typed `label` text on a tile is still rendered (that's intentional content).

The existing colored/seat-aware rendering paths stay untouched for `LobbyView`, `GameBoard`, `SeatingPanel`, and `HistoryMiniMap`.

### 3. `MapEditor.tsx` rendering
Pass `neutral` to `<MapSetupHex>` so the editor canvas is neutral.

### 4. Data model
No DB or type changes. `seat` becomes optional/unused on cells painted in the editor; existing maps with `seat` values still load fine (the field is just ignored visually in neutral mode and elsewhere relies on `seatOrder` derived from home cells in placement order).

## Out of scope
- Changing how the lobby/game board displays the saved map (those keep their existing seat coloring driven by faction colors).
- Reworking seat assignment logic in `SeatingPanel` (separate concern).
