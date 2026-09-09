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


class SwayncConfigTests(unittest.TestCase):
    def run_tool(self, action: str, config: Path, state: Path, check: bool = True):
        return subprocess.run(
            ["python3", str(TOOL), action, "--config", str(config), "--state", str(state)],
            text=True,
            capture_output=True,
            check=check,
        )

    def test_apply_is_idempotent_and_preserves_other_rules(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            config = base / "config.json"
            state = base / "state.json"
            original = {
                "timeout": 6,
                "timeout-critical": 9,
                "notification-visibility": {
                    "other": {"state": "enabled", "summary": "^Other$"}
                },
                "widgets": ["notifications"],
            }
            config.write_text(json.dumps(original), encoding="utf-8")

            self.run_tool("apply", config, state)
            applied = json.loads(config.read_text())
            self.assertEqual(applied["timeout-critical"], 0)
            self.assertIn(RULE_KEY, applied["notification-visibility"])
            self.assertEqual(applied["notification-visibility"]["other"], original["notification-visibility"]["other"])
            self.assertEqual(applied["widgets"], original["widgets"])

            second = self.run_tool("apply", config, state)
            self.assertIn("already installed", second.stdout)

    def test_remove_restores_previous_timeout_and_rule(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            config = base / "config.json"
            state = base / "state.json"
            original_rule = {"state": "muted", "summary": "^Legacy$"}
            original = {
                "timeout-critical": 12,
                "notification-visibility": {RULE_KEY: original_rule, "other": {"state": "enabled", "body": "x"}},
            }
            config.write_text(json.dumps(original), encoding="utf-8")

            self.run_tool("apply", config, state)
            self.run_tool("remove", config, state)
            restored = json.loads(config.read_text())
            self.assertEqual(restored["timeout-critical"], 12)
            self.assertEqual(restored["notification-visibility"][RULE_KEY], original_rule)
            self.assertIn("other", restored["notification-visibility"])
            self.assertFalse(state.exists())

    def test_check_fails_without_rule(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            config = base / "config.json"
            state = base / "state.json"
            config.write_text('{"timeout-critical": 0}', encoding="utf-8")
            result = self.run_tool("check", config, state, check=False)
            self.assertNotEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
