## Per-lobby Map Editor

A new editor where the host arranges hex tiles for their game. The map is saved on the lobby and shown to all players (lobby view + game board).

### Tile representation (no precise tile sets)

Tiles are simple categories the host paints onto hexes:

- **Mecatol** (cyan)
- **Home** (player-colored, numbered by seat)
- **Blue** — generic planet system (blue tint)
- **Red** — anomaly / empty / supernova (red tint)
- **Hyperlane** (purple, dashed)
- **Empty** (eraser)

Each hex stores `{ q, r, kind, seat?, label? }`. Optional free-text `label` lets the host write "Mecatol", "Wormhole α", a planet name, etc.

### Editor page

New route `/lobby/:code/map-editor` (host-only):

```text
┌─────────────── Map Editor ───────────────┐
│  Base layout: [Official 6p ▼] [Blank 3-ring] [Blank 4-ring]    │
│  Brush:  [Mecatol] [Home ▼seat] [Blue] [Red] [HL] [Empty]      │
│                                                                  │
│              ┌──────────────────────────┐                        │
│              │      Hex grid (SVG)      │                        │
│              │   click to paint brush   │                        │
│              └──────────────────────────┘                        │
│                                                                  │
│  [Reset]  [Load official 6p]  [Save & close]                     │
└─────────────────────────────────────────────────────────────────┘
```

- Click a hex to paint it with the active brush.
- "Home" brush has a seat-index dropdown (1..N) so the host can mark which seat sits there.
- Optional "Label" mini-input — set the active label, then any hex you paint gets that label until you clear it.
- Switch between "official template by player count" and a "blank N-ring" canvas at any time. Switching templates warns before overwriting.

### Storage — per-lobby

Add a `custom_map` JSONB column to `lobbies`:

```json
{
  "rings": 3,
  "cells": [
    {"q":0,"r":0,"kind":"mecatol"},
    {"q":3,"r":-3,"kind":"home","seat":0},
    {"q":2,"r":-3,"kind":"blue","label":"Quann"}
  ]
}
```

`null` / missing = use the existing template-driven map (current behavior). RLS: host can update; everyone can read (matches existing lobby policies).

### Rendering

Reuse `MapSetupHex.tsx` (already flat-top). Add a `customMap` prop. When present, ignore `setup.cells` and render from `custom_map.cells`, mapping the `kind` to existing visual styles:

- `mecatol` → existing mecatol style
- `home` → home style colored by seat (reuses seat color logic + tile-control overlay)
- `blue` → soft blue fill
- `red` → soft red fill
- `hyperlane` → existing hyperlane style
- `empty` → existing empty style

The lobby `SeatingPanel`, `HistoryMiniMap`, and `/game/:code` board automatically get the custom layout when `lobbies.custom_map` is set.

### Files to add / change

- **Migration** — `lobbies.custom_map JSONB NULL`. No new RLS (existing lobby policies already cover host updates).
- **`src/pages/MapEditor.tsx`** (new) — editor page above. Loads/saves `lobbies.custom_map`.
- **`src/components/MapSetupHex.tsx`** — accept optional `customMap`; new style branches for `blue`/`red` brush kinds; render `label` text under the hex.
- **`src/pages/MapSetup.tsx`** — add a "Customize for a lobby" link (only when host of a lobby).
- **`src/pages/LobbyView.tsx`** — host-only "Edit map" button → `/lobby/:code/map-editor`.
- **`src/pages/GameBoard.tsx`** & **`src/components/HistoryMiniMap.tsx`** & **`src/components/SeatingPanel.tsx`** — pass `lobby.custom_map` through to `MapSetupHex`.
- **`src/App.tsx`** — register the new route.

### Out of scope

- Drag-and-drop reordering, undo/redo (single-click paint + Reset is enough).
- Numbered official tile catalog (24/25/26… planet names) — only free-text labels for now.
- Realtime collaborative editing — host saves; players see the result on next lobby refresh (Supabase Realtime row update already triggers re-fetch).
- Sharing maps across lobbies — strictly per-lobby for v1.
