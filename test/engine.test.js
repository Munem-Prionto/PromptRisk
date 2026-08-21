// Node test for PRBN.engine — run with: node test/engine.test.js
require('../src/patterns.js');
var engine = require('../src/engine.js');

var failures = 0;
var passed = 0;

function hasCategory(matches, category, severity) {
  return matches.some(function (m) {
    return m.category === category && (!severity || m.severity === severity);
  });
}

function assert(cond, msg) {
  if (cond) {
    passed++;
  } else {
    failures++;
    console.error('FAIL: ' + msg);
  }
}

function run(name, text, mustDetect, mustNot) {
  var result = engine.scan(text);
  var cats = result.matches.map(function (m) {
    return m.category + '/' + m.severity + (m.id === 'card' ? ':card' : '');
  });

  mustDetect.forEach(function (check) {
    assert(check(result), name + ': expected to detect ' + JSON.stringify(cats));
  });
  mustNot.forEach(function (check) {
    assert(!check(result), name + ': expected NOT to detect ' + JSON.stringify(cats));
  });
}

// #1
run(
  '#1 bkash phone -> financial',
  'amar bkash 01712345678 e taka pathao',
  [function (r) { return hasCategory(r.matches, 'R3', 'high'); }],
  [function (r) { return r.matches.some(function (m) { return m.category === 'R2' && m.id === 'bd_phone'; }); }]
);

// #2
run(
  '#2 NID + phone, no card',
  'My name is Rahim, NID 1990123456789, phone 01812345678, write my CV',
  [
    function (r) { return hasCategory(r.matches, 'R1', 'high'); },
    function (r) { return hasCategory(r.matches, 'R2', 'medium'); }
  ],
  [function (r) { return r.matches.some(function (m) { return m.id === 'card'; }); }]
);

// #3
run(
  '#3 openai key',
  "fix: const apiKey='sk-proj-abc123DEF456ghi789jkl012'",
  [function (r) { return hasCategory(r.matches, 'R4', 'high'); }],
  []
);

// #4
run(
  '#4 clean text',
  'write a poem about the monsoon in Dhaka',
  [function (r) { return r.matches.length === 0 && r.topSeverity === null; }],
  []
);

// #5
run(
  '#5 valid card (luhn passes)',
  'card 4111 1111 1111 1111',
  [function (r) { return r.matches.some(function (m) { return m.id === 'card' && m.category === 'R3' && m.severity === 'high'; }); }],
  []
);

// #6
run(
  '#6 13-digit number, no identity keyword, luhn fails',
  'order number 1234567890123',
  [function (r) { return r.matches.length === 0; }],
  [
    function (r) { return hasCategory(r.matches, 'R1'); },
    function (r) { return r.matches.some(function (m) { return m.id === 'card'; }); }
  ]
);

// #7
run(
  '#7 email',
  'reach me at rahim@example.com',
  [function (r) { return hasCategory(r.matches, 'R2', 'medium') && r.matches.some(function (m) { return m.id === 'email'; }); }],
  []
);

// #8
run(
  '#8 spaced nid/phone via normalization',
  'nid 0 1 7 1 2 3 4 5 6 7 8',
  [function (r) { return (hasCategory(r.matches, 'R2') || hasCategory(r.matches, 'R1')) && r.matches.some(function (m) { return m.viaNormalization; }); }],
  []
);

// #9
run(
  '#9 db connection string',
  'db: postgres://user:pass@host:5432/db',
  [function (r) { return r.matches.some(function (m) { return m.id === 'conn' && m.category === 'R4' && m.severity === 'high'; }); }],
  []
);

// #10
run(
  '#10 private key block',
  '-----BEGIN RSA PRIVATE KEY-----',
  [function (r) { return r.matches.some(function (m) { return m.id === 'privkey' && m.category === 'R4' && m.severity === 'high'; }); }],
  []
);

console.log('\n' + passed + ' passed, ' + failures + ' failed');
process.exit(failures ? 1 : 0);
