

## Faction Guide + AI Rules Assistant

Two features: a static faction reference guide and an AI-powered rules assistant for resolving game questions in real time.

### 1. Faction Guide Page (`/factions`)

A searchable reference page showing all TI4 + PoK factions with detailed info.

**Data**: Extend `src/data/factions.ts` to include per-faction details:
- Abilities (faction abilities, promissory note)
- Starting units, commodities, starting tech
- Brief strategy tips

**UI**: New page `src/pages/FactionGuide.tsx`
- Search/filter bar at the top
- Toggle for base game vs PoK factions
- Expandable cards for each faction showing all details
- Consistent TI4 styling (glass panels, imperial borders)

### 2. AI Rules Assistant (`/rules`)

A chat interface where players can ask TI4 rules questions and get grounded answers.

**Backend**: New edge function `supabase/functions/rules-chat/index.ts`
- Uses Lovable AI (Gemini) with a system prompt containing TI4 rules context
- System prompt includes core rules references (combat, action cards, strategy cards, agenda phase, etc.)
- Streaming responses for real-time feel

**Frontend**: New page `src/pages/RulesAssistant.tsx`
- Chat interface with message history (session-only, no persistence needed)
- Markdown rendering for AI responses (react-markdown)
- Pre-built quick question buttons (e.g. "How does Space Combat work?", "Explain the Agenda Phase")
- TI4-themed styling

### 3. Navigation Updates

- **Index page**: Add two new buttons — "Faction Guide" and "Rules Assistant" — in the bottom section
- **App.tsx**: Add routes `/factions` and `/rules`

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/data/factions.ts` | Add detailed faction data (abilities, units, tips) |
| `src/pages/FactionGuide.tsx` | New searchable faction reference page |
| `src/pages/RulesAssistant.tsx` | New AI chat page for rules questions |
| `supabase/functions/rules-chat/index.ts` | Edge function calling Lovable AI with TI4 rules context |
| `src/pages/Index.tsx` | Add navigation buttons |
| `src/App.tsx` | Add new routes |

### Technical Notes

- AI uses `google/gemini-3-flash-preview` via Lovable AI gateway — no API key needed from user
- System prompt will be comprehensive with TI4 core rules to ground responses
- Streaming SSE for responsive chat experience
- `react-markdown` for rendering formatted AI responses
- No database tables needed — chat is ephemeral per session

