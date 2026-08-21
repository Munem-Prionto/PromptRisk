// PRBN.adapters — owns ALL site/DOM specifics. If a site's DOM changes, this is the only file to touch.
(function (root) {
  'use strict';

  var SITE_ADAPTERS = [
    {
      host: 'claude.ai',
      name: 'Claude',
      accent: '#CC785C',
      composerSelectors: ['div[contenteditable="true"]'],
      sendButtonSelectors: ['button[aria-label*="Send" i]']
    },
    {
      host: 'chatgpt.com',
      name: 'ChatGPT',
      accent: '#10A37F',
      composerSelectors: ['#prompt-textarea', 'div[contenteditable="true"]', 'textarea'],
      sendButtonSelectors: ['button[data-testid="send-button"]', 'button[aria-label*="Send" i]']
    },
    {
      host: 'chat.openai.com',
      name: 'ChatGPT',
      accent: '#10A37F',
      composerSelectors: ['#prompt-textarea', 'div[contenteditable="true"]', 'textarea'],
      sendButtonSelectors: ['button[data-testid="send-button"]', 'button[aria-label*="Send" i]']
    },
    {
      host: 'gemini.google.com',
      name: 'Gemini',
      accent: '#4285F4',
      composerSelectors: ['div[contenteditable="true"]', 'rich-textarea'],
      sendButtonSelectors: ['button[aria-label*="Send" i]']
    }
  ];

  function resolve(hostname) {
    if (!hostname) return null;
    for (var i = 0; i < SITE_ADAPTERS.length; i++) {
      if (hostname === SITE_ADAPTERS[i].host || hostname.endsWith('.' + SITE_ADAPTERS[i].host)) {
        return SITE_ADAPTERS[i];
      }
    }
    return null;
  }

  function isVisible(el) {
    return !!el && el.offsetParent !== null;
  }

  function isEditableEl(el) {
    if (!el) return false;
    var tag = el.tagName;
    return el.isContentEditable || tag === 'TEXTAREA' || tag === 'RICH-TEXTAREA';
  }

  function getComposer(adapter) {
    if (!adapter) return null;

    for (var i = 0; i < adapter.composerSelectors.length; i++) {
      var candidates = document.querySelectorAll(adapter.composerSelectors[i]);
      for (var j = 0; j < candidates.length; j++) {
        if (isVisible(candidates[j])) return candidates[j];
      }
    }

    var active = document.activeElement;
    if (isEditableEl(active) && isVisible(active)) return active;

    var main = document.querySelector('main') || document.body;
    var fallback = main.querySelectorAll('[contenteditable="true"], textarea, rich-textarea');
    for (var k = fallback.length - 1; k >= 0; k--) {
      if (isVisible(fallback[k])) return fallback[k];
    }

    return null;
  }

  function getText(el) {
    if (!el) return '';
    if (el.isContentEditable) return el.innerText || '';
    return el.value || '';
  }

  function placeCaretAtEnd(el) {
    try {
      var range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) {
      // best-effort — not fatal if the host page prevents selection manipulation
    }
  }

  function setText(el, text) {
    if (!el) return;
    if (el.isContentEditable) {
      el.textContent = text;
      placeCaretAtEnd(el);
    } else {
      el.value = text;
    }
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function observe(onRebind) {
    var debounced = debounce(onRebind, 300);
    var mo = new MutationObserver(function () { debounced(); });
    mo.observe(document.body, { childList: true, subtree: true });
    return mo;
  }

  root.PRBN = root.PRBN || {};
  root.PRBN.adapters = {
    resolve: resolve,
    getComposer: getComposer,
    getText: getText,
    setText: setText,
    observe: observe
  };
})(window);
