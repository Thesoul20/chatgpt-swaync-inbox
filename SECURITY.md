# Security Policy

## Scope

This project operates locally and does not require credentials, cookies, ChatGPT API keys, or a backend service.

The userscript reads rendered ChatGPT assistant text only to construct the local desktop notification preview. It declares `@grant window.focus` solely so an explicit notification click can reactivate the originating browser tab; notifications do not request focus when they appear.

## Reporting

Please report security-sensitive issues privately to the repository maintainer rather than posting secrets, session data, or private conversation content in a public issue.

## Non-goals

The project must not add session-token extraction, cookie harvesting, credential forwarding, or remote analytics.

## Hyprland click-focus helper

Starting with v0.2.5, the installer adds a local helper under `${XDG_DATA_HOME:-~/.local/share}/chatgpt-swaync-inbox/` and a swaync script rule scoped to actions on the exact summary `ChatGPT Answer Complete`. The helper does not run when a notification merely appears. On an explicit action, it reads Hyprland's local window list and focuses the Firefox window carrying the userscript's short-lived `[ChatGPT Inbox Return]` title marker. It does not read page content or transmit data. The uninstaller removes the helper and restores any pre-existing same-name swaync script state recorded by the installer.
