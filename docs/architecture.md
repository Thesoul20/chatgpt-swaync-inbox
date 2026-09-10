# Architecture

## Boundary of responsibility

The project deliberately separates browser completion detection from Linux notification policy.

```text
Browser layer                                   Desktop layer
─────────────                                   ─────────────
ChatGPT request + rendered turns                org.freedesktop.Notifications
        ↓                                                   ↓
hybrid completion detector                      swaync notification-visibility
        ↓                                                   ↓
prompt-bound final-answer resolver               override urgency → critical
        ↓                                                   ↓
GM_notification                                 timeout-critical = 0
                                                            ↓
                                                  persistent until dismissed
```

If ChatGPT changes its UI or request path, only the browser detector should need adjustment. If a user changes compositor or notification styling, the detector should not care.

## Completion detector: v0.2.4+

The detector uses two independent paths and deduplicates their result.

### Primary: resource-completion signal

A `PerformanceObserver` watches same-origin resource timing entries for the currently known ChatGPT conversation endpoints:

```text
/backend-api/f/conversation
/backend-api/conversation
```

A completed matching resource is treated as a strong indication that the current response stream ended. It is **not sufficient by itself** to emit a notification. The detector then:

1. identifies the latest user prompt in rendered conversation order;
2. resolves only the first assistant turn following that prompt;
3. waits until that answer is non-empty and stable;
4. suppresses success if a recent manual Stop or obvious error is detected;
5. emits the persistent notification.

The response body is never intercepted and no network content is uploaded or modified. Resource timing is only used as a local completion signal.

### Fallback: conservative DOM state machine

The DOM fallback remains active even when the network observer installs successfully. It covers endpoint changes, browsers that do not expose the expected resource timing entry, and other missed network signals.

The fallback requires a real generation cycle plus stable assistant output. A cycle can be armed in either of two ways:

1. a recognized Stop control is observed; or
2. a newly rendered user prompt appears shortly after a local Send/Enter/form-submit signal.

After a cycle is armed, the detector requires prompt-bound assistant activity, no recent manual Stop or obvious error, no active Stop control, and stable output through the quiet/stability windows. Prompt changes without recent submission evidence are treated as navigation/hydration baselines and do not notify.

The two paths share the same prompt-bound notification key, so the same answer should not notify twice.

## Prompt-bound answer resolution

Using “the last assistant message on the page” can accidentally select the previous answer while a new prompt is still starting. v0.2.0 instead walks conversation turns in document order:

```text
user(prompt A)
assistant(answer A)
user(prompt B)        ← latest user prompt
assistant(answer B)   ← only valid preview for prompt B
```

If `answer B` does not exist yet, the resolver returns “pending”; it never falls back to `answer A`.

## Stop and error semantics

A click on a recognized Stop control records a guard timestamp. A request or DOM completion arriving inside that window is not considered a successful natural completion.

Obvious generation errors are also fail-quiet. The detector looks for recent error/alert UI and error text associated with the prompt-bound answer. This is deliberately conservative: missing a notification is preferable to reporting a failed response as successfully finished.

## Persistence and the critical timeout

`swaync` can match notifications by summary and override their urgency. It does not currently expose a per-rule expiration timeout in `notification-visibility`.

The integration therefore applies:

```json
{
  "notification-visibility": {
    "chatgpt-swaync-inbox": {
      "state": "enabled",
      "summary": "^ChatGPT Answer Complete$",
      "override-urgency": "critical"
    }
  },
  "timeout-critical": 0
}
```

This makes the ChatGPT completion notification persistent, but `timeout-critical` is global. Therefore any other application that emits a genuinely critical notification will also remain until dismissed.

The installer records the pre-install value and the uninstaller restores it.

## Why the userscript does not set a timeout

The production `GM_notification` intentionally omits its own timeout. The desktop notification daemon should own expiration policy. If the userscript set a finite timeout, the browser/userscript manager could close the notification even though swaync was configured to retain it.


## Conversation-bound notification navigation

The completion detector binds not only the preview to the latest prompt/answer pair, but also the notification click to the **conversation URL that existed when the notification was emitted**.

