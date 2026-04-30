
# Ground TI4 content in official PDFs

Today, the Rules Assistant relies entirely on the LLM's training, and `src/data/factions.ts` is hand-curated. This plan replaces both with content traceable back to official PDFs you upload.

---

## What you'll get

1. An **Admin → Rules Sources** page where you upload one or more PDFs (Living Rules Reference, Prophecy of Kings, Codex I–IV, etc.). Each PDF becomes a "source" you can re-upload, rename, or delete.
2. The **Rules Assistant** answers using **only** those PDFs (RAG). Every answer shows citations like *"Living Rules Reference, p. 42"* with the exact passage. If the PDFs don't cover a question, it says so instead of guessing.
3. A **"Regenerate from PDFs"** action (admin-only) that re-derives `src/data/factions.ts` — abilities, starting tech, leaders, faction tech, promissory notes, commodities — by extracting structured data from the uploaded faction sections, then writes it back to the file as a one-time update you review.

---

## How it works (technical section)

### Storage & data model

- Supabase Storage bucket `rules-pdfs` (private; admin-only RLS).
- New tables:
  - `rules_sources` — one row per uploaded PDF (filename, label, page count, uploaded_by, status, error).
  - `rules_chunks` — `source_id`, `page_start`, `page_end`, `section`, `content` (text), `embedding` (vector(1536)). Indexed with `ivfflat` for cosine similarity. Requires enabling the `vector` extension.
- Both tables: admin-write via `has_role(... 'admin')`, public-read on `rules_chunks` only (so the chat function can query without service role).

### Ingestion pipeline (edge function `ingest-rules-pdf`)

Triggered after upload. Steps:
1. Download PDF from Storage.
2. Extract text + page numbers using `pdfjs-dist` (Deno-compatible, no native deps).
3. Chunk by section heading + 800-token sliding windows with 100-token overlap; keep page range per chunk.
4. Embed each chunk via Lovable AI Gateway (`google/text-embedding-004`, 1536 dims — free tier).
5. Insert into `rules_chunks`. Update `rules_sources.status = 'ready'`.
6. Stream progress back so the admin UI shows "Embedding 42/180 chunks…".

### Rules Assistant (updated `rules-chat` edge function)

For every user message:
1. Embed the question.
2. Top-k (k=8) cosine search against `rules_chunks` across all enabled sources.
3. Build a prompt: system instructions ("Answer only from the provided excerpts. If not covered, say so.") + numbered excerpts with `[Source: {label}, p. {page}]` tags.
4. Stream the model response (keep current `google/gemini-3-flash-preview` + SSE).
5. Return citations as a structured trailer the UI renders as clickable footnotes.

UI changes in `src/pages/RulesAssistant.tsx`: render citation chips under each assistant message; clicking opens a modal with the exact excerpt and page number.

### Faction data regeneration (admin tool)

A new admin page button **"Regenerate factions from PDFs"** calls a new edge function `regenerate-factions`:
1. For each of the 24 factions, retrieve all chunks tagged with that faction name (or whose section heading matches).
2. Send to `google/gemini-2.5-pro` with a strict JSON schema matching the existing `Faction` interface in `src/data/factions.ts`.
3. Validate with Zod, return the proposed file content.
4. Admin reviews a diff in-app and clicks "Apply" — the function writes the result to a new table `faction_data_proposals` for the AI to commit to `src/data/factions.ts` in a follow-up agent loop (we don't write source files from edge functions). You'll see the diff and approve before the file changes.

### Codex / Keleres handling

Whatever's in the uploaded PDFs becomes available — including Codex III's Keleres if you upload it. The faction list in `factions.ts` will be extended automatically by the regeneration step.

### Costs & limits

- Embeddings: Gemini text-embedding-004 is free on the gateway.
- Chat: per-message context grows by ~3k tokens of retrieved excerpts → still cheap on `gemini-3-flash-preview`.
- PDF size cap: 50 MB per file (Storage limit is fine for any TI4 rulebook).

---

## Build order

1. **Migration**: enable `vector` extension; create `rules_sources`, `rules_chunks`, storage bucket + RLS.
2. **Admin UI**: `/admin/rules-sources` page — upload, list, delete, status badges.
3. **Edge function `ingest-rules-pdf`**: extract → chunk → embed → insert.
4. **Update `rules-chat`**: add retrieval step + citations; update RulesAssistant UI to render them.
5. **Edge function `regenerate-factions`** + admin diff/apply flow.
6. Smoke test with a single uploaded PDF before committing.

---

## What I need from you

- Confirm this plan, then upload your PDF(s) — one or many, doesn't matter, you can add more later from the admin page.
- The PDFs need to be ones you have the right to use (FFG/Asmodee living rules are publicly distributed, so that's fine).

Reply with "Implement plan" to proceed, or tell me what to adjust.
