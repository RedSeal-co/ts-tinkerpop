/// <reference path='typings/debug/debug.d.ts' />
/// <reference path='typings/java/java.d.ts' />
/// <reference path='typings/lodash/lodash.d.ts' />

import _ = require('lodash');
import java = require('java');
import debug = require('debug');

module Tinkerpop {

  'use strict';

  var dlog = debug('ts-tinkerpop');

  export var __: Java.com.tinkerpop.gremlin.process.graph.traversal.__.Static;
  export var ByteArrayOutputStream: Java.java.io.ByteArrayOutputStream.Static;
  export var GraphSONWriter: Java.com.tinkerpop.gremlin.structure.io.graphson.GraphSONWriter.Static;
  export var GroovyLambda: Java.co.redseal.gremlinnode.function_.GroovyLambda.Static;
  export var noargs: Java.array_t<Java.String>;
  export var NULL: Java.org.codehaus.groovy.runtime.NullObject;
  export var ScriptEngineLambda: Java.com.tinkerpop.gremlin.process.computer.util.ScriptEngineLambda.Static;
  export var T: Java.com.tinkerpop.gremlin.process.T.Static;
  export var TinkerFactory: Java.com.tinkerpop.gremlin.tinkergraph.structure.TinkerFactory.Static;
  export var TinkerGraph: Java.com.tinkerpop.gremlin.tinkergraph.structure.TinkerGraph.Static;
  export var UTF8: string;

  // ### *initialize()* should be called once just after java has been configured.
  // Java configuration includes classpath, options, and asyncOptions.
  // If this method is called before configuration, the java.import calls will likely
  // fail due to the classes not being on the classpath.
  // This method must be called before any of the exported vars above are accessed.
  // It is wasteful, but not an error, to call this method more than once.
  export function initialize() {
    __ = java.import('com.tinkerpop.gremlin.process.graph.traversal.__');
    ByteArrayOutputStream = java.import('java.io.ByteArrayOutputStream');
    GraphSONWriter = java.import('com.tinkerpop.gremlin.structure.io.graphson.GraphSONWriter');
    GroovyLambda = java.import('co.redseal.gremlinnode.function.GroovyLambda');
    noargs = java.newArray<Java.String>('java.lang.String', []);
    NULL = java.callStaticMethodSync('org.codehaus.groovy.runtime.NullObject', 'getNullObject');
    ScriptEngineLambda = java.import('com.tinkerpop.gremlin.process.computer.util.ScriptEngineLambda');
    T = java.import('com.tinkerpop.gremlin.process.T');
    TinkerFactory = java.import('com.tinkerpop.gremlin.tinkergraph.structure.TinkerFactory');
    TinkerGraph = java.import('com.tinkerpop.gremlin.tinkergraph.structure.TinkerGraph');
    UTF8 = java.import('java.nio.charset.StandardCharsets').UTF_8.nameSync();
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

  export function newJavaScriptLambda(javascript: string): Java.ScriptEngineLambda {
    return new ScriptEngineLambda(_javaScriptEngineName, javascript);   //
  };

  export function newGroovyLambda(groovy: string): Java.ScriptEngineLambda {
    return new ScriptEngineLambda(_groovyScriptEngineName, groovy);
  };

  export function vertexStringify(vertex: Java.Vertex): string {
    var stream: Java.ByteArrayOutputStream = new ByteArrayOutputStream();
    var builder: Java.GraphSONWriter$Builder = GraphSONWriter.buildSync();
    var writer: Java.GraphSONWriter = builder.createSync();
    writer.writeVertexSync(stream, vertex);
    return stream.toStringSync(UTF8);
  }

  export function vertexToJson(vertex: Java.Vertex): any {
    return JSON.parse(vertexStringify(vertex));
  }

  export function asVertex(v: Java.object_t): Java.Vertex {
    if (java.instanceOf(v, 'com.tinkerpop.gremlin.structure.Vertex')) {
      return <Java.Vertex> v;
    } else {
      throw new Error('asVertex given an object that is not a Vertex');
    }
  }

  var _groovyScriptEngineName: string = 'Groovy';
  var _javaScriptEngineName: string = 'JavaScript';
}

export = Tinkerpop;
