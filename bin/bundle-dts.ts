/// <reference path="../typings/dts-bundle/dts-bundle.d.ts"/>

import dts = require('dts-bundle');

dts.bundle({
  name: 'ts-tinkerpop',
  main: 'lib/index.d.ts',
  out: 'bundle.d.ts',
  externals: true
});
