## Map Setup Reference Tool (PoK)

A standalone page that displays the **official Twilight Imperium 4 map setup template** for 3–8 players, following the rules from the Living Rules + Prophecy of Kings. No tile randomization — just the official empty hex layout showing Mecatol Rex, home system positions, and the empty slots where players place system tiles, exactly as in the rulebook.

### What the user gets

- A new route `/map-setup` reachable from the home page secondary grid (alongside Faction Guide / Rules Assistant).
- A player-count selector: **3, 4, 5, 6, 7, 8** players (PoK-supported counts).
- An interactive SVG hex map that re-renders for the selected count, showing:
  - **Mecatol Rex** at the center (always).
  - **Home system slots** highlighted per player (color-coded, labeled "P1 Home", "P2 Home", …).
  - **Equidistant system slots** (shared, neutral).
  - **Player slice slots** (the 5 systems in front of each home for standard counts; PoK adjusts for 7/8p with the extended map).
  - Map shape adjusted per official rules: 3 rings for 3–6p, extended/hyperlane layout for 7–8p (PoK).
- Hover/tap a hex → tooltip shows the slot's role ("Home system", "Equidistant", "Slice — front", "Mecatol Rex", "Hyperlane (fixed)").
- A small legend + a note stating "Official setup per Living Rules + Prophecy of Kings."

### What it is NOT (per your answers)

- No tile randomization or balanced auto-generation.
- No drafting / Milty slices.
- No multiplayer/lobby integration — purely a reference tool.
- No tile artwork — empty labeled hexes only (slots, not specific systems).

### Layout

```text
Home (header: "Map Setup")
  ├─ Player count selector  [3] [4] [5] [6] [7] [8]
  ├─ Hex map (SVG, responsive, themed)
  │     • Mecatol Rex (center, gold glow)
  │     • Home slots (per-player accent color)
  │     • Equidistant slots (muted)
  │     • Slice slots (subtle player tint)
  │     • Hyperlane fixed tiles (7p/8p only)
  └─ Legend + rule citation note
```

### Technical details

- **New file**: `src/pages/MapSetup.tsx` — page shell, count selector, legend.
- **New file**: `src/components/MapSetupHex.tsx` — SVG renderer. Takes a layout config and draws axial-coordinate hexes with role-based styling.
- **New file**: `src/data/mapSetups.ts` — Static config per player count. Each entry:
  ```ts
  type HexRole = "mecatol" | "home" | "equidistant" | "slice" | "hyperlane" | "empty";
  type HexCell = { q: number; r: number; role: HexRole; player?: number; label?: string };
  type MapSetup = { players: 3|4|5|6|7|8; rings: number; cells: HexCell[]; notes: string };
  ```
  Coordinates and roles transcribed from the official PoK setup diagrams (3p triangle in 3-ring map, 4p, 5p, 6p standard 3-ring; 7p and 8p use the PoK extended map with fixed hyperlane tiles).
- **Hex rendering**: pointy-top axial → pixel; viewBox auto-fits ring count. Pure SVG, no extra deps.
- **Routing**: register `/map-setup` in `src/App.tsx`.
- **Home integration**: add a tile in the secondary 2×2 grid on `src/pages/Index.tsx` ("Map Setup") linking to `/map-setup`.
- **Theming**: gold/amber primary for Mecatol + headers, glassmorphism panel, Cinzel labels, Rajdhani body — consistent with existing style memory.
- **Responsive**: SVG scales; on the current 667-wide mobile viewport the map fits with horizontal padding; legend stacks below.

### Out of scope (could be follow-ups)

- Random balanced generator, slice draft, tile pool placement, lobby sync, sharable map images.

### Acceptance

- Selecting any of 3–8 renders a structurally correct empty map with Mecatol center, correct home count, equidistant tiles, and (for 7/8p) the PoK hyperlane skeleton.
- Tooltips identify each hex's role.
- Page is reachable from home and matches the Imperial theme.