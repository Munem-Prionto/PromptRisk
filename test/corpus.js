// Fabricated evaluation corpus (English + Banglish), ~300 prompts tagged with
// the categories they truly contain (empty array = clean negative).
// Generated deterministically from templates so the corpus is reproducible.
'use strict';

var NAMES = ['Rahim', 'Karim', 'Fatima', 'Ayesha', 'Tanvir', 'Nusrat', 'Shakib', 'Mim',
  'Arif', 'Priya', 'Sabbir', 'Rafiq', 'Mitu', 'Jahid', 'Lima'];
var CITIES = ['Dhaka', 'Chittagong', 'Sylhet', 'Khulna', 'Rajshahi', 'Barisal', 'Rangpur', 'Comilla'];

function lcgNext(x) {
  return (x * 9301 + 49297) % 233280;
}

function seqDigits(seed, len) {
  var x = seed;
  var s = '';
  for (var i = 0; i < len; i++) {
    x = lcgNext(x);
    s += String(Math.floor((x / 233280) * 10) % 10);
  }
  return s;
}

var TOKEN_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function randToken(seed, len, alphabet) {
  var chars = alphabet || TOKEN_CHARS;
  var x = seed;
  var s = '';
  for (var i = 0; i < len; i++) {
    x = lcgNext(x);
    s += chars[Math.floor((x / 233280) * chars.length) % chars.length];
  }
  return s;
}

