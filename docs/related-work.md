# Related work and design provenance

`chatgpt-swaync-inbox` is independently implemented under MIT. The projects below were reviewed to understand failure modes and mature notification patterns. Their source code is **not copied into this repository**.

Review date: 2026-09-09.

## Projects reviewed

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

## What v0.2.0 implements independently

The v0.2.0 detector is intentionally hybrid:

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
                 DOM state fallback
                        │
                        ├── generation Stop observed
                        ├── assistant activity observed
                        ├── Stop disappears
                        ├── output stabilizes
                        └── notify
```

The Linux/Wayland persistence layer remains the defining feature of this project: the completion notification is promoted by a narrow swaync rule and retained as an unread task until the user dismisses it.
