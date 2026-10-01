export const MAX_ROWS = 10000;
export const MAX_BYTES = 2_000_000;

export function parseCSV(input) {
  if (new TextEncoder().encode(input).length > MAX_BYTES) throw new Error('Use a CSV smaller than 2 MB.');
  const text = input.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], cell = '', state = 'plain', touched = false;
  const finishCell = () => { row.push(cell); cell = ''; state = 'plain'; };
  const finishRow = () => {
    finishCell();
    if (touched || row.length > 1 || row[0] !== '') rows.push(row);
    row = []; touched = false;
    if (rows.length > MAX_ROWS + 1) throw new Error('This demo supports up to 10,000 data rows.');
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (state === 'quoted') {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else state = 'closed';
      } else cell += c;
      continue;
    }
    if (c === ',') { touched = true; finishCell(); }
    else if (c === '\r' || c === '\n') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      finishRow();
    } else if (c === '"' && state === 'plain' && cell === '') {
      state = 'quoted'; touched = true;
    } else {
      if (state === 'closed' || c === '"') throw new Error('Malformed CSV: unexpected character next to a quote.');
      cell += c; touched = true;
    }
  }
  if (state === 'quoted') throw new Error('Malformed CSV: a quoted field is not closed.');
  if (touched || row.length || cell) finishRow();
  if (!rows.length) throw new Error('Add a header and at least one data row.');
  const headers = rows.shift().map(h => h.trim());
  if (headers.some(h => !h)) throw new Error('Each column needs a nonempty header.');
  if (new Set(headers).size !== headers.length) throw new Error('Column headers must be unique after trimming.');
  rows.forEach((r, i) => { if (r.length !== headers.length) throw new Error(`Record ${i + 2} has ${r.length} fields; expected ${headers.length}.`); });
  if (!rows.length) throw new Error('The CSV has a header but no data rows.');
  return { headers, rows };
}

export function decimal(value) {
  const s = value.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)) return null;
  const negative = s.startsWith('-');
  const [whole = '0', fraction = ''] = s.replace(/^[+-]/, '').split('.');
  if (whole.length + fraction.length > 100 || fraction.length > 20) return null;
  return { units: BigInt((whole || '0') + fraction) * (negative ? -1n : 1n), scale: fraction.length };
}

export function total(values) {
  const parsed = values.map(decimal);
  const valid = parsed.filter(v => v !== null);
  const scale = valid.reduce((s, v) => Math.max(s, v.scale), 0);
  const sum = valid.reduce((s, v) => s + v.units * (10n ** BigInt(scale - v.scale)), 0n);
  const negative = sum < 0n;
  const digits = (negative ? -sum : sum).toString().padStart(scale + 1, '0');
  const formatted = (negative ? '-' : '') + (scale ? digits.slice(0, -scale) + '.' + digits.slice(-scale) : digits);
  return { value: valid.length ? formatted : null, valid: valid.length, excluded: parsed.length - valid.length };
}

export function analyze(input, { trim = true, dropDuplicates = false, numericColumn = '' } = {}) {
  const { headers, rows } = parseCSV(input);
  const cleaned = [], issues = [], seen = new Map();
  let trimmedCells = 0, duplicateRows = 0;
  const numericIndex = numericColumn ? headers.indexOf(numericColumn) : -1;
  if (numericColumn && numericIndex < 0) throw new Error('Choose a numeric column that exists in the CSV.');
  rows.forEach((raw, i) => {
    const record = i + 2;
    const normalized = raw.map((v, j) => {
      const next = trim ? v.trim() : v;
      if (next !== v) { trimmedCells++; issues.push({ record, column: headers[j], type: 'trimmed', detail: 'Leading/trailing whitespace removed.' }); }
      if (next.trim() === '') issues.push({ record, column: headers[j], type: 'missing', detail: 'Blank cell preserved; no value inferred.' });
      return next;
    });
    const key = JSON.stringify(normalized);
    const first = seen.get(key);
    const duplicate = first !== undefined;
    if (duplicate) {
      duplicateRows++;
      issues.push({ record, column: '(entire row)', type: dropDuplicates ? 'duplicate removed' : 'duplicate flagged', detail: `Matches record ${first} after the selected whitespace rule.` });
    } else seen.set(key, record);
    if (numericIndex >= 0 && normalized[numericIndex].trim() !== '' && decimal(normalized[numericIndex]) === null) {
      issues.push({ record, column: numericColumn, type: 'invalid number', detail: 'Preserved for review. Use a dot decimal without currency, grouping separators or exponents.' });
    }
    if (!duplicate || !dropDuplicates) cleaned.push(normalized);
  });
  const before = numericIndex < 0 ? null : total(rows.map(r => r[numericIndex]));
  const after = numericIndex < 0 ? null : total(cleaned.map(r => r[numericIndex]));
  return { headers, rows: cleaned, issues, stats: { inputRows: rows.length, outputRows: cleaned.length, duplicateRows, removedRows: rows.length - cleaned.length, trimmedCells, numericColumn, before, after }, rules: { trim, dropDuplicates, missingValues: 'preserved', numericFormat: 'signed dot decimal, no currency or grouping, up to 20 decimal places', recordNumbers: 'logical CSV records including header; blank physical lines skipped' } };
}

export function safeCell(value) {
  const s = String(value);
  // Guard text against spreadsheet formula execution; retain strict numeric cells.
  return decimal(s) === null && /^[\s]*[=+\-@\t\r]/.test(s) ? "'" + s : s;
}
export function serializeCSV(rows, { spreadsheetSafe = true } = {}) {
  return rows.map(row => row.map(v => {
    const s = spreadsheetSafe ? safeCell(v) : String(v);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\r\n') + '\r\n';
}
export function exportReport(result) {
  const changed = [result.headers, ...result.rows].flatMap((r, i) => r.flatMap((v, j) => safeCell(v) !== v ? [{ exportRecord: i + 1, column: result.headers[j], type: 'export formula guard', detail: 'An apostrophe is prepended to spreadsheet formula-like text in the CSV export.' }] : []));
  return { ...result, exportProtection: { spreadsheetSafe: true, modifiedCells: changed.length, changes: changed } };
}
