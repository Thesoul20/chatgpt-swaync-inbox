# Related work and design provenance

`chatgpt-swaync-inbox` is independently implemented under MIT. The projects below were reviewed to understand failure modes and mature notification patterns. Their source code is **not copied into this repository**.

Review date: 2026-09-10.

## Cross-platform landscape

The completion-notification problem is already served by several browser extensions and userscripts outside the Linux/swaync niche. That makes separate Windows- and macOS-native ports a low priority for this project: on those platforms, Chromium's notification APIs already provide a practical OS abstraction.

The table below compares public behavior documented or inspected on the review date. `OS-managed` means the project emits a normal browser/system notification whose retention is ultimately controlled by the operating system; it does **not** mean the project guarantees an unread result will remain indefinitely.

| Project | Primary environment | AI sites | Completion detector | Result retention | Click / return behavior | Distinctive capability |
|---|---|---|---|---|---|---|
| **chatgpt-swaync-inbox** | Linux / Wayland; Firefox or Chromium + userscript; swaync | ChatGPT | ChatGPT resource completion + event-driven DOM state machine + recent-submit evidence + prompt-bound answer stability | **Project-controlled persistent swaync inbox** | Same originating ChatGPT context; Hyprland compositor fallback for Firefox/Wayland | Passive arrival, persistent unread-result semantics, deterministic Linux desktop recovery |
| [shcw0405/streaming-complete-notifier](https://github.com/shcw0405/streaming-complete-notifier) | Chrome / Edge on Windows, macOS, Linux | ChatGPT, Gemini, Grok, AI Studio | Site-specific network/stream hooks; ChatGPT reasoning and image-generation paths include additional signals | OS-managed notification history | Re-activates the relevant AI tab/site | Broadest site coverage here; reasoning completion, image completion/failure, background-tab keepalive options |
| [duduzeta/aicq](https://github.com/duduzeta/aicq) | Chrome extension | ChatGPT, Claude, Gemini | `chrome.webRequest` endpoint completion plus DOM extraction of question context | Transient / OS-managed | Notification click focuses the relevant AI chat tab | Simple multi-provider endpoint registry and background reliability |
| [kkonstantin08/chatgpt-done-notifier](https://github.com/kkonstantin08/chatgpt-done-notifier) | Chrome Manifest V3; Windows-focused | ChatGPT | Conservative per-tab DOM generation state machine | OS-managed | Restores/focuses an existing ChatGPT tab, or can open ChatGPT if none exists | Quiet hours, custom sound, settings UI, debug log viewer |
| [kimik-hyum/ai-chat-notification](https://github.com/kimik-hyum/ai-chat-notification) | Chrome Manifest V3 on macOS / Windows | ChatGPT, Gemini, Claude | Stop-control state transition | OS-managed | Standard browser/system notification behavior | Very small multi-site implementation with site toggles |
| [ramhaidar/ChatGPT-Response-Complete-Notifier](https://github.com/ramhaidar/ChatGPT-Response-Complete-Notifier) | Tampermonkey-compatible userscript across Chrome, Firefox, Edge, Safari | ChatGPT | Streaming start/end detection with multiple selectors and duplicate cooldown | Browser / OS-managed | Standard notification interaction | Cross-browser userscript distribution, response preview, audible chime |
| [dawidstruzik/chat-alert](https://github.com/dawidstruzik/chat-alert) | Chrome extension | ChatGPT | Per-tab UI state tracking for thinking/writing/completion | OS-managed | Dashboard can focus tracked ChatGPT tabs | Multi-tab dashboard and live state/timer UX; **archived 2026-04-03** |

### What this comparison means for this project

The existing ecosystem already covers the generic requirement "tell me when an AI web response is finished" on Windows and macOS. `chatgpt-swaync-inbox` therefore should not compete by cloning native notification plumbing for each operating system. Its narrower differentiation is intentional:

- a completion is treated as an **unread result**, not just a transient toast;
- notification arrival does not intentionally steal focus;
- completion is bound to the latest prompt/answer pair rather than a loose page-level signal;
- notification handling is bound to the originating conversation;
- Hyprland receives an explicit compositor-level fallback when Firefox/Wayland focus activation is rejected;
- install/uninstall owns and restores the Linux notification-policy mutation.

If future demand justifies broader platform support, the lower-risk direction would be to extract the detector into a portable browser-extension core and let each OS keep its native/browser notification backend. A separate Windows executable and macOS app are not justified by the current landscape.

### Detector ideas worth tracking

The comparison also exposes useful future research without requiring a platform port:

- **multi-provider endpoint registries** from `aicq` for adding Claude/Gemini-like targets cleanly;
- **reasoning-complete vs final-answer-complete** separation from `streaming-complete-notifier`;
- **image generation completion/failure** using multiple independent signals rather than text-response assumptions;
- **background-tab suspension/keepalive behavior** in Chromium, which is a different failure mode from Hyprland focus recovery;
- **multi-tab status UX** from the archived `chat-alert`, useful as a design reference even though that repository is no longer maintained.

## Projects reviewed for design provenance

### ramhaidar/ChatGPT-Response-Complete-Notifier

- Repository: https://github.com/ramhaidar/ChatGPT-Response-Complete-Notifier
- License observed: GPL-3.0
- Useful design ideas reviewed:
  - use a browser/network completion signal instead of relying only on a disappearing Stop button;
  - bind the notification preview to the assistant turn that follows the latest user prompt;
  - explicitly suppress completion after a manual Stop action.

Because this repository is GPL-3.0, `chatgpt-swaync-inbox` uses only those general design ideas and contains its own implementation.

### kkonstantin08/chatgpt-done-notifier

- Repository: https://github.com/kkonstantin08/chatgpt-done-notifier
- No LICENSE file was present in the repository snapshot reviewed on 2026-09-09.
- Useful design ideas reviewed:
  - model generation as explicit states rather than a single boolean;
  - distinguish natural completion, manual stop, and obvious error states;
  - require assistant activity and a stabilization interval before emitting a success notification;
  - keep detector diagnostics inspectable.

Only general behavioral ideas were used.

### duduzeta/aicq

- Repository: https://github.com/duduzeta/aicq
- No LICENSE file was present in the repository snapshot reviewed on 2026-09-09.
- Useful design ideas reviewed:
  - network completion can be a strong primary signal;
  - network and DOM approaches can be combined rather than treated as mutually exclusive;
  - clicking a notification should return attention to the relevant AI chat.

Only general behavioral ideas were used.

## What the current detector implements independently

The current detector keeps the v0.2.0 hybrid design and adds the v0.2.4 event-driven short-response path:

```text
Known ChatGPT conversation request completes
              │
              ├── primary signal ──> resolve latest prompt-bound assistant turn
              │                         │
              │                         ├── manual Stop? -> suppress
              │                         ├── obvious error? -> suppress
              │                         └── stable answer -> notify
              │
              └── if unavailable/missed
                        ↓
              event-driven DOM fallback
                        │
                        ├── Stop observed
                        │       OR
                        ├── recent Send/Enter/form submit + new prompt
                        ├── prompt-bound assistant activity
                        ├── no active Stop / no error
                        ├── output stabilizes
                        └── notify
```

Uncorrelated prompt changes, such as loading an existing conversation, only update the baseline and remain fail-quiet.

The Linux/Wayland persistence layer remains the defining feature of this project: the completion notification is promoted by a narrow swaync rule and retained as an unread task until the user dismisses it.
