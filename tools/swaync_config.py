#!/usr/bin/env python3
"""Safely apply/remove the chatgpt-swaync-inbox swaync rule."""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

RULE_KEY = "chatgpt-swaync-inbox"
RULE = {
    "state": "enabled",
    "summary": r"^ChatGPT Answer Complete$",
    "override-urgency": "critical",
}
STATE_SCHEMA = 1


def load_json(path: Path) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SystemExit(f"config not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise SystemExit(f"config is not valid JSON: {path}: {exc}") from exc
    if not isinstance(data, dict):
        raise SystemExit(f"expected a JSON object in {path}")
    return data


def write_json_atomic(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f".{path.name}.chatgpt-swaync-inbox.tmp")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    tmp.replace(path)


def backup_config(config: Path) -> Path:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup = config.with_name(f"{config.name}.chatgpt-swaync-inbox.{stamp}.bak")
    shutil.copy2(config, backup)
    return backup


def apply(config: Path, state_path: Path) -> None:
    data = load_json(config)
    visibility = data.get("notification-visibility")
    if visibility is None:
        visibility = {}
    if not isinstance(visibility, dict):
        raise SystemExit("notification-visibility exists but is not an object")

    if state_path.exists():
        state = load_json(state_path)
        if state.get("schema_version") != STATE_SCHEMA:
            raise SystemExit(f"unsupported existing install state: {state_path}")
        if visibility.get(RULE_KEY) == RULE and data.get("timeout-critical") == 0:
            print("already installed")
            return
        raise SystemExit("install state already exists but swaync config differs; run doctor before changing it")

    backup = backup_config(config)
    original = {
        "rule_present": RULE_KEY in visibility,
        "rule": visibility.get(RULE_KEY),
        "timeout_critical_present": "timeout-critical" in data,
        "timeout_critical": data.get("timeout-critical"),
    }

    visibility[RULE_KEY] = RULE
    data["notification-visibility"] = visibility
    data["timeout-critical"] = 0
    write_json_atomic(config, data)

    state = {
        "schema_version": STATE_SCHEMA,
        "config": str(config),
        "backup": str(backup),
        "original": original,
    }
    write_json_atomic(state_path, state)
    print(f"installed rule: {RULE_KEY}")
    print(f"backup: {backup}")
    if original["timeout_critical"] not in (None, 0):
        print("warning: timeout-critical was changed to 0; this makes all critical swaync notifications persistent")


def remove(config: Path, state_path: Path) -> None:
    data = load_json(config)
    state = load_json(state_path) if state_path.exists() else None
    visibility = data.get("notification-visibility")
    if visibility is None:
        visibility = {}
    if not isinstance(visibility, dict):
        raise SystemExit("notification-visibility exists but is not an object")

    if state is None:
        if visibility.get(RULE_KEY) == RULE:
            visibility.pop(RULE_KEY, None)
            data["notification-visibility"] = visibility
            write_json_atomic(config, data)
            print("removed project rule; no install state existed, so timeout-critical was left unchanged")
        else:
            print("project rule not installed")
        return

    original = state.get("original", {})
    if original.get("rule_present"):
        visibility[RULE_KEY] = original.get("rule")
    else:
        visibility.pop(RULE_KEY, None)
    data["notification-visibility"] = visibility

    if original.get("timeout_critical_present"):
        data["timeout-critical"] = original.get("timeout_critical")
    else:
        data.pop("timeout-critical", None)

    write_json_atomic(config, data)
    state_path.unlink(missing_ok=True)
    print(f"removed rule: {RULE_KEY}")
    print("restored the pre-install timeout-critical value")


def check(config: Path, state_path: Path) -> int:
    data = load_json(config)
    visibility = data.get("notification-visibility") or {}
    rule_ok = isinstance(visibility, dict) and visibility.get(RULE_KEY) == RULE
    timeout_ok = data.get("timeout-critical") == 0
    state_ok = state_path.exists()

    print(f"rule: {'ok' if rule_ok else 'missing/mismatched'}")
    print(f"timeout-critical=0: {'ok' if timeout_ok else 'no'}")
    print(f"install-state: {'present' if state_ok else 'missing'}")
    return 0 if rule_ok and timeout_ok else 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=("apply", "remove", "check"))
    parser.add_argument("--config", type=Path, required=True)
    parser.add_argument("--state", type=Path, required=True)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.action == "apply":
        apply(args.config, args.state)
        return 0
    if args.action == "remove":
        remove(args.config, args.state)
        return 0
    return check(args.config, args.state)


if __name__ == "__main__":
    sys.exit(main())
