## Goal
Add a "Free canvas" mode to the Map Editor so the host can place tiles anywhere on a hex grid (any shape — rectangle, line, asymmetric).

## Changes

### 1. `src/pages/MapEditor.tsx`
- Add a **Free canvas** button next to "Blank 3-ring / 4-ring". Loads an empty `CustomMap` (no cells, `rings: 6`).
- Add an **Erase** brush. When active, clicking a tile removes it from `cells`.
- Painting a tile on an empty grid slot adds a new cell at that `q,r`.

### 2. `src/components/MapSetupHex.tsx`
- New optional prop `gridGuide?: { range: number }`. When set, renders faint dashed hex outlines for every axial `q,r` within `range` (≤ range, hex distance) behind real tiles, and forwards clicks on guide hexes via `onTileClick(q, r, undefined)`.
- ViewBox expands to include the guide range so the canvas stays stable as tiles are added/removed.
- Existing rendering paths (seat-aware, tile-control, neutral) untouched.

### 3. `src/lib/customMap.ts`
- Add `freeCanvasMap()` returning `{ rings: 6, cells: [] }`.

### 4. Editor wiring
- When the current map has 0 cells or was created via Free canvas, pass `gridGuide={{ range: 6 }}` to `MapSetupHex`. Otherwise pass it whenever neutral mode is on, so the host can extend any layout outward.
- Erase brush: in `paintCell`, if brush is `erase` and the cell exists, remove it; if it doesn't exist, no-op.

## Out of scope
- Square/offset grid, drag-to-move, undo/redo, rotating hyperlanes, multi-select.
- Changing how lobby/seating/game-board render saved maps (already shape-agnostic).
