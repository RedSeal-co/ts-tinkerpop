# ts-gremlin-test/Makefile

default: test

install: o/all-installed.lastran

o/all-installed.lastran: o/maven-installed.lastran o/npm-installed.lastran o/tsd-installed.lastran
	mkdir -p $(dir $@) && touch $@

clean: clean-maven clean-npm clean-tsd clean-test clean-typescript clean-ts-java

.PHONY: default install clean test

JAVA_D_TS=typings/java/java.d.ts

### Maven

install-maven: o/maven-installed.lastran

o/maven-installed.lastran: pom.xml
	mvn clean package
	mkdir -p $(dir $@) && touch $@

clean-maven:
	rm -rf target o/maven-installed.lastran

.PHONY: install-maven clean-maven

### Mocha Unit Tests

UNIT_TESTS=$(filter-out %.d.ts, $(wildcard test/*.ts))
UNIT_TEST_OBJS=$(patsubst %.ts,%.js,$(UNIT_TESTS))
UNIT_TEST_RAN=$(patsubst %.ts,o/%.lastran,$(UNIT_TESTS))

$(UNIT_TEST_RAN): o/%.lastran: %.js o/all-installed.lastran
	node_modules/.bin/mocha --timeout 5s --reporter=spec --ui tdd $<
	mkdir -p $(dir $@) && touch  $@

test: $(UNIT_TEST_RAN)

test/gremlin-test.js : index.js $(JAVA_D_TS)

clean-test:
	rm -f test/*.js test/*.js.map

.PHONY: test clean-test

### NPM

install-npm: o/npm-installed.lastran

o/npm-installed.lastran:
	npm install
	mkdir -p $(dir $@) && touch $@

clean-npm:
	rm -rf node_modules o/npm-installed.lastran

.PHONY: install-npm clean-npm

### TSD

TSD=./node_modules/.bin/tsd

install-tsd: o/tsd-installed.lastran

o/tsd-installed.lastran: o/npm-installed.lastran
	$(TSD) reinstall
	mkdir -p $(dir $@) && touch $@

update-tsd:
	$(TSD) update -o -s

clean-tsd:
	rm -rf typings o/tsd-installed.lastran

.PHONY: install-tsd update-tsd clean-tsd

### Typescript & Lint

TSC=./node_modules/.bin/tsc
TSC_OPTS=--module commonjs --target ES5 --sourceMap --noEmitOnError --noImplicitAny

%.js: %.ts o/all-installed.lastran
	$(TSC) $(TSC_OPTS) $< || (rm -f $@ && false)
	stat $@ > /dev/null
	node_modules/tslint/bin/tslint --config tslint.json --file $<

clean-typescript:
	rm -f *.js *.js.map

.PHONY: clean-typescript

index.js: $(JAVA_D_TS)

### ts-java

ts-java: $(JAVA_D_TS)

$(JAVA_D_TS) : o/all-installed.lastran package.json
	node_modules/.bin/ts-java

clean-ts-java:
	rm -f $(JAVA_D_TS)

.PHONY: ts-java java.d.ts


