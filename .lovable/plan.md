## Problem

The reference image is the official TI4 4-player setup ("Příprava galaxie pro čtyři hráče"). In the rulebook layout, **all 6 outer corner hexes of the galaxy are marked green as potential home positions**, and each player places their home tile on whichever green hex is closest to their physical seat at the table.

Our current `src/data/mapSetups.ts` does the opposite: it pre-assigns specific corners as homes (e.g. 4p uses NE/SE/SW/NW only), so the map does not match the official template the user expects.

The same applies to 3p and 5p — those are also rendered on the standard 3-ring map with all 6 corners available as potential homes per the rulebook.

## Fix

Update `src/data/mapSetups.ts` (3p/4p/5p builders only — 6p/7p/8p are correct) so:

1. All 6 ring-3 corner hexes (`[0,-3]`, `[3,-3]`, `[3,0]`, `[0,3]`, `[-3,3]`, `[-3,0]`) are marked with a new role `"home-option"` — i.e. potential green home positions, not pre-assigned to specific players.
2. Remove the per-player slice pre-assignments for these counts. The official template does not pre-color slices; players draft tiles into them. All non-corner ring-2/ring-3 hexes become `"empty"` (slot for drafted system tile), and ring-1 stays `"equidistant"` only if the rulebook marks them so — otherwise also `"empty"`.

Add the new role to `HexRole`:
```ts
export type HexRole = "mecatol" | "home" | "home-option" | "equidistant" | "slice" | "hyperlane" | "empty";
```

`"home"` stays for 6p/7p/8p (and for any count where a home is actually committed to a seat); `"home-option"` is the green "any of these" marker.

## Visual changes in `src/components/MapSetupHex.tsx`

- Add a style branch for `"home-option"`: green fill (`hsl(135 55% 50% / 0.35)`) with a solid green stroke matching the reference image's green hexes.
- Update `ROLE_LABELS` with `"Potential Home System"`.
- Update legend in `src/pages/MapSetup.tsx` to show "Potential Home (choose closest to your seat)" for 3p/4p/5p instead of the current "Home Systems" filled swatch.

## Seating implications

`getHomeSeats()` currently returns cells where `role === "home"`. For 3p/4p/5p it would now return an empty list, which would break `SeatingPanel` and tile-control overlays.

Options:
- **A:** Have `getHomeSeats()` also include `"home-option"` cells. For 4p that returns 6 candidate seats but the lobby only has 4 players — seat assignment UI would need to let the host pick which 4 of the 6 green positions are used, or auto-pick the 4 evenly-spaced ones based on player count.
- **B:** Keep seating logic on a fixed canonical subset (e.g. NE/SE/SW/NW for 4p, the current behavior) but render all 6 corners green visually. Seating mini-maps and tile control keep working unchanged; only the visual map matches the rulebook.

**Recommended: Option B.** It matches the rulebook visual exactly while preserving existing seating + tile control behavior. The 4 (or 3, or 5) "active" seats are still rendered as `"home"` (player-colored) and the remaining outer corners get the green `"home-option"` style. So a 4p map will show 4 colored homes + 2 green optional spots, a 3p shows 3 colored + 3 green, a 5p shows 5 colored + 1 green.

## Files to change

- `src/data/mapSetups.ts` — add `"home-option"` role; mark unused outer corners as `"home-option"` in 3p/4p/5p builders; keep slices/equidistants as-is so existing seating/tile logic continues to work.
- `src/components/MapSetupHex.tsx` — add green styling + label/tooltip for the new role.
- `src/pages/MapSetup.tsx` — add a "Potential Home" entry to the legend when applicable.

## Out of scope

- 6p/7p/8p maps (already match the rulebook).
- Seating logic, tile control, and `getHomeSeats` (unchanged).
- Slice colorization (left as-is; can be revisited later if you want the visual to fully match the empty-template look where slices aren't pre-colored).
