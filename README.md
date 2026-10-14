# CSV Check Studio

Check a small contact-list CSV before importing it. Find exact duplicate rows, trim stray edge spaces, and keep conflicting records visible for review. Processing runs locally in your browser.

**[Try the free browser checker](https://muelleryu.github.io/csv-check-studio/#demo)** · **[Preview the offline toolkit](https://muelleryu.github.io/csv-check-studio/kit.html)** · **[Buy CSV Cleanup Kit — $9 once](https://payhip.com/b/r3JDO)**

For virtual assistants, small-business operators and CRM administrators checking recurring, small contact-list exports. The $9 download adds file import, saved rules, missing-required-value and basic email-format checks, conflicting-ID flags, and audit CSV exports. It works offline after download, with no subscription or installation.

In the [fictional worked example](https://muelleryu.github.io/csv-check-studio/kit.html#contact-example), 5 input records become 4 after trimming and exact-row deduplication. Two different records with ID `002` both remain for review. The report flags one missing email, one email-format issue and one conflicting-ID group. This is an original test example, not a client result.

The checker handles comma-delimited UTF-8 CSV up to 2 MB / 10,000 rows. It does not merge by ID, find replacement email addresses, verify email deliverability, map CRM fields, or guarantee a safe import. If you only need occasional basic checks, start with the free tool.

No dependencies, analytics or server uploads. CSV calculations run in the browser. The hosting provider receives ordinary page requests. Do not post private customer data in GitHub issues.

## Run

Serve this folder with any static HTTP server, for example `python3 -m http.server 8080`, then open `http://localhost:8080`. Run core verification with Node 20+: `node --test core.test.mjs`.

## Rules and limits

- Comma-delimited UTF-8 CSV; unique nonempty headers; at most 2 MB and 10,000 data rows.
- Optional edge whitespace trimming; blanks are preserved, never inferred.
- Exact full-row duplicates are flagged by default. Removal requires selecting that rule. Equal IDs with different data remain separate.
- Optional totals use exact integer decimal arithmetic. Dot decimals only; no grouping, currency or exponent notation. Invalid and blank values are counted as exclusions and totals are labeled partial. No currency or business meaning is inferred.
- Export guards formula-like text with a leading apostrophe. The JSON report records these modifications. CSV contains no type metadata; import identifier columns as text to keep leading zeros.
- If the browser does not support downloads, use **Show export text** to select and copy the complete cleaned CSV. Download event capture could not be verified in the Codex in-app browser; the text fallback and serialization tests are verified.
- Numeric input is limited to 100 digits including up to 20 fractional digits. Browser preview is bounded; report and CSV include all accepted rows.

AI assisted the implementation. Validation results are in the public CI workflow and tests. No professional credentials, client history or income are implied.

## Downloadable toolkit

[CSV Cleanup Kit](https://payhip.com/b/r3JDO) costs $9 USD once. See the [preview, included files and fictional example](https://muelleryu.github.io/csv-check-studio/kit.html) before buying. The separate free checker remains available without a purchase. Implementation and marketing are AI-assisted; no paid customer results or income are claimed.

## Need a custom cleanup?

Discuss a scoped project via the [public Upwork profile](https://upwork.com/freelancers/~01f26bf42914b52bd2). Starting quote: $100 for one CSV up to 10,000 rows, agreed rules, a report and editable source. Scope, deadline, access and contract require agreement before paid work begins.
