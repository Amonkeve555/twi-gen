## Plan: Verify Gemini embedding fix for PDF ingestion

The `ingest-rules-pdf` function was updated to use `gemini-embedding-001` with `:embedContent` and `outputDimensionality: 768`. The stuck row was reset to `pending`. Now verify it works end-to-end.

### Steps

1. **Trigger re-ingestion** of the pending PDF row (via the admin UI or by invoking the function).
2. **Watch edge function logs** for `ingest-rules-pdf` to confirm embeddings succeed (no 404/400 from Gemini API).
3. **Check `rules_sources` row** transitions to `status = 'ready'` with a non-zero `chunk_count`.
4. **Check `rules_chunks`** has rows with non-null `embedding` of dimension 768.
5. **Apply matching fix to `rules-chat`** if needed — it currently uses `text-embedding-004` for query embedding, which will also 404. Switch it to `gemini-embedding-001` + `:embedContent` + `outputDimensionality: 768` so query and document vectors share the same model/dimensions.
6. **Test a rules question** in the AI chat to confirm retrieval + answer with citations.

### Technical notes

- Both query and document embeddings must use the **same model and dimensionality** or cosine similarity is meaningless. Step 5 is required, not optional.
- `gemini-embedding-001` only supports single `:embedContent` calls (no batch), so ingestion will be slower per chunk — acceptable for admin-side ingestion.
- If rate limits hit during ingestion, add a small delay between chunk calls.