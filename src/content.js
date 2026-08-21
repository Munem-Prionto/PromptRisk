// PRBN content script — the only orchestrator. Wires adapters -> engine -> ui.
// Never logs prompt text.
(function () {
  'use strict';

  var PRBN = window.PRBN;
  var engine = PRBN.engine;
  var adapters = PRBN.adapters;
  var ui = PRBN.ui;
  var COPY = ui.COPY;

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

  var settings = null;
  var adapter = null;
  var composer = null;
  var lastResult = { matches: [], categories: [], topSeverity: null, score: 0 };
  var sendArmed = false;
  var sendArmTimer = null;
  var composerInputHandler = null;
  var composerKeydownHandler = null;

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function run() {
    if (!composer) return;
    var text = adapters.getText(composer);
    lastResult = engine.scan(text, settings);
    lastResult.empty = !text.trim();
    lastResult.showClean = settings.showCleanState;
    ui.update(lastResult);
  }

  var debouncedRun = debounce(run, 150);

  function handleRedact() {
    if (!composer) return;
    var text = adapters.getText(composer);
    var n = lastResult.matches.length;
    var redacted = engine.redact(text, lastResult.matches);
    adapters.setText(composer, redacted);
    run();
    ui.onSendPolicyNote(COPY.REDACT_DONE(n));
  }

  function armSendBlock() {
    sendArmed = true;
    clearTimeout(sendArmTimer);
    sendArmTimer = setTimeout(function () { sendArmed = false; }, 8000);
  }

  function guardSend(e) {
    if (!settings.blockOnHigh) return;
    if (lastResult && lastResult.topSeverity === 'high' && !sendArmed) {
      e.preventDefault();
      e.stopPropagation();
      ui.onSendPolicyNote(COPY.SEND_BLOCK);
      armSendBlock();
    }
  }

  function installComposerKeyGuard(el) {
    composerKeydownHandler = function (e) {
      if (e.key === 'Enter' && !e.shiftKey) guardSend(e);
    };
    el.addEventListener('keydown', composerKeydownHandler, true);
  }

  function installSendButtonGuard() {
    document.addEventListener('click', function (e) {
      if (!adapter) return;
      for (var i = 0; i < adapter.sendButtonSelectors.length; i++) {
        if (e.target && e.target.closest && e.target.closest(adapter.sendButtonSelectors[i])) {
          guardSend(e);
          return;
        }
      }
    }, true);
  }

  function bind() {
    composer = adapters.getComposer(adapter);
    if (!composer) return;

    ui.mount(composer);
    ui.onRedact(handleRedact);

    composerInputHandler = debouncedRun;
    composer.addEventListener('input', composerInputHandler);
    installComposerKeyGuard(composer);

    run();
  }

  function rebind() {
    if (!adapter) return;
    var candidate = adapters.getComposer(adapter);
    if (!candidate || candidate === composer) return;
    ui.destroy();
    composer = null;
    bind();
  }

  function applyStorageChanges(changes) {
    Object.keys(changes).forEach(function (key) {
      settings[key] = changes[key].newValue;
    });
    if (composer) run();
  }

  function init() {
    chrome.storage.sync.get(DEFAULTS, function (loaded) {
      settings = loaded;

      var host = location.hostname;
      if (!settings.sitesEnabled[host]) return;

      adapter = adapters.resolve(host);
      if (!adapter) return;

      installSendButtonGuard();
      bind();
      adapters.observe(rebind);

      chrome.storage.onChanged.addListener(function (changes, area) {
        if (area === 'sync') applyStorageChanges(changes);
      });
    });
  }

  init();
})();
