# Changelog

## Unreleased

## 0.2.5 - 2026-09-10

- Added a Hyprland compositor-level click-focus fallback for Firefox/Wayland: an explicit swaync notification action runs a local helper that focuses the Firefox window temporarily marked by the originating userscript tab.
- Upgraded swaync install state to schema v2 so the new action hook/helper remains idempotent and reversible, including migration from existing schema-v1 installs.
- Bumped the userscript to v0.2.5 and centralized notification-click handling around the short-lived source-tab marker plus the existing same-tab conversation restore behavior.
- Added an AgentDock-native Remotion v3 product showcase with a 23.5-second real interaction demo, animated README preview, publication stills, and a reproducible local render pipeline.
- Redesigned the README hero and information architecture around the product value loop, Quick Start, accepted v3 preview, and deeper technical documentation links.
- Clarified that the userscript manager must be allowed to run on `https://chatgpt.com/*` before detector or swaync troubleshooting.
- Synchronized architecture, troubleshooting, security, and release guidance with the v0.2.5 click-return behavior while retaining the v0.2.4 short-response detector semantics.

## 0.2.4 - 2026-09-09

- Added a throttled `MutationObserver` so DOM completion checks are event-driven instead of relying only on the 400 ms safety poll.
- Arms a generation cycle when the latest user prompt changes after a recent Send/Enter/form-submit signal, allowing very short responses to notify even if the Stop control appears and disappears between polls.
- Preserves fail-quiet behavior for initial page load and ordinary conversation navigation by treating uncorrelated prompt changes as baseline updates.
- Added regression tests for prompt-change arming.

## 0.2.3 - 2026-09-09

- Added `@grant window.focus` so notification-click focus is handled by Tampermonkey's extension-level `focusTab` bridge instead of Firefox page-level `window.focus()`.
- Preserved click-only behavior: notifications remain passive until explicitly clicked.

## 0.2.2 - 2026-09-09

- Removed `GM_notification.highlight` so completion notifications no longer steal Firefox focus when they appear.
- Kept conversation-bound navigation on explicit notification click only.
- Added regression coverage preventing automatic highlight/focus from returning.

## 0.2.1 - 2026-09-09

- Added conversation-bound notification navigation.
- Removed `url: location.href` from userscript notifications so clicking does not open a new browser tab.
- Added `highlight: true` and click handlers that focus the originating tab.
- Captures the conversation URL at notification time and restores that URL inside the originating tab if it later navigated elsewhere.
- Added regression tests for no-new-tab behavior and conversation restoration decisions.

## 0.2.0 - 2026-09-09

- Replaced DOM-only completion detection with a hybrid resource-completion + DOM fallback design.
- Added prompt-bound answer resolution so notification previews cannot select the previous answer for a new prompt.
- Added explicit manual-stop and obvious-error suppression.
- Added detector status diagnostics from the userscript menu.
- Added pure Node tests for conversation paths, prompt binding, error recognition, text normalization, and manual-stop windows.
- Added related-work/design-provenance documentation with explicit licensing boundaries.

## 0.1.0 - 2026-09-09

- Initial public project structure.
- Conservative ChatGPT completion userscript.
- Persistent ChatGPT-only swaync rule.
- Reversible swaync installer/uninstaller with backup and install state.
- Doctor and end-to-end desktop notification test.
- Automated config and userscript static tests.
