import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV, analyze, total, serializeCSV, exportReport } from './core.mjs';

test('quoted commas, escaped quotes, embedded CRLF and BOM parse correctly', () => {
  const parsed = parseCSV('\uFEFFname,note\r\n"A, B","said ""yes""\r\nthen left"\r\n');
  assert.deepEqual(parsed.rows, [['A, B', 'said "yes"\r\nthen left']]);
});
test('reject malformed syntax, inconsistent widths and ambiguous headers', () => {
  for (const input of ['a,b\n"x,y', 'a,b\nx"y,z', 'a,b\n"x"z,y', 'a,b\nx', 'a,a \nx,y', ',b\nx,y']) assert.throws(() => parseCSV(input));
});
test('exact decimal arithmetic retains cents beyond Number safe range', () => {
  assert.deepEqual(total(['9007199254740993.01', '0.10', '-0.01']), { value: '9007199254740993.10', valid: 3, excluded: 0 });
  assert.equal(total(['0.1', '0.2']).value, '0.3');
  assert.equal(total(['-.25', '.5']).value, '0.25');
});
test('ambiguous, blank and malformed numeric values are excluded explicitly', () => {
  assert.deepEqual(total(['1,000', '$5', '1e3', '', '2.50']), { value: '2.50', valid: 1, excluded: 4 });
  assert.deepEqual(total(['']), { value: null, valid: 0, excluded: 1 });
});
test('default flags duplicates and preserves conflicts and missing values', () => {
  const r = analyze('id,amount\n 01 ,0.10\n01,0.10\n01,0.20\n02,');
  assert.equal(r.stats.duplicateRows, 1);
  assert.equal(r.stats.outputRows, 4);
  assert.equal(r.stats.trimmedCells, 1);
  assert.equal(r.rows[0][0], '01');
  assert.equal(r.rows[3][1], '');
  assert.equal(r.issues.filter(i => i.type === 'missing').length, 1);
});
test('explicit exact-row dedup recalculates totals and never dedups by ID', () => {
  const r = analyze('id,amount\n01,0.10\n01,0.10\n01,0.20', { dropDuplicates: true, numericColumn: 'amount' });
  assert.equal(r.stats.outputRows, 2);
  assert.equal(r.stats.before.value, '0.40');
  assert.equal(r.stats.after.value, '0.30');
});
test('whitespace preservation changes duplicate semantics as selected', () => {
  assert.equal(analyze('id\n x\nx', { trim: false, dropDuplicates: true }).stats.outputRows, 2);
});
test('formula-safe exports neutralize text but retain signed numbers', () => {
  const csv = serializeCSV([['=HYPERLINK("bad")', ' +cmd', '@SUM(A1)', '-5', '0001', '\t=1+1']]);
  const cells = parseCSV('a,b,c,d,e,f\n' + csv).rows[0];
  assert.deepEqual(cells, ['\'=HYPERLINK("bad")', "' +cmd", "'@SUM(A1)", '-5', '0001', "'\t=1+1"]);
  const report = exportReport(analyze('id,note\n1,=1+1'));
  assert.equal(report.exportProtection.modifiedCells, 1);
  const headerReport = exportReport(analyze('=unsafe,note\n1,okay'));
  assert.equal(headerReport.exportProtection.changes[0].exportRecord, 1);
});
test('safe ordinary CSV exports roundtrip including empty and newline fields', () => {
  const rows = [['id', 'note'], ['001', 'a,b\n"yes"'], ['002', '']];
  assert.deepEqual(parseCSV(serializeCSV(rows)).rows, rows.slice(1));
});
test('demo limits prevent unbounded work and wrong column is rejected', () => {
  assert.throws(() => parseCSV('id\n' + '1\n'.repeat(10001)), /10,000/);
  assert.throws(() => parseCSV('id\n' + 'a'.repeat(2000001)), /2 MB/);
  assert.throws(() => analyze('id\n1', { numericColumn: 'unknown' }), /exists/);
});
