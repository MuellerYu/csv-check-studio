import { parseCSV, analyze, serializeCSV, exportReport } from './core.mjs';
const $ = id => document.getElementById(id);
const sample = 'record_id,customer,amount,note\n001, Alder Studio ,120.10,Invoice A\n002,Birch Works,89.90,Invoice B\n002,Birch Works,89.90,Invoice B\n003,Cedar Design,,Missing amount\n004,Dune Labs,24.50,"Review, pending"\n005,Elm Office,$15.00,Ambiguous number\n006,Fern Co,0.10,Small amount\n007,Grove Team,0.20,Small amount';
let result = null;
function dirty() {
  $('exportFallback').hidden = true;
  if (result) { $('stale').hidden = false; $('status').textContent = 'Recheck needed'; }
  $('downloadCSV').disabled = $('downloadReport').disabled = $('showExport').disabled = true;
}
function columns() {
  const selected = $('numeric').value;
  $('numeric').replaceChildren(new Option('No numeric column', ''));
  try { parseCSV($('csv').value).headers.forEach(h => $('numeric').add(new Option(h, h))); } catch { /* Validation is displayed on Run. */ }
  if ([...$('numeric').options].some(o => o.value === selected)) $('numeric').value = selected;
}
function table(target, headers, rows) {
  const element = $(target); element.replaceChildren();
  const head = document.createElement('thead'), hr = document.createElement('tr');
  headers.forEach(h => { const th = document.createElement('th'); th.textContent = h; th.scope = 'col'; hr.append(th); });
  head.append(hr); element.append(head);
  const body = document.createElement('tbody');
  rows.forEach(r => { const tr = document.createElement('tr'); r.forEach(v => { const td = document.createElement('td'); td.textContent = v === '' ? '(blank)' : v; td.title = String(v); tr.append(td); }); body.append(tr); });
  element.append(body);
}
function run() {
  $('exportFallback').hidden = true;
  $('error').hidden = true;
  try {
    result = analyze($('csv').value, { trim: $('trim').checked, dropDuplicates: $('dedup').checked, numericColumn: $('numeric').value });
    $('empty').hidden = true; $('results').hidden = false; $('stale').hidden = true;
    $('status').textContent = 'Checks complete';
    ['inputRows', 'outputRows', 'duplicateRows', 'trimmedCells'].forEach(id => { $(id).textContent = result.stats[id].toLocaleString('en-US'); });
    $('totals').replaceChildren(); $('totals').hidden = !result.stats.before;
    if (result.stats.before) {
      const title = document.createElement('strong'); title.textContent = `Exact decimal totals · ${result.stats.numericColumn}`; $('totals').append(title);
      for (const [label, value] of [['Before', result.stats.before], ['After', result.stats.after]]) {
        const p = document.createElement('p'); p.textContent = `${label}: ${value.value ?? 'no valid values'} · ${value.valid} numeric values, ${value.excluded} blank or invalid excluded${value.excluded ? ' — partial total' : ''}`; $('totals').append(p);
      }
      const note = document.createElement('p'); note.textContent = `${result.stats.removedRows} duplicate rows removed. Totals do not assert currency or business correctness.`; $('totals').append(note);
    }
    table('preview', result.headers, result.rows.slice(0, 8));
    table('issues', ['Record', 'Column', 'Action / issue', 'Explanation'], result.issues.slice(0, 20).map(i => [i.record, i.column, i.type, i.detail]));
    $('issueCount').textContent = `(${result.issues.length} entries)`;
    $('downloadCSV').disabled = $('downloadReport').disabled = $('showExport').disabled = false;
  } catch (error) {
    result = null; $('results').hidden = true; $('empty').hidden = false; $('stale').hidden = true;
    $('status').textContent = 'Check input'; $('error').textContent = error.message; $('error').hidden = false;
    $('downloadCSV').disabled = $('downloadReport').disabled = $('showExport').disabled = true;
  }
}
function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.hidden = true; document.body.append(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}
$('sample').addEventListener('click', () => { $('csv').value = sample; columns(); $('numeric').value = 'amount'; dirty(); });
$('csv').addEventListener('input', dirty);
$('csv').addEventListener('change', columns);
['trim', 'dedup', 'numeric'].forEach(id => $(id).addEventListener('change', dirty));
$('run').addEventListener('click', run);
$('downloadCSV').addEventListener('click', () => { if (result) download('cleaned.csv', serializeCSV([result.headers, ...result.rows]), 'text/csv;charset=utf-8'); });
$('downloadReport').addEventListener('click', () => { if (result) download('cleanup-report.json', JSON.stringify(exportReport(result), null, 2), 'application/json'); });
$('showExport').addEventListener('click', () => { if (result) { $('exportText').value = serializeCSV([result.headers, ...result.rows]); $('exportFallback').hidden = false; } });
$('csv').value = sample; columns(); $('numeric').value = 'amount'; run();
