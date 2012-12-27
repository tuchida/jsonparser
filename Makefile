.PHONY: install test

install:
	npm install -d

test:
	node_modules/mocha/bin/mocha \
	  --colors \
	  --reporter spec