The production `GM_notification` deliberately omits both the `url` option and `highlight`. Supplying `url: location.href` can cause the userscript manager/browser to open a new tab, while `highlight` can steal focus as soon as the notification appears. Current releases keep notification creation passive and perform navigation only inside the explicit click handler:

```text
notification appears
        ↓
no url / no highlight
        ↓
user clicks notification
        ↓
swaync ActionInvoked("default")
        ├─────────────────────────────────────┐
        ↓                                     ↓
userscript onclick(event)              Hyprland action helper
        ↓                                     ↓
preventDefault()                       wait for source marker
        ↓                                     ↓
mark source tab title briefly          focus exact Firefox HL.Window
        ↓
@grant window.focus → activate originating tab
        ↓
current URL == captured conversation URL?
    ├─ yes → scroll toward the completed answer
    └─ no  → navigate that same tab back to captured URL
```

This creates two separate bindings:

- **prompt-bound completion** answers “which assistant answer belongs to the latest prompt?”
- **conversation-bound navigation** answers “which browser context should this notification return the user to?”

If the original tab has been closed entirely, the userscript does not intentionally create a replacement tab; the no-new-tab behavior is preferred over silently spawning duplicate ChatGPT tabs.

## Failure modes

- **Known network endpoint changes:** resource signal is missed; DOM fallback remains active.
- **Resource Timing unavailable:** network observer fails quiet; DOM fallback remains active.
- **Stop selector changes:** network path can still complete; recent-submit + prompt-change arming can still cover some cycles, but Stop-based evidence becomes unavailable.
- **Turn/role selector changes:** prompt-bound resolution fails; detector fails quiet instead of using a stale answer.
- **Userscript site permission missing:** the script is never injected, so no detector or `GM_notification` path runs at all.
- **swaync rule missing:** browser notification still appears but follows normal swaync timeout.
- **critical timeout non-zero:** ChatGPT notification is promoted to critical but still expires according to swaync policy.
- **DND/inhibition:** OS policy wins and may suppress the popup.
- **Non-Hyprland Wayland compositor rejects browser focus:** the userscript still activates its source tab, but the v0.2.5 compositor-level fallback is Hyprland-specific.

See [Related work](related-work.md) for design provenance and licensing boundaries.


## Click-only focus policy

`GM_notification.highlight` is intentionally omitted. Tampermonkey documents `highlight` as focusing/highlighting the sending tab/window, which would interrupt whatever the user is doing as soon as a completion notification appears. Focus is instead requested only inside the notification `onclick` callback, after the user explicitly clicks the notification.


### Why `@grant window.focus` is required

Firefox may ignore page-level `window.focus()` when a userscript runs in a background tab. Tampermonkey 5.5 exposes a privileged `window.focus` bridge only when the userscript declares `@grant window.focus`; that bridge asks the extension to activate the originating tab and focus its browser window. This permission is used only inside the notification click handler, so notification creation itself remains passive and does not steal focus.

On Wayland, the compositor can still reject or ignore the browser window-focus request. Starting with v0.2.5, the Hyprland integration therefore adds a second, explicit-action-only path: the userscript briefly prefixes the source tab title with `[ChatGPT Inbox Return]`, while swaync runs `focus-browser-hyprland.sh` only for an action on the exact `ChatGPT Answer Complete` summary. The helper waits for the marker, resolves the matching Firefox window from `hyprctl clients -j`, and focuses that exact `HL.Window` through Hyprland's Lua dispatcher API. If Hyprland is not detected, the helper exits without changing focus.

This fallback was added after an end-to-end test proved that swaync emitted both an XDG activation token and `ActionInvoked("default")` while Firefox nevertheless remained behind the current Kitty window. With v0.2.5 installed, the same real notification-card click was verified to transition `Kitty → Firefox`, expose the temporary source marker, and then restore the normal conversation title.

## Fast-response detection

Starting with v0.2.4, the DOM fallback is event-driven. A throttled `MutationObserver` schedules checks whenever ChatGPT mutates the conversation DOM, while the 400 ms interval remains only as a safety net. The userscript also records recent composer submission signals (Send button, Enter, or form submit). If the latest user prompt changes inside that submit window, the detector arms a generation cycle even when the transient Stop control was never observed. Prompt changes without recent submission evidence are treated as baseline navigation/hydration events and do not notify.
