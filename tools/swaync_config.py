#!/usr/bin/env python3
"""Safely apply/remove the chatgpt-swaync-inbox swaync integration."""

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
ACTION_SCRIPT_KEY = "chatgpt-swaync-inbox-focus"
STATE_SCHEMA = 2
SUPPORTED_STATE_SCHEMAS = {1, 2}


def action_script(helper: Path) -> dict:
    return {
        "exec": str(helper),
        "summary": r"^ChatGPT Answer Complete$",
        "run-on": "action",
    }


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


def object_field(data: dict, key: str) -> dict:
    value = data.get(key)
    if value is None:
        return {}
    if not isinstance(value, dict):
        raise SystemExit(f"{key} exists but is not an object")
    return value


def desired_config_matches(data: dict, helper: Path) -> bool:
    visibility = object_field(data, "notification-visibility")
    scripts = object_field(data, "scripts")
    return (
        visibility.get(RULE_KEY) == RULE
        and data.get("timeout-critical") == 0
        and scripts.get(ACTION_SCRIPT_KEY) == action_script(helper)
    )


def apply(config: Path, state_path: Path, helper: Path) -> None:
    data = load_json(config)
    visibility = object_field(data, "notification-visibility")
    scripts = object_field(data, "scripts")
    desired_script = action_script(helper)

    if state_path.exists():
        state = load_json(state_path)
        schema = state.get("schema_version")
        if schema not in SUPPORTED_STATE_SCHEMAS:
            raise SystemExit(f"unsupported existing install state: {state_path}")

        if schema == STATE_SCHEMA:
            if desired_config_matches(data, helper):
                print("already installed")
                return
            raise SystemExit("install state already exists but swaync config differs; run doctor before changing it")

        # Schema v1 -> v2 upgrade. v1 already owns RULE_KEY and timeout-critical,
        # but did not install an action script/helper. Preserve any pre-existing
        # script under our new key rather than overwriting it silently.
        if visibility.get(RULE_KEY) != RULE or data.get("timeout-critical") != 0:
            raise SystemExit("legacy install state exists but the v1 swaync rule differs; run doctor before upgrading")
        existing_script = scripts.get(ACTION_SCRIPT_KEY)
        if existing_script is not None and existing_script != desired_script:
            raise SystemExit(f"cannot upgrade: scripts.{ACTION_SCRIPT_KEY} already exists with a different value")

        original = dict(state.get("original", {}))
        original.update({
            "action_script_present": ACTION_SCRIPT_KEY in scripts,
            "action_script": existing_script,
        })
        scripts[ACTION_SCRIPT_KEY] = desired_script
        data["scripts"] = scripts
        write_json_atomic(config, data)

        state["schema_version"] = STATE_SCHEMA
        state["original"] = original
        state["focus_helper"] = str(helper)
        write_json_atomic(state_path, state)
        print(f"upgraded install state to schema {STATE_SCHEMA}")
        print(f"installed action script: {ACTION_SCRIPT_KEY}")
        return

    backup = backup_config(config)
    existing_script = scripts.get(ACTION_SCRIPT_KEY)
    if existing_script is not None and existing_script != desired_script:
        raise SystemExit(f"cannot install: scripts.{ACTION_SCRIPT_KEY} already exists with a different value")

    original = {
        "rule_present": RULE_KEY in visibility,
        "rule": visibility.get(RULE_KEY),
        "timeout_critical_present": "timeout-critical" in data,
        "timeout_critical": data.get("timeout-critical"),
        "action_script_present": ACTION_SCRIPT_KEY in scripts,
        "action_script": existing_script,
    }

    visibility[RULE_KEY] = RULE
    scripts[ACTION_SCRIPT_KEY] = desired_script
    data["notification-visibility"] = visibility
    data["scripts"] = scripts
    data["timeout-critical"] = 0
    write_json_atomic(config, data)

    state = {
        "schema_version": STATE_SCHEMA,
        "config": str(config),
        "backup": str(backup),
        "focus_helper": str(helper),
        "original": original,
    }
    write_json_atomic(state_path, state)
    print(f"installed rule: {RULE_KEY}")
    print(f"installed action script: {ACTION_SCRIPT_KEY}")
    print(f"backup: {backup}")
    if original["timeout_critical"] not in (None, 0):
        print("warning: timeout-critical was changed to 0; this makes all critical swaync notifications persistent")


def remove(config: Path, state_path: Path) -> None:
    data = load_json(config)
    state = load_json(state_path) if state_path.exists() else None
    visibility = object_field(data, "notification-visibility")
    scripts = object_field(data, "scripts")

    if state is None:
        changed = False
        if visibility.get(RULE_KEY) == RULE:
            visibility.pop(RULE_KEY, None)
            data["notification-visibility"] = visibility
            changed = True
        if ACTION_SCRIPT_KEY in scripts:
            scripts.pop(ACTION_SCRIPT_KEY, None)
            data["scripts"] = scripts
            changed = True
        if changed:
            write_json_atomic(config, data)
            print("removed project rule/action script; no install state existed, so timeout-critical was left unchanged")
        else:
            print("project integration not installed")
        return

    schema = state.get("schema_version")
    if schema not in SUPPORTED_STATE_SCHEMAS:
        raise SystemExit(f"unsupported install state: {state_path}")

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

    if schema >= 2:
        if original.get("action_script_present"):
            scripts[ACTION_SCRIPT_KEY] = original.get("action_script")
        else:
            scripts.pop(ACTION_SCRIPT_KEY, None)
        data["scripts"] = scripts

    write_json_atomic(config, data)
    state_path.unlink(missing_ok=True)
    print(f"removed rule: {RULE_KEY}")
    if schema >= 2:
        print(f"removed action script: {ACTION_SCRIPT_KEY}")
    print("restored the pre-install timeout-critical value")


def check(config: Path, state_path: Path, helper: Path) -> int:
    data = load_json(config)
    visibility = object_field(data, "notification-visibility")
    scripts = object_field(data, "scripts")
    rule_ok = visibility.get(RULE_KEY) == RULE
    timeout_ok = data.get("timeout-critical") == 0
    action_ok = scripts.get(ACTION_SCRIPT_KEY) == action_script(helper)
    state_ok = state_path.exists()
    state_schema_ok = False
    if state_ok:
        state = load_json(state_path)
        state_schema_ok = state.get("schema_version") == STATE_SCHEMA

    print(f"rule: {'ok' if rule_ok else 'missing/mismatched'}")
    print(f"timeout-critical=0: {'ok' if timeout_ok else 'no'}")
    print(f"action-script: {'ok' if action_ok else 'missing/mismatched'}")
    print(f"install-state: {'schema-v2' if state_schema_ok else ('legacy/mismatched' if state_ok else 'missing')}")
    return 0 if rule_ok and timeout_ok and action_ok and state_schema_ok else 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=("apply", "remove", "check"))
    parser.add_argument("--config", type=Path, required=True)
    parser.add_argument("--state", type=Path, required=True)
    parser.add_argument("--focus-helper", type=Path)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.action in {"apply", "check"} and args.focus_helper is None:
        raise SystemExit("--focus-helper is required for apply/check")
    if args.action == "apply":
        apply(args.config, args.state, args.focus_helper)
        return 0
    if args.action == "remove":
        remove(args.config, args.state)
        return 0
    return check(args.config, args.state, args.focus_helper)


if __name__ == "__main__":
    sys.exit(main())
