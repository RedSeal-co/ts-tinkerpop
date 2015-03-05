/// <reference path='typings/java/java.d.ts' />
/// <reference path='typings/lodash/lodash.d.ts' />

import _ = require('lodash');
import java = require('java');

module J {

  'use strict';

  export var __: Java.com.tinkerpop.gremlin.process.graph.traversal.__.Static;
  export var noargs: Java.array_t<Java.String>;
  export var NULL: Java.org.codehaus.groovy.runtime.NullObject;
  export var T: Java.T.Static;
  export var TinkerFactory: Java.com.tinkerpop.gremlin.tinkergraph.structure.TinkerFactory.Static;
  export var TinkerGraph: Java.com.tinkerpop.gremlin.tinkergraph.structure.TinkerGraph.Static;

  // ### *initialize()* should be called once just after java has been configured.
  // Java configuration includes classpath, options, and asyncOptions.
  // If this method is called before configuration, the java.import calls will likely
  // fail due to the classes not being on the classpath.
  // This method must be called before any of the exported vars above are accessed.
  // It is wasteful, but not an error, to call this method more than once.
  export function initialize() {
    __ = java.import('com.tinkerpop.gremlin.process.graph.traversal.__');
    noargs = java.newArray<Java.String>('java.lang.String', []);
    NULL = java.callStaticMethodSync('org.codehaus.groovy.runtime.NullObject', 'getNullObject');
    T = java.import('com.tinkerpop.gremlin.process.T');
    TinkerFactory = java.import('com.tinkerpop.gremlin.tinkergraph.structure.TinkerFactory');
    TinkerGraph = java.import('com.tinkerpop.gremlin.tinkergraph.structure.TinkerGraph');
  }

  export function id(n: number): Java.Object {
    return java.newLong(n);
  }

  export function ids(a: number[]) : Java.array_t<Java.Object> {
    return java.newArray('java.lang.Object', _.map(a, (n: number) => id(n)));
  }

  export function S(strs: string[]) : Java.array_t<Java.String> {
    return java.newArray<Java.String>('java.lang.String', strs);
  }
}

export = J;
