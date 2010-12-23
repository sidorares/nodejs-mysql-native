test:
	@NODE_ENV=test expresso \
		$(TESTFLAGS) \
		tests/*.test.js

.PHONY: test
