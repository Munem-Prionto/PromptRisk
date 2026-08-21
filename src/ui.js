// PRBN.ui — all rendering, isolated inside a Shadow DOM. No detection logic lives here.
(function (root) {
  'use strict';

  var COPY = {
    CLEAN: 'No sensitive data detected',
    HIGH_HEADER: 'Sensitive data detected — review before sending',
    MED_HEADER: 'Possible sensitive data — check before sending',
    REDACT_BTN: 'Redact all',
    REDACT_DONE: function (n) { return 'Replaced ' + n + ' item(s) with [REDACTED]'; },
    LOCAL_BADGE: 'local only · nothing leaves your browser',
    SEND_BLOCK: 'Blocked: high-risk data present. Redact, or press Send again to override.'
  };

  var ICONS = {
    shieldLock: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
      '<path d="M8 1.5l5.5 2v4c0 4-2.4 6.3-5.5 7-3.1-.7-5.5-3-5.5-7v-4l5.5-2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>' +
      '<rect x="5.7" y="7.3" width="4.6" height="3.6" rx="0.6" stroke="currentColor" stroke-width="1.2"/>' +
      '<path d="M6.6 7.3V6.1a1.4 1.4 0 0 1 2.8 0v1.2" stroke="currentColor" stroke-width="1.2"/></svg>',
    alertTriangle: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
      '<path d="M8 1.5l7 12.5H1L8 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>' +
      '<path d="M8 6v3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>' +
      '<circle cx="8" cy="11.8" r="0.9" fill="currentColor"/></svg>',
    circleCheck: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
      '<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>' +
      '<path d="M5 8.5l2 2 4-4.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    eraser: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
      '<path d="M10.6 1.8l3.6 3.6a1.2 1.2 0 0 1 0 1.7l-6 6H4.8L1.3 9.6a1.2 1.2 0 0 1 0-1.7l5.6-5.6a1.5 1.5 0 0 1 2.1 0z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<path d="M4.8 13.1H14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>'
  };

  var CSS = '' +
    '.prbn-wrapper { all: initial; display: block; font: 13px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }' +
    '.panel { box-sizing: border-box; display: block; margin: 0 0 8px 0; padding: 10px 12px; background: #FFFFFF; color: #1F2937; border: 1px solid #E4E7EC; border-radius: 10px; box-shadow: 0 2px 8px rgba(16,24,40,.08); }' +
    '.panel[data-hidden="true"] { display: none; }' +
    '.clean-row { display: flex; align-items: center; gap: 6px; color: #067647; }' +
    '.header-row { display: flex; align-items: center; gap: 6px; font-weight: 600; margin-bottom: 8px; }' +
    '.cat-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }' +
    '.cat-row { display: flex; align-items: center; gap: 6px; font-size: 12px; }' +
    '.cat-dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 auto; }' +
    '.cat-label { flex: 1 1 auto; }' +
    '.cat-count { color: #667085; font-size: 11px; }' +
    '.cat-sev { font-size: 11px; font-weight: 600; text-transform: capitalize; }' +
    '.actions-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }' +
    '.redact-btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; font-size: 12px; font-family: inherit; border: 1px solid #D0D5DD; border-radius: 6px; background: #fff; color: #344054; cursor: pointer; }' +
    '.redact-btn:hover { background: #F9FAFB; }' +
    '.badge { display: inline-flex; align-items: center; gap: 4px; color: #067647; font-size: 11px; white-space: nowrap; }' +
    '.note-line { margin-top: 6px; font-size: 12px; color: #667085; }';

  var HIGH_ACCENT = '#D92D20';
  var MED_ACCENT = '#DC6803';
  var CLEAN_ACCENT = '#067647';

  var hostEl = null;
  var panelEl = null;
  var noteEl = null;
  var redactCallback = null;

  function el(tag, props, children) {
    var e = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        if (k === 'className') e.className = props[k];
        else if (k === 'html') e.innerHTML = props[k];
        else e.setAttribute(k, props[k]);
      });
    }
    (children || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  function renderCleanRow() {
    var row = el('div', { className: 'clean-row' });
    row.innerHTML = '<span style="display:inline-flex">' + ICONS.circleCheck + '</span><span>' + COPY.CLEAN + '</span>';
    return row;
  }

  function renderWarning(result) {
    var accent = result.topSeverity === 'high' ? HIGH_ACCENT : MED_ACCENT;
    var frag = document.createDocumentFragment();

    var header = el('div', { className: 'header-row', style: 'color:' + accent });
    header.innerHTML = '<span style="display:inline-flex;color:' + accent + '">' + ICONS.alertTriangle + '</span>' +
      '<span>' + (result.topSeverity === 'high' ? COPY.HIGH_HEADER : COPY.MED_HEADER) + '</span>';
    frag.appendChild(header);

    var list = el('div', { className: 'cat-list', 'aria-hidden': 'false' });
    (result.categories || []).forEach(function (cat) {
      var rowAccent = cat.severity === 'high' ? HIGH_ACCENT : MED_ACCENT;
      var row = el('div', { className: 'cat-row' });
      row.innerHTML =
        '<span class="cat-dot" style="background:' + rowAccent + '"></span>' +
        '<span class="cat-label">' + cat.label + '</span>' +
        (cat.count > 1 ? '<span class="cat-count">×' + cat.count + '</span>' : '') +
        '<span class="cat-sev" style="color:' + rowAccent + '">' + (cat.severity === 'high' ? 'High' : 'Medium') + '</span>';
      list.appendChild(row);
    });
    frag.appendChild(list);

    var actions = el('div', { className: 'actions-row' });
    var btn = el('button', {
      className: 'redact-btn',
      type: 'button',
      'aria-label': 'Redact all detected sensitive data'
    });
    btn.innerHTML = '<span style="display:inline-flex">' + ICONS.eraser + '</span><span>' + COPY.REDACT_BTN + '</span>';
    btn.addEventListener('click', function () {
      if (redactCallback) redactCallback();
    });
    actions.appendChild(btn);

    var badge = el('span', { className: 'badge' });
    badge.innerHTML = '<span style="display:inline-flex">' + ICONS.shieldLock + '</span><span>' + COPY.LOCAL_BADGE + '</span>';
    actions.appendChild(badge);

    frag.appendChild(actions);
    return frag;
  }

  function mount(anchorEl) {
    if (!anchorEl) return;
    if (hostEl) destroy();

    hostEl = document.createElement('div');
    hostEl.id = 'prbn-host';
    var shadow = hostEl.attachShadow({ mode: 'open' });

    var style = document.createElement('style');
    style.textContent = CSS;
    shadow.appendChild(style);

    var wrapper = document.createElement('div');
    wrapper.className = 'prbn-wrapper';

    panelEl = document.createElement('div');
    panelEl.className = 'panel';
    panelEl.setAttribute('role', 'status');
    panelEl.setAttribute('aria-live', 'polite');
    panelEl.setAttribute('data-hidden', 'true');

    wrapper.appendChild(panelEl);
    shadow.appendChild(wrapper);

    if (anchorEl.parentNode) {
      anchorEl.parentNode.insertBefore(hostEl, anchorEl);
    }
  }

  function update(result) {
    if (!panelEl) return;

    var isEmpty = !!(result && result.empty);
    var showClean = !result || result.showClean !== false;
    var matches = (result && result.matches) || [];

    while (panelEl.firstChild) panelEl.removeChild(panelEl.firstChild);
    noteEl = null;

    if (isEmpty || (matches.length === 0 && !showClean)) {
      panelEl.setAttribute('data-hidden', 'true');
      panelEl.style.borderLeft = '';
      return;
    }

    panelEl.setAttribute('data-hidden', 'false');

    if (matches.length === 0) {
      panelEl.style.borderLeft = '3px solid ' + CLEAN_ACCENT;
      panelEl.appendChild(renderCleanRow());
    } else {
      var accent = result.topSeverity === 'high' ? HIGH_ACCENT : MED_ACCENT;
      panelEl.style.borderLeft = '3px solid ' + accent;
      panelEl.appendChild(renderWarning(result));
    }

    noteEl = el('div', { className: 'note-line' });
    panelEl.appendChild(noteEl);
  }

  function destroy() {
    if (hostEl && hostEl.parentNode) hostEl.parentNode.removeChild(hostEl);
    hostEl = null;
    panelEl = null;
    noteEl = null;
  }

  function onRedact(fn) {
    redactCallback = fn;
  }

  function onSendPolicyNote(msg) {
    if (noteEl) noteEl.textContent = msg;
  }

  root.PRBN = root.PRBN || {};
  root.PRBN.ui = {
    mount: mount,
    update: update,
    destroy: destroy,
    onRedact: onRedact,
    onSendPolicyNote: onSendPolicyNote,
    COPY: COPY
  };
})(window);
