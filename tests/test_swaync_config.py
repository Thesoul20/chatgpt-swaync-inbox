#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOL = ROOT / "tools" / "swaync_config.py"
RULE_KEY = "chatgpt-swaync-inbox"
ACTION_SCRIPT_KEY = "chatgpt-swaync-inbox-focus"


class SwayncConfigTests(unittest.TestCase):
    def run_tool(
        self,
        action: str,
        config: Path,
        state: Path,
        helper: Path | None = None,
        check: bool = True,
    ):
        cmd = ["python3", str(TOOL), action, "--config", str(config), "--state", str(state)]
        if helper is not None:
            cmd += ["--focus-helper", str(helper)]
        return subprocess.run(cmd, text=True, capture_output=True, check=check)

    def helper(self, base: Path) -> Path:
        helper = base / "focus-browser-hyprland.sh"
        helper.write_text("#!/bin/sh\nexit 0\n", encoding="utf-8")
        helper.chmod(0o755)
        return helper

    def test_apply_is_idempotent_and_preserves_other_rules_and_scripts(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            config = base / "config.json"
            state = base / "state.json"
            helper = self.helper(base)
            original = {
                "timeout": 6,
                "timeout-critical": 9,
                "notification-visibility": {
                    "other": {"state": "enabled", "summary": "^Other$"}
                },
                "scripts": {
                    "other-script": {"exec": "/bin/true", "summary": "^Other$"}
                },
                "widgets": ["notifications"],
            }
            config.write_text(json.dumps(original), encoding="utf-8")

            self.run_tool("apply", config, state, helper)
            applied = json.loads(config.read_text())
            self.assertEqual(applied["timeout-critical"], 0)
            self.assertIn(RULE_KEY, applied["notification-visibility"])
            self.assertEqual(
                applied["notification-visibility"]["other"],
                original["notification-visibility"]["other"],
            )
            self.assertEqual(applied["scripts"]["other-script"], original["scripts"]["other-script"])
            self.assertEqual(
                applied["scripts"][ACTION_SCRIPT_KEY],
                {
                    "exec": str(helper),
                    "summary": "^ChatGPT Answer Complete$",
                    "run-on": "action",
                },
            )
            self.assertEqual(applied["widgets"], original["widgets"])
            install_state = json.loads(state.read_text())
            self.assertEqual(install_state["schema_version"], 2)
            self.assertEqual(install_state["focus_helper"], str(helper))

            second = self.run_tool("apply", config, state, helper)
            self.assertIn("already installed", second.stdout)

    def test_remove_restores_previous_timeout_and_rule_and_preserves_other_scripts(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            config = base / "config.json"
            state = base / "state.json"
            helper = self.helper(base)
            original_rule = {"state": "muted", "summary": "^Legacy$"}
            original = {
                "timeout-critical": 12,
                "notification-visibility": {
                    RULE_KEY: original_rule,
                    "other": {"state": "enabled", "body": "x"},
                },
                "scripts": {
                    "other": {"exec": "/bin/true", "body": "x"},
                },
            }
            config.write_text(json.dumps(original), encoding="utf-8")

            self.run_tool("apply", config, state, helper)
            self.run_tool("remove", config, state)
            restored = json.loads(config.read_text())
            self.assertEqual(restored["timeout-critical"], 12)
            self.assertEqual(restored["notification-visibility"][RULE_KEY], original_rule)
            self.assertNotIn(ACTION_SCRIPT_KEY, restored["scripts"])
            self.assertIn("other", restored["notification-visibility"])
            self.assertIn("other", restored["scripts"])
            self.assertFalse(state.exists())

    def test_upgrade_v1_state_adds_action_script_without_rewriting_original_state(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            config = base / "config.json"
            state = base / "state.json"
            helper = self.helper(base)
            config.write_text(
                json.dumps(
                    {
                        "timeout-critical": 0,
                        "notification-visibility": {
                            RULE_KEY: {
                                "state": "enabled",
                                "summary": "^ChatGPT Answer Complete$",
                                "override-urgency": "critical",
                            }
                        },
                        "scripts": {"other": {"exec": "/bin/true", "body": "x"}},
                    }
                ),
                encoding="utf-8",
            )
            state.write_text(
                json.dumps(
                    {
                        "schema_version": 1,
                        "config": str(config),
                        "backup": str(base / "old.bak"),
                        "original": {
                            "rule_present": False,
                            "rule": None,
                            "timeout_critical_present": True,
                            "timeout_critical": 0,
                        },
                    }
                ),
                encoding="utf-8",
            )

            result = self.run_tool("apply", config, state, helper)
            self.assertIn("upgraded install state", result.stdout)
            upgraded = json.loads(state.read_text())
            self.assertEqual(upgraded["schema_version"], 2)
            self.assertEqual(upgraded["original"]["timeout_critical"], 0)
            self.assertFalse(upgraded["original"]["action_script_present"])
            applied = json.loads(config.read_text())
            self.assertIn(ACTION_SCRIPT_KEY, applied["scripts"])
            self.assertIn("other", applied["scripts"])

    def test_check_fails_without_rule(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            config = base / "config.json"
            state = base / "state.json"
            helper = self.helper(base)
            config.write_text('{"timeout-critical": 0}', encoding="utf-8")
            result = self.run_tool("check", config, state, helper, check=False)
            self.assertNotEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
