# Contributing

Contributions are welcome, especially reports from other distros, compositors, browsers, and swaync versions.

## Development

```bash
make test
```

Keep the project dependency-light. Browser code should remain usable as a standalone userscript and Linux config tooling should prefer the Python standard library plus common desktop utilities.

## Bug reports

Please include:

- distro and version;
- compositor/window manager;
- swaync version;
- browser and version;
- userscript manager and version;
- whether the userscript manager is allowed to run on `https://chatgpt.com/*`;
- active **ChatGPT swaync Inbox** userscript version;
- whether the userscript test notification works;
- output of `./scripts/doctor.sh` with private paths/usernames redacted if desired.

Do not include private ChatGPT conversation content.
