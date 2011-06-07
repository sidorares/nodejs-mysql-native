test:
	@NODE_ENV=test expresso -s \
		$(TESTFLAGS) \
		test/*.test.js

.PHONY: test
