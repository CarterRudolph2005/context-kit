## Research profile

- Purpose: {{researchPurpose}}
- Answer style: {{answerStyle}}
- Source types: {{sourceTypesList}}
- Outputs: {{outputsList}}
- Web lookups: {{webAccessLabel}}

## Research rules

### Folders

- **R1. `raw/` is read-only.** Never edit, rename, move or delete anything in it. Skip `raw/README.md`. If a file can't be read, say so and list it under **Could not read** in `wiki/index.md`.
- **R2. `wiki/` is yours.** {{userName}} rarely edits it. If they do, keep their edits.
- **R3. Outputs** go in `outputs/`, named `YYYY-MM-DD-<slug>.<ext>`.

### Links

- **R4.** Use Obsidian wikilinks such as `[[slug]]`.
- **R5.** Slugs are lowercase-hyphenated and unique across the whole wiki. Source pages use the prefix `src-`.

### Ingest

Ingest begins when {{userName}} says "ingest", runs `/ingest`, or when you notice new files in `raw/`.

- **R6.** Find raw files that have no row in the **Sources** table of `wiki/index.md`.
- **R7.** For each one, create `wiki/sources/src-<slug>.md` with these parts, in order:
  - the title
  - `Raw file:` with a relative link
  - `Type:`, `Authors:`, `Date:`, `URL:` using only information in the source; otherwise write `unknown`
  - `Ingested: YYYY-MM-DD`
  - `## Summary` of at most 150 words
  - `## Key points` as bullets, with page or section numbers where available
  - `## Concepts` with wikilinks
- **R8.** For every concept the source touches, create or extend `wiki/concepts/<slug>.md` with a one-line definition, `## Overview`, `## Evidence`, `## Open questions & contradictions`, and `## Related`. Every claim under Evidence ends with `(source: [[src-…]])`.
- **R9.** Update `wiki/index.md`: add `slug | title | raw file | ingested` to the **Sources** table and add `[[slug]] — one-line summary` under **Concepts**.
- **R10.** For datasets, describe columns, row count and notable values without copying the data. For images, describe and link them. For very large files, note which parts you read.
- **R11.** Work in batches of at most 5 sources and update `wiki/index.md` after each batch so an interrupted ingest can resume. Tell {{userName}} how many are left.

### Ask

Ask begins when {{userName}} says "ask …", runs `/ask`, or asks any research question.

- **R12.** Read `wiki/index.md` first, then only the relevant pages. Return to `raw/` only for details the wiki lacks.
- **R13.** Answer in the chosen answer style, with `[[src-…]]` citations. Say clearly when the wiki doesn't contain the answer. Never fill gaps with unsupported claims.
- **R14.** Short answers go in chat. Anything over about 20 lines, or anything {{userName}} wants kept, goes in `outputs/` using a selected format: reports are `.md`; slides are Marp `.md` with `marp: true` frontmatter; charts are a matplotlib `.png` plus its script if Python is available, otherwise a Markdown table. Slides are the only frontmatter exception.
- **R15.** File results back. If an answer produced new synthesis, add it to relevant concept pages with a citation to the output file, remove the question from **Questions to explore** if answered, and log it.

### Health check

Health check begins when {{userName}} says "health check" or runs `/lint`.

- **R16.** Directly fix un-ingested raw files, broken wikilinks, orphan pages, and missing or stale index entries.
- **R17.** Report rather than silently decide claims without a source, contradictions between pages, and thin concepts. Also list contradictions in the concept's contradictions section and add 3–5 suggested next questions under **Questions to explore**.
- **R18.** Write the report to `outputs/YYYY-MM-DD-health-check.md`.
- **R19. Web lookups.** {{webAccessRule}}

### Scale and integrity

- **R20.** When `wiki/index.md` passes about 300 lines, split the **Concepts** list into `wiki/indexes/<category>.md` and link those files from the main index.
- **R21.** Never invent sources, authors, dates, quotes or URLs. Mark anything uncertain `[unverified]`.
