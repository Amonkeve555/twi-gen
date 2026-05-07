## Goal
Replace the read-only `/map-setup` page with a full-featured **Map Editor** that any signed-in user can use to design and save personal map templates. Lobby hosts can then load saved templates via a dropdown picker in the lobby map editor.

## Changes

### 1. New table: `map_templates`
Migration creates a personal-templates table:
- `id`, `user_id` (uuid, not null), `name` (text), `data` (jsonb — `CustomMap` shape), `created_at`, `updated_at`.
- RLS:
  - Anyone authenticated can `SELECT` their own rows.
  - Insert/update/delete restricted to `user_id = auth.uid()`.
- `updated_at` trigger using existing `update_updated_at_column()` pattern.

### 2. `/map-setup` becomes the standalone Map Editor
- Rewrite `src/pages/MapSetup.tsx` (or rename to `MapTemplates.tsx` and update route in `App.tsx`) to host the same editor UI currently in `src/pages/MapEditor.tsx`, minus the lobby-specific save/clear-override buttons.
- Reuse `MapSetupHex` with `gridGuide`, brushes, label input, base layouts (Official Np, Blank 3/4-ring, Free canvas).
- Add a **Templates panel**:
  - "Save as template" → prompts for a name, inserts into `map_templates`. If signed out, show a sign-in CTA.
  - List of the user's saved templates with **Load**, **Rename**, **Delete** actions.
- Keep StarField, imperial styling, back button.

### 3. Home page link
- In `src/pages/Index.tsx`, change the "Map Setup" tile label/icon to **"Map Editor"** pointing to `/map-setup` (route stays the same to avoid breaking links). Description updated to reflect editing/templates.

### 4. Lobby Map Editor: template dropdown
- In `src/pages/MapEditor.tsx`, add a new "Load template…" Select (shadcn) in the **Base layout** card, populated from `map_templates` for the current user.
- On select → `setMap(template.data)` (same confirm prompt pattern as `loadTemplate`).
- Also expose **"Save current map as template"** button so a host can promote the in-progress lobby map to their library without leaving.

### 5. Shared helpers
- Add `src/lib/mapTemplates.ts` with `listMyTemplates()`, `saveTemplate(name, map)`, `renameTemplate(id, name)`, `deleteTemplate(id)` wrapping supabase calls.
- Reuse `CustomMap` type and `customMap.ts` helpers (`blankCustomMap`, `freeCanvasMap`, `setupToCustomMap`) — no duplication.

### 6. Memory
- Update `mem://features/map-setup-tool` to reflect the shift from read-only viewer to editor + personal template library.

## Out of scope
- Shared/global templates, admin promotion, template thumbnails, versioning/forking, public template browsing.
- Square/offset grid, drag-to-move, multi-select, undo/redo (already out of scope from prior plan).
- Backwards-compatibility shim for `/map-setup` viewer — it's fully replaced.

## Technical notes
- The `map_templates.data` column stores the existing `CustomMap` JSON shape (`{ rings, cells }`), so loading into either editor is a direct assignment.
- Template list query is filtered by `user_id = auth.uid()` and ordered by `updated_at desc`. RLS already enforces ownership; the filter is just for clarity.
- Anonymous visitors to `/map-setup` can still use the editor locally (state in memory) but Save/Load actions show "Sign in to save templates".
