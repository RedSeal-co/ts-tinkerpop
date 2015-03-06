/// <reference path='typings/bluebird/bluebird.d.ts' />
/// <reference path='typings/debug/debug.d.ts' />
/// <reference path='typings/java/java.d.ts' />
/// <reference path='typings/lodash/lodash.d.ts' />

import _ = require('lodash');
import BluePromise = require('bluebird');
import debug = require('debug');
import java = require('java');

module Tinkerpop {

  'use strict';

  var dlog = debug('ts-tinkerpop:index');

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
    dlog('Tinkerpop helper initialized.');
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

  export function edgeStringify(edge: Java.Edge) {
    var stream: Java.ByteArrayOutputStream = new ByteArrayOutputStream();
    var builder: Java.GraphSONWriter$Builder = GraphSONWriter.buildSync();
    var writer: Java.GraphSONWriter = builder.createSync();
    writer.writeEdgeSync(stream, edge);
    return stream.toStringSync(UTF8);
  };

  export function edgeToJson(edge: Java.Edge): any {
    return JSON.parse(edgeStringify(edge));
  };

  export function isVertex(v: any): boolean {
    return java.instanceOf(v, 'com.tinkerpop.gremlin.structure.Vertex');
  }

  export function asVertex(v: Java.object_t): Java.Vertex {
    if (isVertex(v)) {
      return <Java.Vertex> v;
    } else {
      throw new Error('asVertex given an object that is not a Vertex');
    }
  }

  export function isEdge(e: any): boolean {
    return java.instanceOf(e, 'com.tinkerpop.gremlin.structure.Edge');
  }

  export function asEdge(e: Java.object_t): Java.Edge {
    if (isEdge(e)) {
      return <Java.Edge> e;
    } else {
      throw new Error('asEdge given an object that is not an Edge');
    }
  }

  interface ConsumeObject {
    (item: Java.Object): BluePromise<void>;
  }

  // Applies *consumer* to each Java.Object returned by the *javaIterator*.
  // *javaIterator* may be any type that implements java.util.Iterator, including a tinkerpop Traversal.
  // *consumer* is function that will do some work on a Java.Object asychronously, returning a Promise for its completion.
  // Returns a promise that is resolved when all objects have been consumed.
  export function forEach(javaIterator: Java.Iterator, consumer: ConsumeObject): BluePromise<void> {
    function _eachIterator(javaIterator: Java.Iterator, consumer: ConsumeObject): BluePromise<void> {
      return javaIterator.hasNextPromise()
        .then((hasNext: boolean): BluePromise<void> => {
          if (!hasNext) {
            dlog('forEach: done');
            return BluePromise.resolve();
          } else {
            return javaIterator.nextPromise()
              .then((obj: Java.Object) => { dlog('forEach: consuming'); return consumer(obj); })
              .then(() => { dlog('forEach: recursing'); return _eachIterator(javaIterator, consumer); });
          }
        });
    }
    return _eachIterator(javaIterator, consumer);
};

  var _groovyScriptEngineName: string = 'Groovy';
  var _javaScriptEngineName: string = 'JavaScript';
}

export = Tinkerpop;
