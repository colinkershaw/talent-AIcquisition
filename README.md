# Talent AIcquisition

Prototype for rich grounded AI talent acquisition app.

> *Résumés are lossy compression. This is an attempt to do something about that.*

## The Problem

Hiring decisions are made on thin signal. A résumé compresses years of context into two pages. An ATS compresses those two pages further. A recruiter spending three minutes on a screen compresses what remains into a yes or no.

The signal lost in that chain is often the most important signal — the reasoning behind decisions, the articles someone wrote, the problems they built solutions for at midnight because the problem wouldn't let them go.

NotebookLM demonstrates that richer source material dramatically changes candidate assessment. Ask it a question about a candidate with only their résumé loaded, then ask the same question with their writing, their code, their project post-mortems. The difference is not subtle.

The friction: NotebookLM requires a Google login, which makes sharing with hiring teams awkward enough that most candidates don't try.

## What This Is

A RAG pipeline that grounds candidate assessment in a configurable document store — résumés, articles, code stories, chat transcripts, anything that carries signal. Built on Gemini's `fileSearch` grounding API with a custom citation engine that addresses a specific non-obvious problem: **Gemini's grounding metadata character offsets drift relative to the actual rendered output**, causing naive implementations to plant citations mid-word, inside markdown formatting tokens, or colliding with headers.

The citation engine solves this with an anchor-search approach rather than trusting absolute indices. The test suite documents the failure modes it was built to prevent.

## Architecture

```
grounding-supports.ts    — Gemini API + RAG file store integration
citation-engine.ts       — Anchor-based citation injection (the interesting part)
html-generator.ts        — Marked-based rendering with interactive citation badges
```

**Entry points:**
- `grounding-support-console.ts` — JSON output to terminal
- `grounding-support-html.ts` — Interactive HTML report written to disk

## The Non-Obvious Part

Gemini returns `groundingSupports` with `startIndex`/`endIndex` offsets indicating where to inject citations. These offsets drift — sometimes by several characters — relative to the actual string the model emitted. A naive implementation produces:

```
Expert in Ka[1.1]fka. Next sentence.
```

The citation engine instead searches for the actual segment text as an anchor, injects after the found location, then walks forward past any markdown formatting characters (`*`, `_`) before inserting. Processing runs in reverse order to prevent cascading index shifts from earlier injections corrupting later ones.

The test suite covers: index drift recovery, bold/italic snap-out, header collision prevention, multi-paragraph drift, table integrity, multiple citations at a single point, and fallback behaviour when the anchor text cannot be found.

## Sample Output

See [`sample/assessment_report.html`](sample/assessment_report.html) — open directly in a browser. Generated against a fictional candidate (`Alex Chen`) and a real job description. No setup required to see what the tool produces.

## Setup

```bash
npm install
cp .env.example .env.local
# Add GOOGLE_GENERATIVE_AI_API_KEY and GEMINI_FILE_SEARCH_STORE_ID
npx ts-node src/grounding-support-html.ts
```

A Gemini API key and a configured File Search store (populated with candidate documents) are required. See [Google AI File Search documentation](https://ai.google.dev/docs) for store setup.

## Status

Prototype. NotebookLM is meaningfully better — Google has invested heavily in it and smarter people built it. This exists because the Google login requirement creates enough friction to defeat the purpose, and because the citation drift problem was interesting enough to solve properly.

The core pipeline works. Hosting, authentication, and a candidate-facing UI are the remaining gaps between this and something a hiring team could actually use.

## License

MIT
