.PHONY: test doctor

test:
	python3 -m unittest discover -s tests -p 'test_*.py' -v
	bash tests/test_userscript.sh

doctor:
	bash scripts/doctor.sh
