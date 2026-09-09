// ==UserScript==
// @name         ChatGPT swaync Inbox
// @namespace    https://github.com/Thesoul20/chatgpt-swaync-inbox
// @homepageURL  https://github.com/Thesoul20/chatgpt-swaync-inbox
// @supportURL   https://github.com/Thesoul20/chatgpt-swaync-inbox/issues
// @downloadURL  https://raw.githubusercontent.com/Thesoul20/chatgpt-swaync-inbox/main/userscript/chatgpt-swaync-inbox.user.js
// @updateURL    https://raw.githubusercontent.com/Thesoul20/chatgpt-swaync-inbox/main/userscript/chatgpt-swaync-inbox.user.js
// @version      0.1.0
// @description  Turn completed ChatGPT web answers into persistent Linux/Wayland desktop notifications when paired with swaync.
// @match        https://chatgpt.com/*
// @grant        GM_notification
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  const NOTIFICATION_TITLE = 'ChatGPT Answer Complete';
  const CONFIG = Object.freeze({
    pollMs: 500,
    quietMs: 4500,
    manualStopGuardMs: 3000,
    notifyWhenFocused: true,
    debug: false,
  });

  let state = 'IDLE';
  let baselineAssistantCount = 0;
  let baselineLastAssistantText = '';
  let stopGoneAt = 0;
  let lastManualStopAt = 0;
  let lastNotifiedSignature = '';

  const log = (...args) => {
    if (CONFIG.debug) console.debug('[chatgpt-swaync-inbox]', ...args);
  };

  function cleanText(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  function buttons() {
    return Array.from(document.querySelectorAll('button'));
  }

  function isStopButton(element) {
    if (!(element instanceof HTMLElement)) return false;

    const testid = (element.getAttribute('data-testid') || '').toLowerCase();
    const aria = (element.getAttribute('aria-label') || '').toLowerCase();
    const title = (element.getAttribute('title') || '').toLowerCase();
    const text = cleanText(element.textContent).toLowerCase();

    if (testid.includes('stop')) return true;
    if (/stop generating|stop response|stop streaming|停止生成|停止回答|停止响应/.test(aria)) return true;
    if (/stop generating|stop response|stop streaming|停止生成|停止回答|停止响应/.test(title)) return true;
    return /^(stop|停止|停止生成|停止回答)$/.test(text);
  }

  function stopButton() {
    return buttons().find(isStopButton) || null;
  }

  function assistantMessages() {
    const primary = Array.from(document.querySelectorAll('[data-message-author-role="assistant"]'));
    if (primary.length) return primary;

    return Array.from(document.querySelectorAll('article')).filter((element) => {
      const text = cleanText(element.textContent);
      return text.length > 0 && element.querySelector('.markdown, [class*="markdown"]');
    });
  }

  function lastAssistantText() {
    const messages = assistantMessages();
    if (!messages.length) return '';
    const last = messages[messages.length - 1];
    return cleanText(last.innerText || last.textContent || '');
  }

  function responseChanged() {
    const messages = assistantMessages();
    return messages.length > baselineAssistantCount || lastAssistantText() !== baselineLastAssistantText;
  }

  function signature(text) {
    return `${text.length}:${text.slice(0, 160)}:${text.slice(-160)}`;
  }

  function preview(text) {
    const compact = cleanText(text);
    if (!compact) return 'The current ChatGPT response has finished.';
    return compact.length > 180 ? `${compact.slice(0, 177)}…` : compact;
  }

  function sendNotification() {
    const text = lastAssistantText();
    const sig = signature(text);

    if (sig && sig === lastNotifiedSignature) {
      log('duplicate completion suppressed');
      return;
    }

    if (!CONFIG.notifyWhenFocused && document.visibilityState === 'visible' && document.hasFocus()) {
      log('focused page notification suppressed');
      return;
    }

    lastNotifiedSignature = sig;
    GM_notification({
      title: NOTIFICATION_TITLE,
      text: preview(text),
      tag: `chatgpt-complete-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: location.href,
      silent: false,
      onclick: () => {
        window.focus();
        document.documentElement.scrollIntoView({ block: 'end', behavior: 'smooth' });
      },
    });

    log('completion notification sent');
  }

  function enterGenerating() {
    state = 'GENERATING';
    stopGoneAt = 0;
    baselineAssistantCount = assistantMessages().length;
    baselineLastAssistantText = lastAssistantText();
    log('state -> GENERATING');
  }

  function reset() {
    state = 'IDLE';
    stopGoneAt = 0;
    log('state -> IDLE');
  }

  function tick() {
    const stop = stopButton();

    if (state === 'IDLE') {
      if (stop) enterGenerating();
      return;
    }

    if (stop) {
      stopGoneAt = 0;
      return;
    }

    if (!stopGoneAt) {
      stopGoneAt = Date.now();
      log('stop control disappeared; settling');
      return;
    }

    if (Date.now() - stopGoneAt < CONFIG.quietMs) return;

    if (Date.now() - lastManualStopAt < CONFIG.manualStopGuardMs) {
      log('manual stop detected; success notification suppressed');
      reset();
      return;
    }

    if (!responseChanged()) {
      log('assistant output did not change; completion suppressed');
      reset();
      return;
    }

    sendNotification();
    reset();
  }

  document.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('button') : null;
    if (button && isStopButton(button)) {
      lastManualStopAt = Date.now();
      log('manual stop click observed');
    }
  }, true);

  GM_registerMenuCommand('Send test notification', () => {
    GM_notification({
      title: NOTIFICATION_TITLE,
      text: 'If swaync integration is installed, this notification should stay until you dismiss it.',
      tag: `chatgpt-swaync-test-${Date.now()}`,
      url: location.href,
      silent: false,
    });
  });

  setInterval(tick, CONFIG.pollMs);
  log('loaded v0.1.0');
})();
