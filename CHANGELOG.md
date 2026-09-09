# Changelog

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
