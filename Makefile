# ts-gremlin-test/Makefile

default: test o/documentation.lastran

install: o/all-installed.lastran

o/all-installed.lastran: o/maven-installed.lastran o/npm-installed.lastran o/tsd-installed.lastran
	touch $@

clean: clean-maven clean-npm clean-tsd clean-test clean-typescript clean-ts-java clean-doc
	rm -rf o

.PHONY: default install clean test

JAVA_D_TS=typings/java/java.d.ts

### Maven

JAVA_SRC=$(shell find src -name '*.java')

install-maven: o/maven-installed.lastran

o/maven-installed.lastran: pom.xml $(JAVA_SRC) | o
	mvn -DskipTests=true clean package
	touch $@

clean-maven:
	rm -rf target o/maven-installed.lastran

.PHONY: install-maven clean-maven

### Mocha Unit Tests

UNIT_TESTS=$(filter-out %.d.ts, $(wildcard test/*.ts))
UNIT_TEST_OBJS=$(patsubst %.ts,%.js,$(UNIT_TESTS))
UNIT_TEST_RAN=$(patsubst %.ts,o/%.lastran,$(UNIT_TESTS))

$(UNIT_TEST_RAN): o/%.lastran: %.js o/all-installed.lastran
	node_modules/.bin/mocha --timeout 10s --reporter=spec --ui tdd $<
	mkdir -p $(dir $@) && touch $@

test: $(UNIT_TEST_RAN)

test/tinkerpop-test.js : lib/index.js $(JAVA_D_TS)

clean-test:
	rm -f test/*.js test/*.js.map

.PHONY: test clean-test

### NPM

install-npm: o/npm-installed.lastran

o/npm-installed.lastran: | o
	npm install
	touch $@

clean-npm:
	rm -rf node_modules o/npm-installed.lastran

.PHONY: install-npm clean-npm

### TSD

TSD=./node_modules/.bin/tsd

install-tsd: o/tsd-installed.lastran

o/tsd-installed.lastran: o/npm-installed.lastran
	$(TSD) reinstall
	touch $@

update-tsd:
	$(TSD) update -o -s

clean-tsd:
	rm -rf typings o/tsd-installed.lastran

.PHONY: install-tsd update-tsd clean-tsd

### Typescript & Lint

TSC=./node_modules/.bin/tsc
TSC_OPTS=--module commonjs --target ES5 --sourceMap --declaration --noEmitOnError --noImplicitAny

LINT=./node_modules/.bin/tslint
LINT_OPTS=--config tslint.json --file

%.js %.js.map: %.ts o/all-installed.lastran
	($(TSC) $(TSC_OPTS) $< && $(LINT) $(LINT_OPTS) $<) || (rm -f $*.js* && false)

clean-typescript:
	rm -f *.js *.js.map

.PHONY: clean-typescript

lib/index.js: $(JAVA_D_TS)

### ts-java

ts-java: $(JAVA_D_TS)

$(JAVA_D_TS) : o/all-installed.lastran package.json
	node_modules/.bin/ts-java

clean-ts-java:
	rm -f $(JAVA_D_TS)

.PHONY: ts-java java.d.ts

### Documentation

documentation : o/documentation.lastran

o/documentation.lastran : o/npm-installed.lastran README.md lib/index.ts $(UNIT_TESTS) | o
	node_modules/.bin/groc --except "node_modules/**" --except "o/**" --except "**/*.d.ts" lib/index.ts $(UNIT_TESTS) README.md
	touch $@

clean-doc:
	rm -rf doc o/documentation.lastran

.PHONY: documentation clean-doc

### o (output) directory

o :
	mkdir -p o
