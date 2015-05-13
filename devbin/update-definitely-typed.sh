#! /bin/bash

: ${TSD_HOME=../DefinitelyTyped}

if [ ! -d "$TSD_HOME" ]; then
  echo 'TSD_HOME must be set to the location of the local git DefinitelyTyped workspace'
  exit 1
fi

if [ ! -d "$TSD_HOME/ts-tinkerpop/" ]; then
  echo 'Not found: $TSD_HOME/ts-tinkerpop/'
  exit 1
fi

./node_modules/.bin/hb-interpolate -j package.json -t devbin/ts-tinkerpop.header > o/ts-tinkerpop.d.ts.header
cat o/ts-tinkerpop.d.ts.header typings/ts-tinkerpop/index.d.ts > "$TSD_HOME/ts-tinkerpop/ts-tinkerpop.d.ts"

./node_modules/.bin/hb-interpolate -j package.json -t devbin/java.header > o/java.d.ts.header
cat o/java.d.ts.header typings/ts-tinkerpop/java.d.ts > "$TSD_HOME/ts-tinkerpop/java.d.ts"

echo "**** $TSD_HOME/ts-tinkerpop has been updated. YOU MUST NOW COMMIT AND PUSH THE CHANGES! ****"
