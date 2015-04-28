/// <reference path="../typings/dts-bundle/dts-bundle.d.ts"/>

import dts = require('dts-bundle');

dts.bundle({
  name: 'ts-tinkerpop',
  main: 'lib/ts-tinkerpop.d.ts',
  out: '../o/bundle.d.ts',
  externals: false
});
