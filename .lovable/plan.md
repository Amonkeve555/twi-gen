# Fix the embeddings 404 in PDF ingestion

The Lovable AI Gateway doesn't expose `/v1/embeddings` for this workspace, so `ingest-rules-pdf` fails with `route_not_found`. The chat side (Lovable AI) works fine — only embeddings need a different provider.

## Approach

Call **Google's Generative Language API directly** for embeddings, using `text-embedding-004` (the same model and **same 768-dim output** that's already in the database schema). This means:

- No DB migration needed — existing `vector(768)` column and any chunks stay compatible.
- Both ingestion *and* the query-side embedding in `rules-chat` get switched to the same direct-API call, so vectors stay in the same space.
- Chat answers continue to use the Lovable AI Gateway (Gemini) — that part already works.

## What's needed from you

A Google AI Studio API key (free tier is plenty for embedding rulebooks):
1. Go to https://aistudio.google.com/apikey
2. Click "Create API key" → copy the value
3. I'll then prompt you with the secret form to paste it as `GEMINI_API_KEY`

If you'd rather use OpenAI's `text-embedding-3-small` instead, say so — but that requires a DB migration to change the vector dimension (1536) and re-ingesting any existing PDFs.

## Implementation

### Edge function: `supabase/functions/ingest-rules-pdf/index.ts`
Replace the `embedBatch` function:
- Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key={GEMINI_API_KEY}`
- Body shape: `{ requests: [{ model: "models/text-embedding-004", content: { parts: [{ text }] }, taskType: "RETRIEVAL_DOCUMENT" }, ...] }`
- Read vectors from `embeddings[].values`
- Keep the existing batch size of 16 and the existing chunk-insert loop unchanged
- Add a clear error if `GEMINI_API_KEY` is missing

### Edge function: `supabase/functions/rules-chat/index.ts`
Same swap for the **single** query embedding, but with `taskType: "RETRIEVAL_QUERY"` (this is the recommended Gemini practice — document chunks use `RETRIEVAL_DOCUMENT`, the user's question uses `RETRIEVAL_QUERY`, which improves retrieval quality).
- Use the singular `:embedContent` endpoint for one vector.

### No database changes
- `rules_chunks.embedding` stays `vector(768)`.
- Existing chunks (if any are already in `ready` state with old vectors) remain valid because the model is unchanged.
- Any sources currently in `error` state can be re-ingested via the existing **Re-ingest** button in the admin panel.

### No frontend changes
The admin panel, upload flow, and Rules Assistant UI stay exactly as they are.

## Verification

After deploy I'll:
1. Confirm `GEMINI_API_KEY` is set.
2. Check `ingest-rules-pdf` logs are clean on a test re-ingest.
3. Send a sample question through `rules-chat` and confirm it returns a grounded answer with citations.

## Files touched

- `supabase/functions/ingest-rules-pdf/index.ts` — swap embedding call
- `supabase/functions/rules-chat/index.ts` — swap query embedding call
- (new secret) `GEMINI_API_KEY`

Confirm the Google API key route and I'll request the secret and implement.
