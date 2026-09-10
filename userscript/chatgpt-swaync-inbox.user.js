// ==UserScript==
// @name         ChatGPT swaync Inbox
// @namespace    https://github.com/Thesoul20/chatgpt-swaync-inbox
// @homepageURL  https://github.com/Thesoul20/chatgpt-swaync-inbox
// @supportURL   https://github.com/Thesoul20/chatgpt-swaync-inbox/issues
// @downloadURL  https://raw.githubusercontent.com/Thesoul20/chatgpt-swaync-inbox/main/userscript/chatgpt-swaync-inbox.user.js
// @updateURL    https://raw.githubusercontent.com/Thesoul20/chatgpt-swaync-inbox/main/userscript/chatgpt-swaync-inbox.user.js
// @version      0.2.5
// @description  Turn completed ChatGPT web answers into persistent Linux/Wayland desktop notifications when paired with swaync.
// @match        https://chatgpt.com/*
// @grant        GM_notification
// @grant        GM_registerMenuCommand
// @grant        window.focus
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  const NOTIFICATION_TITLE = 'ChatGPT Answer Complete';
  const FOCUS_TARGET_TITLE_PREFIX = '[ChatGPT Inbox Return] ';
  const CONVERSATION_PATHS = new Set([
    '/backend-api/f/conversation',
    '/backend-api/conversation',
  ]);
  const CONFIG = Object.freeze({
    pollMs: 400,
    domQuietMs: 2200,
    answerStableMs: 700,
    answerWaitMs: 7000,
    manualStopGuardMs: 3500,
    promptSubmitGuardMs: 8000,
    notifyWhenFocused: true,
    debug: false,
  });

  let state = 'IDLE';
  let cyclePromptKey = '';
  let baselineAnswerKey = '';
  let lastAnswerKey = '';
  let sawAssistantActivity = false;
  let lastAssistantActivityAt = 0;
  let stopGoneAt = 0;
  let lastManualStopAt = 0;
  let lastPromptSubmitAt = 0;
  let lastNotifiedKey = '';
  let networkObserver = null;
  let networkObserverInstalled = false;
  let domObserver = null;
  let domObservationTimer = null;
  let lastSeenPromptKey = '';
  const handledNetworkEntries = new Set();

  const log = (...args) => {
    if (CONFIG.debug) console.debug('[chatgpt-swaync-inbox]', ...args);
  };

  function cleanText(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  function signature(text) {
    const compact = cleanText(text);
    return `${compact.length}:${compact.slice(0, 160)}:${compact.slice(-160)}`;
  }

  function conversationPath(url) {
    try {
      return new URL(url, location.href).pathname;
    } catch {
      return '';
    }
  }

  function isConversationUrl(url) {
    return CONVERSATION_PATHS.has(conversationPath(url));
  }

  function containsErrorText(value) {
    const text = cleanText(value).toLowerCase();
    return [
      'there was an error generating a response',
      'an error occurred',
      'network error',
      'something went wrong',
      'error generating response',
      '生成回复时出错',
      '生成回答时出错',
      '网络错误',
      '发生错误',
      '出了点问题',
    ].some((token) => text.includes(token));
  }

  function isManualStopWindow(timestamp, stopTimestamp = lastManualStopAt) {
    return Boolean(stopTimestamp) && timestamp >= stopTimestamp && timestamp - stopTimestamp <= CONFIG.manualStopGuardMs;
  }

  function shouldRestoreConversation(currentUrl, capturedUrl) {
    return Boolean(capturedUrl) && currentUrl !== capturedUrl;
  }

  function markFocusTarget() {
    const originalTitle = document.title;
    const markedTitle = originalTitle.startsWith(FOCUS_TARGET_TITLE_PREFIX)
      ? originalTitle
      : `${FOCUS_TARGET_TITLE_PREFIX}${originalTitle}`;
    document.title = markedTitle;
    window.setTimeout(() => {
      if (document.title === markedTitle) document.title = originalTitle;
    }, 1800);
  }

  function handleNotificationClick(event, conversationUrl, answerNode = null) {
    event?.preventDefault?.();
    markFocusTarget();
    window.focus();

    if (shouldRestoreConversation(location.href, conversationUrl)) {
      location.assign(conversationUrl);
      return;
    }

    answerNode?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }

  function isPromptSubmitWindow(timestamp, submitTimestamp = lastPromptSubmitAt) {
    return Boolean(submitTimestamp)
      && timestamp >= submitTimestamp
      && timestamp - submitTimestamp <= CONFIG.promptSubmitGuardMs;
  }

  function shouldArmForPromptChange(previousPromptKey, snapshot, timestamp, submitTimestamp = lastPromptSubmitAt) {
    return Boolean(snapshot?.promptKey)
      && snapshot.promptKey !== previousPromptKey
      && isPromptSubmitWindow(timestamp, submitTimestamp);
  }

  function selectPromptBoundTurn(turns) {
    let userIndex = -1;
    for (let index = turns.length - 1; index >= 0; index -= 1) {
      if (turns[index]?.role === 'user') {
        userIndex = index;
        break;
      }
    }

    if (userIndex < 0) {
      return { promptKey: '', promptText: '', answerKey: '', answerText: '', answerNode: null };
    }

    const prompt = turns[userIndex];
    let answer = null;
    let answerIndex = -1;
    for (let index = userIndex + 1; index < turns.length; index += 1) {
      if (turns[index]?.role === 'assistant') {
        answer = turns[index];
        answerIndex = index;
        break;
      }
    }

    const promptKey = prompt.id || `user:${userIndex}:${signature(prompt.text)}`;
    if (!answer) {
      return {
        promptKey,
        promptText: cleanText(prompt.text),
        answerKey: '',
        answerText: '',
        answerNode: null,
      };
    }

    return {
      promptKey,
      promptText: cleanText(prompt.text),
      answerKey: answer.id || `assistant:${answerIndex}:${signature(answer.text)}`,
      answerText: cleanText(answer.text),
      answerNode: answer.node || null,
    };
  }

  if (globalThis.__CHATGPT_SWAYNC_INBOX_TEST_MODE__) {
    globalThis.__CHATGPT_SWAYNC_INBOX_TEST__ = {
      cleanText,
      signature,
      conversationPath,
      isConversationUrl,
      containsErrorText,
      isManualStopWindow,
      shouldRestoreConversation,
      isPromptSubmitWindow,
      shouldArmForPromptChange,
      selectPromptBoundTurn,
    };
    return;
  }

  function turnRecords() {
    const nodes = Array.from(document.querySelectorAll(
      '[data-message-author-role="user"], [data-message-author-role="assistant"]'
    ));

    return nodes.map((node, index) => {
      const role = node.getAttribute('data-message-author-role') || '';
      const container = node.closest('[data-testid^="conversation-turn-"]');
      const id = container?.getAttribute('data-testid')
        || node.getAttribute('data-message-id')
        || `${role}:${index}:${signature(node.innerText || node.textContent || '')}`;
      return {
        role,
        id,
        text: node.innerText || node.textContent || '',
        node,
      };
    });
  }

  function promptBoundSnapshot() {
    return selectPromptBoundTurn(turnRecords());
  }

  function isStopButton(element) {
    if (!(element instanceof HTMLElement)) return false;

    const testid = (element.getAttribute('data-testid') || '').toLowerCase();
    const aria = (element.getAttribute('aria-label') || '').toLowerCase();
    const title = (element.getAttribute('title') || '').toLowerCase();
    const text = cleanText(element.textContent).toLowerCase();

    if (testid === 'stop-button' || testid === 'fruitjuice-stop-button' || testid.includes('composer-stop')) {
      return true;
    }
    if (/stop generating|stop response|stop streaming|停止生成|停止回答|停止响应/.test(aria)) return true;
    if (/stop generating|stop response|stop streaming|停止生成|停止回答|停止响应/.test(title)) return true;
    return /^(stop|停止|停止生成|停止回答)$/.test(text);
  }

  function stopButton() {
    return Array.from(document.querySelectorAll('button')).find(isStopButton) || null;
  }

  function isSendButton(element) {
    if (!(element instanceof HTMLElement)) return false;
    const button = element.closest('button');
    if (!button) return false;
    const testid = (button.getAttribute('data-testid') || '').toLowerCase();
    const aria = (button.getAttribute('aria-label') || '').toLowerCase();
    const text = cleanText(button.textContent).toLowerCase();
    return testid.includes('send-button')
      || /send message|send prompt|发送消息|发送/.test(aria)
      || /^(send|发送)$/.test(text);
  }

  function isComposerTarget(element) {
    if (!(element instanceof Element)) return false;
    return Boolean(element.closest('textarea, [contenteditable="true"], #prompt-textarea'));
  }

  function recordPromptSubmit(source) {
    lastPromptSubmitAt = Date.now();
    log('prompt submit observed', source);
    scheduleDomObservation();
  }

  function detectObviousError() {
    const candidates = Array.from(document.querySelectorAll(
      '[role="alert"], [data-testid*="error"], [class*="text-danger"], [class*="text-red"]'
    )).slice(-12);

    if (candidates.some((element) => containsErrorText(element.textContent || ''))) return true;

    const latest = promptBoundSnapshot();
    return Boolean(latest.answerText) && containsErrorText(latest.answerText);
  }

  function preview(text) {
    const compact = cleanText(text);
    if (!compact) return 'The current ChatGPT response has finished.';
    return compact.length > 180 ? `${compact.slice(0, 177)}…` : compact;
  }

  function notificationKey(snapshot) {
    return `${snapshot.promptKey}|${snapshot.answerKey}|${signature(snapshot.answerText)}`;
  }

  function sendNotification(snapshot, source) {
    if (!snapshot?.promptKey || !snapshot?.answerText) {
      log('completion suppressed: no prompt-bound answer', source);
      return false;
    }

    const key = notificationKey(snapshot);
    if (key === lastNotifiedKey) {
      log('duplicate completion suppressed', source);
      return false;
    }

    if (!CONFIG.notifyWhenFocused && document.visibilityState === 'visible' && document.hasFocus()) {
      log('focused page notification suppressed');
      return false;
    }

    lastNotifiedKey = key;
    const conversationUrl = location.href;
    const answerNode = snapshot.answerNode;

    GM_notification({
      title: NOTIFICATION_TITLE,
      text: preview(snapshot.answerText),
      tag: `chatgpt-complete-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      silent: false,
      onclick: (event) => handleNotificationClick(event, conversationUrl, answerNode),
    });

    log('completion notification sent', { source, promptKey: snapshot.promptKey });
    return true;
  }

  function resetCycle(reason = 'reset') {
    state = 'IDLE';
    cyclePromptKey = '';
    baselineAnswerKey = '';
    lastAnswerKey = '';
    sawAssistantActivity = false;
    lastAssistantActivityAt = 0;
    stopGoneAt = 0;
    log(`state -> IDLE (${reason})`);
  }

  function beginCycle(snapshot = promptBoundSnapshot(), promptChanged = false) {
    state = 'GENERATING';
    cyclePromptKey = snapshot.promptKey;
    baselineAnswerKey = promptChanged
      ? ''
      : (snapshot.answerKey ? `${snapshot.answerKey}:${signature(snapshot.answerText)}` : '');
    lastAnswerKey = baselineAnswerKey;
    sawAssistantActivity = promptChanged && Boolean(snapshot.answerText);
    lastAssistantActivityAt = sawAssistantActivity ? Date.now() : 0;
    stopGoneAt = 0;
    if (snapshot.promptKey) lastSeenPromptKey = snapshot.promptKey;
    log('state -> GENERATING', { cyclePromptKey, promptChanged });
  }

  function noteAssistantActivity(snapshot, now) {
    const currentKey = snapshot.answerKey ? `${snapshot.answerKey}:${signature(snapshot.answerText)}` : '';
    if (currentKey && currentKey !== lastAnswerKey) {
      lastAnswerKey = currentKey;
      sawAssistantActivity = currentKey !== baselineAnswerKey;
      lastAssistantActivityAt = now;
    }
  }

  async function waitForStablePromptBoundAnswer(expectedPromptKey) {
    const startedAt = Date.now();
    let stableKey = '';
    let stableSince = 0;

    while (Date.now() - startedAt <= CONFIG.answerWaitMs) {
      if (detectObviousError()) return null;
      if (isManualStopWindow(Date.now())) return null;

      const snapshot = promptBoundSnapshot();
      if (!snapshot.promptKey || snapshot.promptKey !== expectedPromptKey) return null;

      if (snapshot.answerText) {
        const key = `${snapshot.answerKey}:${signature(snapshot.answerText)}`;
        if (key === stableKey) {
          if (Date.now() - stableSince >= CONFIG.answerStableMs) return snapshot;
        } else {
          stableKey = key;
          stableSince = Date.now();
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 120));
    }

    return null;
  }

  async function handleNetworkCompletion(entry) {
    const path = conversationPath(entry.name);
    const entryKey = `${path}:${Math.round(entry.startTime || 0)}:${Math.round(entry.duration || 0)}`;
    if (handledNetworkEntries.has(entryKey)) return;
    handledNetworkEntries.add(entryKey);
    if (handledNetworkEntries.size > 40) {
      const first = handledNetworkEntries.values().next().value;
      handledNetworkEntries.delete(first);
    }

    const timeOrigin = performance.timeOrigin || (Date.now() - performance.now());
    const startEpoch = timeOrigin + (entry.startTime || 0);
    const endEpoch = startEpoch + (entry.duration || 0);

    if (lastManualStopAt && lastManualStopAt >= startEpoch - 150 && lastManualStopAt <= endEpoch + CONFIG.manualStopGuardMs) {
      log('network completion suppressed after manual stop');
      resetCycle('manual stop');
      return;
    }

    if (detectObviousError()) {
      log('network completion suppressed by error state');
      resetCycle('error');
      return;
    }

    const initial = promptBoundSnapshot();
    if (!initial.promptKey) return;
    lastSeenPromptKey = initial.promptKey;

    const settled = await waitForStablePromptBoundAnswer(initial.promptKey);
    if (!settled) {
      log('network completion could not resolve stable prompt-bound answer; DOM fallback remains armed');
      return;
    }

    sendNotification(settled, 'network');
    resetCycle('network completion');
  }

  function installNetworkObserver() {
    if (typeof PerformanceObserver !== 'function') return false;

    try {
      networkObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType !== 'resource') continue;
          if (!isConversationUrl(entry.name)) continue;
          if (entry.initiatorType && !['fetch', 'xmlhttprequest'].includes(entry.initiatorType)) continue;
          handleNetworkCompletion(entry).catch((error) => log('network completion handler failed', error));
        }
      });
      networkObserver.observe({ type: 'resource', buffered: false });
      networkObserverInstalled = true;
      log('network completion observer installed');
      return true;
    } catch (error) {
      log('network observer unavailable; using DOM fallback', error);
      networkObserver = null;
      networkObserverInstalled = false;
      return false;
    }
  }

  function tickDomFallback() {
    const now = Date.now();
    const stop = stopButton();
    const snapshot = promptBoundSnapshot();

    if (state === 'IDLE') {
      const promptChanged = Boolean(snapshot.promptKey) && snapshot.promptKey !== lastSeenPromptKey;
      if (stop) {
        beginCycle(snapshot, promptChanged);
      } else if (shouldArmForPromptChange(lastSeenPromptKey, snapshot, now)) {
        beginCycle(snapshot, true);
      } else if (promptChanged) {
        lastSeenPromptKey = snapshot.promptKey;
        log('prompt baseline updated without generation evidence');
      }
      return;
    }

    if (cyclePromptKey && snapshot.promptKey && snapshot.promptKey !== cyclePromptKey) {
      resetCycle('prompt changed');
      if (stop || isPromptSubmitWindow(now)) {
        beginCycle(snapshot, true);
      } else {
        lastSeenPromptKey = snapshot.promptKey;
      }
      return;
    }

    if (snapshot.promptKey) lastSeenPromptKey = snapshot.promptKey;
    noteAssistantActivity(snapshot, now);

    if (detectObviousError()) {
      resetCycle('error');
      return;
    }

    if (isManualStopWindow(now)) {
      resetCycle('manual stop');
      return;
    }

    if (stop) {
      stopGoneAt = 0;
      return;
    }

    if (!stopGoneAt) {
      stopGoneAt = now;
      log('stop control disappeared; DOM fallback settling');
      return;
    }

    if (!sawAssistantActivity || !snapshot.answerText) return;
    if (now - stopGoneAt < CONFIG.domQuietMs) return;
    if (lastAssistantActivityAt && now - lastAssistantActivityAt < CONFIG.answerStableMs) return;

    sendNotification(snapshot, networkObserverInstalled ? 'dom-fallback-after-network-miss' : 'dom-fallback');
    resetCycle('DOM completion');
  }

  function scheduleDomObservation() {
    if (domObservationTimer !== null) return;
    domObservationTimer = window.setTimeout(() => {
      domObservationTimer = null;
      tickDomFallback();
    }, 80);
  }

  function installDomObserver() {
    if (typeof MutationObserver !== 'function' || !document.documentElement) return false;
    domObserver = new MutationObserver(() => scheduleDomObservation());
    domObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    log('DOM mutation observer installed');
    return true;
  }

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('button') || null;
    if (button && isStopButton(button)) {
      lastManualStopAt = Date.now();
      log('manual stop click observed');
      return;
    }
    if (target && isSendButton(target)) recordPromptSubmit('send button');
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    if (event.target instanceof Element && isComposerTarget(event.target)) recordPromptSubmit('enter key');
  }, true);

  document.addEventListener('submit', (event) => {
    if (event.target instanceof Element && event.target.querySelector('textarea, [contenteditable="true"], #prompt-textarea')) {
      recordPromptSubmit('form submit');
    }
  }, true);

  GM_registerMenuCommand('Send test notification', () => {
    const conversationUrl = location.href;
    GM_notification({
      title: NOTIFICATION_TITLE,
      text: 'If swaync integration is installed, this notification should stay until you dismiss it.',
      tag: `chatgpt-swaync-test-${Date.now()}`,
      silent: false,
      onclick: (event) => handleNotificationClick(event, conversationUrl),
    });
  });

  GM_registerMenuCommand('Log detector status', () => {
    console.info('[chatgpt-swaync-inbox] detector status', {
      version: '0.2.5',
      state,
      networkObserverInstalled,
      domObserverInstalled: Boolean(domObserver),
      lastSeenPromptKey,
      cyclePromptKey,
      sawAssistantActivity,
      lastManualStopAt,
      lastPromptSubmitAt,
      latest: promptBoundSnapshot(),
    });
  });

  lastSeenPromptKey = promptBoundSnapshot().promptKey;
  installNetworkObserver();
  installDomObserver();
  setInterval(tickDomFallback, CONFIG.pollMs);
  window.addEventListener('pagehide', () => {
    networkObserver?.disconnect?.();
    domObserver?.disconnect?.();
    if (domObservationTimer !== null) window.clearTimeout(domObservationTimer);
  }, { once: true });
  log('loaded v0.2.5');
})();
