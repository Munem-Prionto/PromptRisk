// PRBN.PATTERNS / PRBN.KEYWORDS — the detection ruleset (data, not code).
// Adding a detector = one array entry. No pattern logic lives here.
(function (root) {
  'use strict';

  var KEYWORDS = {
    identity: /\b(nid|national\s?id|voter|jonmo\s?nibondhon|passport|tin|e-?tin)\b/i,
    financial: /\b(bkash|nagad|rocket|send\s?money|cash\s?out|account\s?no|bank)\b/i
  };

  var PATTERNS = [
    {
      id: 'bd_phone',
      label: 'Bangladeshi phone',
      category: 'R2',
      severity: 'medium',
      regex: '(?:\\+?880|0)1[3-9]\\d{8}',
      flags: 'g'
    },
    {
      id: 'bd_nid',
      label: 'NID number',
      category: 'R1',
      severity: 'high',
      regex: '\\b(?:\\d{10}|\\d{13}|\\d{17})\\b',
      flags: 'g',
      requiresKeyword: 'identity'
    },
    {
      id: 'bd_tin',
      label: 'e-TIN',
      category: 'R1',
      severity: 'high',
      regex: '\\b\\d{12}\\b',
      flags: 'g',
      requiresKeyword: 'identity'
    },
    {
      id: 'bd_passport',
      label: 'Passport',
      category: 'R1',
      severity: 'high',
      regex: '\\b[A-Z]\\d{8}\\b',
      flags: 'g',
      requiresKeyword: 'identity'
    },
    {
      id: 'email',
      label: 'Email address',
      category: 'R2',
      severity: 'medium',
      regex: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b',
      flags: 'g'
    },
    {
      id: 'card',
      label: 'Card number',
      category: 'R3',
      severity: 'high',
      regex: '\\b(?:\\d[ -]?){13,19}\\b',
      flags: 'g',
      luhn: true
    },
    {
      id: 'ipv4',
      label: 'IP address',
      category: 'R5',
      severity: 'medium',
      regex: '\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b',
      flags: 'g'
    },
    {
      id: 'key_openai',
      label: 'OpenAI key',
      category: 'R4',
      severity: 'high',
      regex: '\\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\\b',
      flags: 'g'
    },
    {
      id: 'key_aws',
      label: 'AWS access key',
      category: 'R4',
      severity: 'high',
      regex: '\\bAKIA[0-9A-Z]{16}\\b',
      flags: 'g'
    },
    {
      id: 'key_google',
      label: 'Google API key',
      category: 'R4',
      severity: 'high',
      regex: '\\bAIza[0-9A-Za-z\\-_]{35}\\b',
      flags: 'g'
    },
    {
      id: 'key_github',
      label: 'GitHub token',
      category: 'R4',
      severity: 'high',
      regex: '\\bghp_[A-Za-z0-9]{36}\\b|\\bgithub_pat_[A-Za-z0-9_]{22,}\\b',
      flags: 'g'
    },
    {
      id: 'key_slack',
      label: 'Slack token',
      category: 'R4',
      severity: 'high',
      regex: '\\bxox[baprs]-[A-Za-z0-9-]{10,}\\b',
      flags: 'g'
    },
    {
      id: 'jwt',
      label: 'JWT',
      category: 'R4',
      severity: 'high',
      regex: '\\beyJ[A-Za-z0-9_-]+\\.eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\b',
      flags: 'g'
    },
    {
      id: 'privkey',
      label: 'Private key block',
      category: 'R4',
      severity: 'high',
      regex: '-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
      flags: 'g'
    },
    {
      id: 'conn',
      label: 'DB connection string',
      category: 'R4',
      severity: 'high',
      regex: '\\b(?:mongodb|postgres(?:ql)?|mysql|redis):\\/\\/\\S+',
      flags: 'gi'
    },
    {
      id: 'cred_assign',
      label: 'Password/secret assignment',
      category: 'R4',
      severity: 'high',
      regex: '\\b(?:password|passwd|pwd|secret|api[_-]?key|token)\\s*[:=]\\s*\\S{4,}',
      flags: 'gi'
    }
  ];

  var PRBN = root.PRBN || (root.PRBN = {});
  PRBN.PATTERNS = PATTERNS;
  PRBN.KEYWORDS = KEYWORDS;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PATTERNS: PATTERNS, KEYWORDS: KEYWORDS };
  }
})(typeof window !== 'undefined' ? window : globalThis);
