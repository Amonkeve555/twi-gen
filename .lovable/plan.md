Plan to make race/faction information update from the ingested PDFs safely:

1. Add an admin-reviewed faction data pipeline
- Create a backend function that reads only `ready` ingested PDF chunks.
- For each full faction name, retrieve the relevant excerpts and ask Gemini to produce structured JSON matching the current faction fields: abilities, promissory note, starting units, starting tech, commodities, faction tech, agent, commander, hero.
- Save the generated result into the existing `faction_data_proposals` table instead of applying it automatically.

2. Add persistent approved overrides
- Add a small `faction_data_overrides` table keyed by faction name.
- Store only approved faction data plus citation/source metadata.
- Keep admin-only write access and public read access, matching the existing guide behavior.

3. Add admin review UI
- Extend the Rules PDFs/Admin area with a “Faction Data” section.
- Add a “Generate from ingested PDFs” button.
- Show pending proposals as a diff against the current `src/data/factions.ts` values.
- Add Apply / Discard actions so bad AI extraction never silently changes the live race data.

4. Use approved overrides in the app
- Add a shared hook/helper that merges static faction data with approved database overrides.
- Update the Faction Guide and faction-selection flows to use the merged data.
- Keep existing saved lobby/history faction snapshots intact so old games do not break.

5. Improve reliability and debugging
- Include citations/page references in each generated faction proposal so you can see where values came from.
- Surface extraction errors in the admin UI.
- Avoid re-embedding PDFs for this feature; it will reuse already-ingested chunks to avoid more Gemini quota pressure.

Technical notes:
- The current PDF ingestion only powers `rules-chat`; it does not update `src/data/factions.ts`.
- The app currently imports race data from a static TypeScript file, so runtime PDF updates need approved database overrides rather than trying to rewrite source code from a backend function.
- Generation will use Gemini through the existing AI setup, while the PDF semantic search stays on the existing `rules_chunks` embeddings.