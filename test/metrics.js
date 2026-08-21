// Precision/recall/F1 per category + latency, computed over test/corpus.js.
// Run with: node test/metrics.js
require('../src/patterns.js');
var engine = require('../src/engine.js');
var CORPUS = require('./corpus.js').CORPUS;
var performance = require('perf_hooks').performance;

var CATEGORIES = ['R1', 'R2', 'R3', 'R4', 'R5'];

var stats = {};
CATEGORIES.forEach(function (c) { stats[c] = { tp: 0, fp: 0, fn: 0 }; });

var durations = [];
var exactMatches = 0;

CORPUS.forEach(function (entry) {
  var expected = {};
  entry.expected.forEach(function (c) { expected[c] = true; });

  var t0 = performance.now();
  var result = engine.scan(entry.text);
  durations.push(performance.now() - t0);

  var detected = {};
  result.categories.forEach(function (c) { detected[c.category] = true; });

  var exact = true;
  CATEGORIES.forEach(function (c) {
    var exp = !!expected[c];
    var det = !!detected[c];
    if (exp && det) stats[c].tp++;
    else if (!exp && det) stats[c].fp++;
    else if (exp && !det) stats[c].fn++;
    if (exp !== det) exact = false;
  });
  if (exact) exactMatches++;
});

function pct(n) { return (n * 100).toFixed(1) + '%'; }
function safeDiv(a, b) { return b === 0 ? null : a / b; }

console.log('PromptRisk-BN — detection metrics over ' + CORPUS.length + ' fabricated prompts\n');
console.log(
  'Category'.padEnd(10) + 'TP'.padEnd(6) + 'FP'.padEnd(6) + 'FN'.padEnd(6) +
  'Precision'.padEnd(12) + 'Recall'.padEnd(10) + 'F1'.padEnd(8)
);
console.log('-'.repeat(58));

var macro = { p: 0, r: 0, f1: 0, n: 0 };

CATEGORIES.forEach(function (c) {
  var s = stats[c];
  var precision = safeDiv(s.tp, s.tp + s.fp);
  var recall = safeDiv(s.tp, s.tp + s.fn);
  var f1 = (precision !== null && recall !== null && (precision + recall) > 0)
    ? (2 * precision * recall) / (precision + recall)
    : null;

  if (precision !== null) { macro.p += precision; macro.n++; }
  if (recall !== null) macro.r += recall;
  if (f1 !== null) macro.f1 += f1;

  console.log(
    c.padEnd(10) +
    String(s.tp).padEnd(6) + String(s.fp).padEnd(6) + String(s.fn).padEnd(6) +
    (precision === null ? '-'.padEnd(12) : pct(precision).padEnd(12)) +
    (recall === null ? '-'.padEnd(10) : pct(recall).padEnd(10)) +
    (f1 === null ? '-'.padEnd(8) : pct(f1).padEnd(8))
  );
});

console.log('-'.repeat(58));
console.log(
  'Macro avg'.padEnd(10) + ''.padEnd(18) +
  pct(macro.p / CATEGORIES.length).padEnd(12) +
  pct(macro.r / CATEGORIES.length).padEnd(10) +
  pct(macro.f1 / CATEGORIES.length).padEnd(8)
);

console.log('\nExact category-set match: ' + exactMatches + '/' + CORPUS.length +
  ' (' + pct(exactMatches / CORPUS.length) + ')');

durations.sort(function (a, b) { return a - b; });
var sum = durations.reduce(function (a, b) { return a + b; }, 0);
var avg = sum / durations.length;
var max = durations[durations.length - 1];
var p95 = durations[Math.floor(durations.length * 0.95)];

console.log('\nLatency over ' + durations.length + ' scans (target < 50ms):');
console.log('  avg: ' + avg.toFixed(3) + 'ms   p95: ' + p95.toFixed(3) + 'ms   max: ' + max.toFixed(3) + 'ms');
