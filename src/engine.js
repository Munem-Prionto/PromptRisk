// PRBN.engine — pure scan/redact/score logic. No DOM access. Unit-testable in Node.
(function (root) {
  'use strict';

  var PRBN = root.PRBN || (root.PRBN = {});
  var PATTERNS = PRBN.PATTERNS;
  var KEYWORDS = PRBN.KEYWORDS;

  var MAX_SCAN_LENGTH = 20000;

  var CATEGORY_LABELS = {
    R1: 'Identity',
    R2: 'Contact',
    R3: 'Financial',
    R4: 'Credentials/secrets',
    R5: 'Network/technical'
  };

  var ALL_CATEGORIES = ['R1', 'R2', 'R3', 'R4', 'R5'];

  function luhn(str) {
    var digits = String(str).replace(/\D/g, '');
    if (!digits) return false;
    var sum = 0;
    var alt = false;
    for (var i = digits.length - 1; i >= 0; i--) {
      var n = digits.charCodeAt(i) - 48;
      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  function normalize(text) {
    return text.replace(/(?<=\d)[\s.-](?=\d)/g, '');
  }

  function severityRank(sev) {
    return sev === 'high' ? 2 : sev === 'medium' ? 1 : 0;
  }

  function findMatches(text, patterns, keywordSourceText, viaNormalization) {
    var out = [];
    for (var pi = 0; pi < patterns.length; pi++) {
      var p = patterns[pi];
      var flags = p.flags.indexOf('g') >= 0 ? p.flags : p.flags + 'g';
      var re;
      try {
        re = new RegExp(p.regex, flags);
      } catch (e) {
        continue;
      }
      var m;
      while ((m = re.exec(text)) !== null) {
        var value = m[0];

        if (p.luhn && !luhn(value)) {
          if (m.index === re.lastIndex) re.lastIndex++;
          continue;
        }
        if (p.requiresKeyword && !KEYWORDS[p.requiresKeyword].test(keywordSourceText)) {
          if (m.index === re.lastIndex) re.lastIndex++;
          continue;
        }

        out.push({
          id: p.id,
          label: p.label,
          category: p.category,
          severity: p.severity,
          value: value,
          index: m.index,
          length: value.length,
          viaNormalization: !!viaNormalization
        });

        if (m.index === re.lastIndex) re.lastIndex++;
      }
    }
    return out;
  }

  function scan(text, settings) {
    if (!text || !text.trim()) {
      return { matches: [], categories: [], topSeverity: null, score: 0 };
    }

    var raw = text.length > MAX_SCAN_LENGTH ? text.slice(0, MAX_SCAN_LENGTH) : text;

    var enabledCategories = (settings && settings.enabledCategories) || ALL_CATEGORIES;
    var activePatterns = PATTERNS.filter(function (p) {
      return enabledCategories.indexOf(p.category) !== -1;
    });

    var rawMatches = findMatches(raw, activePatterns, raw, false);

    var seen = {};
    rawMatches.forEach(function (mt) {
      seen[mt.id + '|' + mt.category + '|' + mt.value] = true;
    });

    var normalizedText = normalize(raw);
    var normMatchesAll = findMatches(normalizedText, activePatterns, raw, true);
    var normMatches = normMatchesAll.filter(function (mt) {
      var key = mt.id + '|' + mt.category + '|' + mt.value;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });

    var matches = rawMatches.concat(normMatches);

    // Financial reclassification: bd_phone -> R3/high when financial keyword present.
    if (KEYWORDS.financial.test(raw)) {
      matches.forEach(function (mt) {
        if (mt.id === 'bd_phone') {
          mt.category = 'R3';
          mt.severity = 'high';
          mt.label = 'Financial (bKash/Nagad)';
        }
      });
    }

    var catMap = {};
    matches.forEach(function (mt) {
      var existing = catMap[mt.category];
      if (!existing) {
        catMap[mt.category] = {
          category: mt.category,
          label: CATEGORY_LABELS[mt.category] || mt.category,
          severity: mt.severity,
          count: 1
        };
      } else {
        existing.count++;
        if (severityRank(mt.severity) > severityRank(existing.severity)) {
          existing.severity = mt.severity;
        }
      }
    });

    var categories = ALL_CATEGORIES
      .filter(function (c) { return catMap[c]; })
      .map(function (c) { return catMap[c]; });

    var topSeverity = null;
    for (var i = 0; i < matches.length; i++) {
      if (matches[i].severity === 'high') { topSeverity = 'high'; break; }
    }
    if (!topSeverity && matches.length) topSeverity = 'medium';

    return {
      matches: matches,
      categories: categories,
      topSeverity: topSeverity,
      score: score(matches)
    };
  }

  function score(matches) {
    var h = 0, m = 0;
    matches.forEach(function (mt) {
      if (mt.severity === 'high') h++;
      else if (mt.severity === 'medium') m++;
    });
    var s = 40 * Math.min(h, 2) + 12 * Math.max(h - 2, 0) +
            15 * Math.min(m, 2) + 5 * Math.max(m - 2, 0);
    return Math.round(Math.min(100, s));
  }

  function redact(text, matches) {
    if (!matches || !matches.length) return text;

    var indexed = matches
      .filter(function (mt) { return !mt.viaNormalization; })
      .sort(function (a, b) { return b.index - a.index; });

    var result = text;
    indexed.forEach(function (mt) {
      result = result.slice(0, mt.index) + '[REDACTED]' + result.slice(mt.index + mt.length);
    });

    var normalized = matches.filter(function (mt) { return mt.viaNormalization; });
    var doneValues = {};
    normalized.forEach(function (mt) {
      if (doneValues[mt.value]) return;
      doneValues[mt.value] = true;
      if (result.indexOf(mt.value) !== -1) {
        result = result.split(mt.value).join('[REDACTED]');
      }
    });

    return result;
  }

  var engine = {
    scan: scan,
    redact: redact,
    score: score,
    normalize: normalize,
    luhn: luhn
  };

  PRBN.engine = engine;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = engine;
  }
})(typeof window !== 'undefined' ? window : globalThis);
