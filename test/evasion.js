// Evasion table (BUILD_SPEC §8) — runs obfuscated variants through the scanner
// and records which ones bypass detection. Run with: node test/evasion.js
require('../src/patterns.js');
var engine = require('../src/engine.js');

var CASES = [
  {
    technique: 'Spaced digits (NID)',
    target: 'R1',
    text: 'amar nid holo 1 9 9 0 1 2 3 4 5 6 7 8 9',
    note: 'digits separated by single spaces; normalize() collapses them before re-scanning'
  },
  {
    technique: 'Dash-separated digits (phone)',
    target: 'R2',
    text: 'call amake ei number e: 0171-2345-678',
    note: 'dashes inside a BD phone number; normalize() collapses inter-digit dashes'
  },
  {
    technique: 'Homoglyph key prefix',
    target: 'R4',
    text: 'here is my key: ѕk-proj-abc123DEF456ghi789jkl012',
    note: 'Cyrillic ѕ (U+0455) replaces the Latin "s" in "sk-"; regex only matches ASCII'
  },
  {
    technique: 'Base64-wrapped secret',
    target: 'R4',
    text: 'ci: env_secret = "c2stcHJvai1hYmMxMjNERUY0NTZnaGk3ODlqa2wwMTI9"',
    note: 'the literal "sk-" substring never appears once the key is base64-encoded'
  },
  {
    technique: 'Keyword-avoided NID',
    target: 'R1',
    text: 'amar personal number ta 1990123456789 note kore rakho',
    note: 'a real 13-digit NID with no identity keyword nearby — requiresKeyword gate blocks it'
  },
  {
    technique: 'Split across lines (card, with filler)',
    target: 'R3',
    text: 'here is the number\n4111 1111\n// continued below\n1111 1111',
    note: 'a comment line breaks the digit run; normalize() only bridges a single separator char'
  },
  {
    technique: 'Zero-width space in phone',
    target: 'R2',
    text: 'amar number ta: 017​12345678, call me',
    note: 'U+200B is not part of \\s, so neither the raw regex nor normalize() sees through it'
  },
  {
    technique: 'Dot-separated digits (card)',
    target: 'R3',
    text: 'card 4111.1111.1111.1111 for the deposit',
    note: 'periods are outside the card regex\'s inline [ -]? separator, but normalize() covers dots'
  },
  {
    technique: 'Spaced JWT segments',
    target: 'R4',
    text: 'token: eyJhbGciOiJIUzI1NiJ9 . eyJzdWIiOiIxMjM0NTY3ODkwIn0 . abcdef123456',
    note: 'spaces around the dots break the contiguous eyJ...eyJ...  pattern'
  }
];

console.log('PromptRisk-BN — evasion technique results\n');
console.log(
  'Technique'.padEnd(34) + 'Target'.padEnd(8) + 'Detected'.padEnd(18) + 'Bypassed'
);
console.log('-'.repeat(78));

var bypassCount = 0;

CASES.forEach(function (c) {
  var result = engine.scan(c.text);
  var detectedCats = result.categories.map(function (cs) { return cs.category; });
  var bypassed = detectedCats.indexOf(c.target) === -1;
  if (bypassed) bypassCount++;

  console.log(
    c.technique.padEnd(34) +
    c.target.padEnd(8) +
    (detectedCats.join(',') || '(none)').padEnd(18) +
    (bypassed ? 'YES' : 'no')
  );
  console.log('  ' + c.note);
});

console.log('\n' + bypassCount + '/' + CASES.length + ' techniques bypassed detection.');