function luhnValidLocal(digits) {
  var sum = 0;
  var alt = false;
  for (var i = digits.length - 1; i >= 0; i--) {
    var n = digits.charCodeAt(i) - 48;
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function luhnCheckDigit(payload) {
  var sum = 0;
  var alt = true; // rightmost payload digit is doubled (it sits next to the check digit)
  for (var i = payload.length - 1; i >= 0; i--) {
    var n = payload.charCodeAt(i) - 48;
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return String((10 - (sum % 10)) % 10);
}

function forceLuhnFail(digits) {
  if (!luhnValidLocal(digits)) return digits;
  var last = digits.charCodeAt(digits.length - 1) - 48;
  var next = (last + 1) % 10;
  return digits.slice(0, -1) + String(next);
}

function groupDigits(digits) {
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

// ---- R1 Identity ----

function nidEntries() {
  var out = [];
  var lens = [10, 13, 17];
  for (var i = 0; i < 30; i++) {
    var name = NAMES[i % NAMES.length];
    var city = CITIES[i % CITIES.length];
    var len = lens[i % lens.length];
    var digits = forceLuhnFail(seqDigits(1000 + i, len));
    var text = (i % 2 === 0)
      ? ('amar naam ' + name + ', NID number ' + digits + ', ami ' + city + ' e thaki.')
      : ('My name is ' + name + ', NID ' + digits + ', currently living in ' + city + '.');
    out.push({ text: text, expected: ['R1'] });
  }
  return out;
}

function tinEntries() {
  var out = [];
  for (var i = 0; i < 15; i++) {
    var name = NAMES[i % NAMES.length];
    var digits = seqDigits(2000 + i, 12);
    var text = (i % 2 === 0)
      ? (name + ' er e-TIN holo ' + digits + ', invoice ta pathai dilam.')
      : ('Please find my e-TIN ' + digits + ' attached for the tax filing, ' + name + '.');
    out.push({ text: text, expected: ['R1'] });
  }
  return out;
}

function passportEntries() {
  var out = [];
  var letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (var i = 0; i < 15; i++) {
    var name = NAMES[i % NAMES.length];
    var letter = letters[i % letters.length];
    var digits = seqDigits(3000 + i, 8);
    var num = letter + digits;
    var text = (i % 2 === 0)
      ? ('amar passport number ' + num + ', visa er jonno lagbe, ' + name + '.')
      : (name + ', please verify passport ' + num + ' before booking the flight.');
    out.push({ text: text, expected: ['R1'] });
  }
  return out;
}

// ---- R2 Contact ----

function phoneEntries() {
  var out = [];
  for (var i = 0; i < 25; i++) {
    var name = NAMES[i % NAMES.length];
    var prefix = i % 2 === 0 ? '+880' : '0';
    var mid = String(3 + (i % 7));
    var rest = seqDigits(4000 + i, 8);
    var phone = prefix + '1' + mid + rest;
    var text = (i % 2 === 0)
      ? (name + ', amake ei number e call koro: ' + phone)
      : ('You can reach ' + name + ' at ' + phone + ' anytime after 6pm.');
    out.push({ text: text, expected: ['R2'] });
  }
  return out;
}

function emailEntries() {
  var out = [];
  var domains = ['example.com', 'mail.com', 'gmail.com', 'outlook.com'];
  for (var i = 0; i < 25; i++) {
    var name = NAMES[i % NAMES.length];
    var handle = name.toLowerCase() + i;
    var domain = domains[i % domains.length];
    var email = handle + '@' + domain;
    var text = (i % 2 === 0)
      ? ('Please email the report to ' + email + ' by tonight.')
      : (name + ' er email holo ' + email + ', okhane pathiye dio.');
    out.push({ text: text, expected: ['R2'] });
  }
  return out;
}

// ---- R3 Financial ----

function financialPhoneEntries() {
  var out = [];
  var svc = ['bkash', 'nagad', 'rocket'];
  for (var i = 0; i < 25; i++) {
    var name = NAMES[i % NAMES.length];
    var service = svc[i % svc.length];
    var prefix = i % 2 === 0 ? '+880' : '0';
    var mid = String(3 + (i % 7));
    var rest = seqDigits(5000 + i, 8);
    var phone = prefix + '1' + mid + rest;
    var text = (i % 2 === 0)
      ? ('amar ' + service + ' number ' + phone + ' e taka pathiye dio, ' + name + '.')
      : (name + ', send money via ' + service + ' to ' + phone + ' today.');
    out.push({ text: text, expected: ['R3'] });
  }
  return out;
}

function cardEntries() {
  var out = [];
  for (var i = 0; i < 25; i++) {
    var name = NAMES[i % NAMES.length];
    var len = (i % 5 === 0) ? 15 : 16;
    var payload = seqDigits(6000 + i, len - 1);
    var check = luhnCheckDigit(payload);
    var full = payload + check;
    var grouped = groupDigits(full).trim();
    var text = (i % 2 === 0)
      ? ('Please charge card ' + grouped + ' for the order, ' + name + '.')
      : (name + ' er card number holo ' + grouped + ', eta use korte paro.');
    out.push({ text: text, expected: ['R3'] });
  }
  return out;
}

// ---- R4 Credentials/secrets ----

function openaiEntries() {
  var out = [];
  for (var i = 0; i < 8; i++) {
    var proj = i % 2 === 0 ? 'proj-' : '';
    var token = 'sk-' + proj + randToken(7000 + i, 24);
    var text = (i % 2 === 0)
      ? ('fix: const apiKey = "' + token + '"; // temp for local testing')
      : ('Here is my OpenAI key ' + token + ', please rotate it after use.');
    out.push({ text: text, expected: ['R4'] });
  }
  return out;
}

function awsEntries() {
  var out = [];
  var alnumUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (var i = 0; i < 8; i++) {
    var key = 'AKIA' + randToken(7100 + i, 16, alnumUpper);
    var text = (i % 2 === 0)
      ? ('deploy script has AWS_ACCESS_KEY_ID=' + key + ' hardcoded, please fix.')
      : ('amar AWS key ' + key + ' accidentally leaked in the commit.');
    out.push({ text: text, expected: ['R4'] });
  }
  return out;
}

function googleEntries() {
  var out = [];
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  for (var i = 0; i < 8; i++) {
    var key = 'AIza' + randToken(7200 + i, 35, chars);
    var text = (i % 2 === 0)
      ? ('Google Maps key: ' + key + ' — add it to the .env file.')
      : ('ei Google API key ta use koro: ' + key);
    out.push({ text: text, expected: ['R4'] });
  }
  return out;
}

function githubEntries() {
  var out = [];
  for (var i = 0; i < 8; i++) {
    var token = i % 2 === 0
      ? ('ghp_' + randToken(7300 + i, 36))
      : ('github_pat_' + randToken(7300 + i, 24));
    var text = (i % 2 === 0)
      ? ('use this token to clone the private repo: ' + token)
      : ('amar github token ' + token + ' diye push korte paro.');
    out.push({ text: text, expected: ['R4'] });
  }
  return out;
}

function slackEntries() {
  var out = [];
  var kinds = ['b', 'a', 'p', 'r', 's'];
  for (var i = 0; i < 8; i++) {
    var token = 'xox' + kinds[i % kinds.length] + '-' + randToken(7400 + i, 20);
    var text = (i % 2 === 0)
      ? ('Slack webhook token leaked: ' + token)
      : ('bot config e ei slack token ta ache: ' + token);
    out.push({ text: text, expected: ['R4'] });
  }
  return out;
}

function jwtEntries() {
  var out = [];
  for (var i = 0; i < 8; i++) {
    var jwt = 'eyJ' + randToken(7500 + i, 20) + '.eyJ' + randToken(7550 + i, 24) + '.' + randToken(7580 + i, 30);
    var text = (i % 2 === 0)
      ? ('auth failed, here is the session JWT: ' + jwt)
      : ('ei token diye login test koro: ' + jwt);
    out.push({ text: text, expected: ['R4'] });
  }
  return out;
}

function privkeyEntries() {
  var out = [];
  var kinds = ['RSA ', 'EC ', 'OPENSSH ', ''];
  for (var i = 0; i < 6; i++) {
    var header = '-----BEGIN ' + kinds[i % kinds.length] + 'PRIVATE KEY-----';
    var text = (i % 2 === 0)
      ? ('here is the deploy key:\n' + header + '\nMIIBVwIBADANBgkqhkiG9w0BAQ...\n-----END PRIVATE KEY-----')
      : (header + '\nvai eta server e upload korte hobe.');
    out.push({ text: text, expected: ['R4'] });
  }
  return out;
}

function connEntries() {
  var out = [];
  var schemes = ['mongodb', 'postgres', 'postgresql', 'mysql', 'redis'];
  for (var i = 0; i < 6; i++) {
    var scheme = schemes[i % schemes.length];
    var conn = scheme + '://user' + i + ':pass' + i + '@db-host-' + i + '.internal:5432/appdb';
    var text = (i % 2 === 0)
      ? ('db connection string: ' + conn)
      : ('ei connection string diye local e test koro: ' + conn);
    out.push({ text: text, expected: ['R4'] });
  }
  return out;
}

function credAssignEntries() {
  var out = [];
  var forms = ['password', 'passwd', 'pwd', 'secret', 'api_key', 'token'];
  for (var i = 0; i < 8; i++) {
    var form = forms[i % forms.length];
    var value = randToken(7600 + i, 12);
    var sep = i % 2 === 0 ? ': ' : '=';
    var text = (i % 2 === 0)
      ? ('config file has ' + form + sep + value + ' committed by mistake.')
      : (form + sep + value + ' — eta change korte hobe production e.');
    out.push({ text: text, expected: ['R4'] });
  }
  return out;
}

// ---- R5 Network/technical ----

function ipEntries() {
  var out = [];
  for (var i = 0; i < 25; i++) {
    var name = NAMES[i % NAMES.length];
    var ip = [10 + (i % 200), (i * 7) % 256, (i * 13) % 256, 1 + (i % 254)].join('.');
    var text = (i % 2 === 0)
      ? ('Our staging server IP is ' + ip + ', ssh into it directly.')
      : (name + ' bolche server ip ' + ip + ' e connect korte, VPN off rekho.');
    out.push({ text: text, expected: ['R5'] });
  }
  return out;
}

// ---- Combined / mixed-category prompts ----

function combinedEntries() {
  var out = [];

  out.push({
    text: 'My name is Rahim, NID 1990123456789, phone 01812345678, write my CV',
    expected: ['R1', 'R2']
  });
  out.push({
    text: 'amar bkash 01712345678 e taka pathao, r amar email ta hocche rahim@example.com',
    expected: ['R3', 'R2']
  });
  out.push({
    text: 'server ip 192.168.10.20 te ei api key die login koro: sk-proj-' + randToken(8000, 24),
    expected: ['R5', 'R4']
  });
  out.push({
    text: 'db: postgres://user:pass@host:5432/db, also here is my AWS key AKIA' + randToken(8010, 16, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
    expected: ['R4']
  });
  out.push({
    text: 'NID 4562111234567890, passport A' + seqDigits(8020, 8) + ', amar naam Karim',
    expected: ['R1']
  });
  out.push({
    text: 'call me at 01912345678 or email karim@mail.com about the invoice',
    expected: ['R2']
  });
  out.push({
    text: 'nagad account no 01712345000, card 4539 1488 0343 6467 dorkar hole use koro',
    expected: ['R3']
  });
  out.push({
    text: 'password: Sup3rSecret! and the server ip is 10.0.0.5, be careful',
    expected: ['R4', 'R5']
  });
  out.push({
    text: 'my e-TIN is 123456789012 and my passport number is B' + seqDigits(8030, 8),
    expected: ['R1']
  });
  out.push({
    text: 'ghp_' + randToken(8040, 36) + ' token diye repo clone koro, r amar bkash 01612345678',
    expected: ['R4', 'R3']
  });
  out.push({
    text: 'jonmo nibondhon 1990123456789012345, phone +8801512345678',
    expected: ['R1', 'R2']
  });
  out.push({
    text: 'voter id 1234567890, reach me at voter-help@example.com',
    expected: ['R1', 'R2']
  });
  out.push({
    text: 'ei jwt token ta expired: eyJ' + randToken(8050, 20) + '.eyJ' + randToken(8060, 24) + '.' + randToken(8070, 30) + ', ar amar nid 1990123456789',
    expected: ['R4', 'R1']
  });
  out.push({
    text: 'redis://cache:6379/0 use koro, r bank account no bolo pore, ip 8.8.8.8 theke test korchi',
    expected: ['R4', 'R5']
  });
  out.push({
    text: 'amake ei number e cash out korte bolo: 01812340000, r email confirm korbe test@example.com',
    expected: ['R3', 'R2']
  });

  return out;
}

// ---- Clean negatives ----

function cleanEntries() {
  var texts = [
    'write a poem about the monsoon in Dhaka',
    'shonar bangla amar, ei desh amar khub priyo',
    'can you help me plan a weekend trip to Sylhet?',
    'what is the best way to learn recursion in JavaScript?',
    'ajke khub gorom porechhe, ekta thanda lassi khete mon chaise',
    'summarize the plot of the novel we discussed yesterday',
    'recipe for fish curry: mustard oil, turmeric, and fresh coriander',
    'give me three ideas for a birthday gift for my sister',
    'explain how photosynthesis works in simple terms',
    'kal college e exam ache, porashona shesh hoy nai',
    'what are the differences between TCP and UDP at a high level?',
    'write a short story about a fisherman on the Padma river',
    'help me debug why my for loop never terminates',
    'what is the capital of Bangladesh and its population trend?',
    'suggest a workout routine for beginners',
    'ajke barite biryani rannar plan ache, moshla thik ache kina dekho',
    'compare the pros and cons of remote work versus office work',
    'draft a polite message asking my professor for an extension',
    'what books would you recommend for learning history of Bengal?',
    'ekta valo movie recommend koro weekend er jonno',
    'explain the difference between a stack and a queue',
    'how do I convert a list to a set in Python?',
    'write a haiku about the first rain of the season',
    'give me a checklist for packing for a hiking trip',
    'ki khabo ajke dupure eta niye confusion hocche',
    'summarize the key ideas of the OWASP Top 10 for a beginner',
    'help me brainstorm names for a new coffee shop',
    'what is the time complexity of quicksort in the average case?',
    'kotha bolte bolte shomoy khub taratari chole jai',
    'explain how a hash table resolves collisions',
    'write a motivational quote about perseverance',
    'ekhon office jete hobe, rasta te khub jam thake shokal e',
    'what are some good practices for writing clean commit messages?',
    'describe the water cycle for a school project',
    'ei weekend e kothao ghurte jete mon chaise, kono suggestion?',
    'explain the concept of closures in JavaScript with an example',
    'what is the difference between supervised and unsupervised learning?',
    'lekha ta arektu ghuriye likhle bhalo hoy, ki mone hoy tomar?',
    'give me a simple explanation of how DNS resolution works',
    'write a short bedtime story about a curious cat',
    'ajke ambulance er shiren shune bhoy peye gelam',
    'what are the main themes in the poem we read in class?',
    'help me plan a study schedule for the next two weeks',
    'ki diye biriyani ranna korle shob theke bhalo lagbe',
    'explain the difference between var, let, and const in JavaScript'
  ];
  return texts.map(function (t) { return { text: t, expected: [] }; });
}

var CORPUS = []
  .concat(nidEntries())
  .concat(tinEntries())
  .concat(passportEntries())
  .concat(phoneEntries())
  .concat(emailEntries())
  .concat(financialPhoneEntries())
  .concat(cardEntries())
  .concat(openaiEntries())
  .concat(awsEntries())
  .concat(googleEntries())
  .concat(githubEntries())
  .concat(slackEntries())
  .concat(jwtEntries())
  .concat(privkeyEntries())
  .concat(connEntries())
  .concat(credAssignEntries())
  .concat(ipEntries())
  .concat(combinedEntries())
  .concat(cleanEntries())
  .map(function (entry, i) {
    return { id: i + 1, text: entry.text, expected: entry.expected };
  });

module.exports = { CORPUS: CORPUS };
