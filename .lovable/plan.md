

## Increase Font Sizes & Show Full Faction Names

### Problem
Text across the app is too small — player names, faction names, labels, and status text are hard to read. Faction chips and tags only show `shortName` instead of full names.

### Changes

**1. Global base font size bump** (`src/index.css`)
- Change body from `text-lg` (18px) to `text-xl` (20px)

**2. FactionPool chips — show full names** (`src/components/FactionPool.tsx`)
- Change `{faction.shortName}` → `{faction.name}`
- Increase chip text from `text-sm` to `text-base`

**3. LobbyView — bigger text & full faction names** (`src/pages/LobbyView.tsx`)
- Player names: `text-sm` → `text-lg`
- Status bar text: `text-sm` → `text-base`
- Faction tags: `text-[10px]` → `text-sm`, show `f.name` instead of `f.shortName`
- Section headings: `text-sm` → `text-base`
- Page title: `text-2xl md:text-3xl` → `text-3xl md:text-4xl`

**4. JoinLobby — bigger text** (`src/pages/JoinLobby.tsx`)
- Page title: `text-2xl md:text-3xl` → `text-3xl md:text-4xl`
- Subtitle: `text-xs` → `text-sm`
- Section headings: `text-sm` → `text-base`
- Status text: `text-sm`/`text-xs` → `text-base`

**5. GameDay — bigger text & full names** (`src/pages/GameDay.tsx`)
- Page title: `text-2xl md:text-3xl` → `text-3xl md:text-4xl`
- Player names: `text-sm` → `text-lg`
- Faction name tags: `text-[10px]` → `text-sm`
- Section headings: `text-sm` → `text-base`
- Faction choice buttons text: `text-sm` → `text-base`

**6. FactionCard — bigger text** (`src/components/FactionCard.tsx`)
- Player label: `text-sm` → `text-base`
- Faction name: `text-lg` → `text-xl`

**7. TokenGrid — bigger text** (`src/components/TokenGrid.tsx`)
- Instruction text: `text-xs` → `text-sm`
- Token numbers: `text-sm` → `text-base`

**8. Index page** (`src/pages/Index.tsx`)
- Various `text-xs` labels → `text-sm`
- Status labels: `text-sm` → `text-base`

