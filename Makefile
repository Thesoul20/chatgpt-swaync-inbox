.PHONY: test doctor

test:
	python3 -m unittest discover -s tests -p 'test_*.py' -v
	bash tests/test_userscript.sh
	bash tests/test_focus_helper.sh
	node tests/test_detector_core.mjs

doctor:
	bash scripts/doctor.sh
