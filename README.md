# CSV Check Studio

Original AI-assisted project sample for small CSV cleanup and reconciliation work. The sample records are fictional; this is not evidence of paid client work or earnings.

Open the [live sample](https://muelleryu.github.io/csv-check-studio/) or discuss a scoped project via the [public Upwork profile](https://upwork.com/freelancers/~01f26bf42914b52bd2). Starting quote: $100 for one CSV up to 10,000 rows, agreed rules, a report and editable source. Scope, deadline, access and contract require agreement before paid work begins.

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

[Preview the CSV Cleanup Kit](https://muelleryu.github.io/csv-check-studio/kit.html), including a [fictional contact-list before/after example](https://muelleryu.github.io/csv-check-studio/kit.html#contact-example) calculated by the toolkit engine. It adds an offline package, file import, reusable rules, identifier conflict flags, required-value checks and audit CSV exports. The [product listing](https://payhip.com/b/r3JDO) is published at $9; PayPal is connected and the checkout is available. A $0 internal coupon checkout delivered the exact 7-file ZIP; payment settlement and paid customer revenue have not been verified. The original free demo remains available. Product preparation is not evidence of sales or revenue.
