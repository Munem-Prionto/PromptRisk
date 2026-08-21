// PromptRisk-BN settings popup — loads from chrome.storage.sync, writes on change. No other logic.
(function () {
  'use strict';

  var DEFAULTS = {
    enabledCategories: ['R1', 'R2', 'R3', 'R4', 'R5'],
    sitesEnabled: {
      'claude.ai': true,
      'chatgpt.com': true,
      'chat.openai.com': true,
      'gemini.google.com': true
    },
    blockOnHigh: false,
    showCleanState: true
  };

  var CATEGORIES = ['R1', 'R2', 'R3', 'R4', 'R5'];

  var catInputs = CATEGORIES.map(function (c) { return document.getElementById('cat-' + c); });
  var siteClaude = document.getElementById('site-claude');
  var siteChatgpt = document.getElementById('site-chatgpt');
  var siteGemini = document.getElementById('site-gemini');
  var blockOnHigh = document.getElementById('block-on-high');
  var showCleanState = document.getElementById('show-clean-state');

  function saveCategories() {
    var enabled = CATEGORIES.filter(function (c, i) { return catInputs[i].checked; });
    chrome.storage.sync.set({ enabledCategories: enabled });
  }

  function saveSites() {
    chrome.storage.sync.set({
      sitesEnabled: {
        'claude.ai': siteClaude.checked,
        'chatgpt.com': siteChatgpt.checked,
        'chat.openai.com': siteChatgpt.checked,
        'gemini.google.com': siteGemini.checked
      }
    });
  }

  chrome.storage.sync.get(DEFAULTS, function (settings) {
    catInputs.forEach(function (input, i) {
      input.checked = settings.enabledCategories.indexOf(CATEGORIES[i]) !== -1;
      input.addEventListener('change', saveCategories);
    });

    siteClaude.checked = !!settings.sitesEnabled['claude.ai'];
    siteChatgpt.checked = !!(settings.sitesEnabled['chatgpt.com'] && settings.sitesEnabled['chat.openai.com']);
    siteGemini.checked = !!settings.sitesEnabled['gemini.google.com'];
    siteClaude.addEventListener('change', saveSites);
    siteChatgpt.addEventListener('change', saveSites);
    siteGemini.addEventListener('change', saveSites);

    blockOnHigh.checked = !!settings.blockOnHigh;
    blockOnHigh.addEventListener('change', function () {
      chrome.storage.sync.set({ blockOnHigh: blockOnHigh.checked });
    });

    showCleanState.checked = !!settings.showCleanState;
    showCleanState.addEventListener('change', function () {
      chrome.storage.sync.set({ showCleanState: showCleanState.checked });
    });
  });
})();
