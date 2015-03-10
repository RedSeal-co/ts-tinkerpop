/// <reference path='typings/bluebird/bluebird.d.ts' />
/// <reference path='typings/debug/debug.d.ts' />
/// <reference path='typings/java/java.d.ts' />
/// <reference path='typings/lodash/lodash.d.ts' />
/// <reference path='typings/power-assert/power-assert.d.ts' />

import _ = require('lodash');
import assert = require('power-assert');
import BluePromise = require('bluebird');
import debug = require('debug');
import java = require('java');

module Tinkerpop {

  'use strict';

  var dlog = debug('ts-tinkerpop:index');

  export var __: Java.com.tinkerpop.gremlin.process.graph.traversal.__.Static;
  export var ByteArrayOutputStream: Java.java.io.ByteArrayOutputStream.Static;
  export var Compare: Java.com.tinkerpop.gremlin.structure.Compare.Static;
  export var GraphSONWriter: Java.com.tinkerpop.gremlin.structure.io.graphson.GraphSONWriter.Static;
  export var GremlinGroovyScriptEngine: Java.com.tinkerpop.gremlin.groovy.jsr223.GremlinGroovyScriptEngine.Static;
  export var GroovyLambda: Java.co.redseal.gremlinnode.function_.GroovyLambda.Static;
  export var noargs: Java.array_t<Java.String>;
  export var NULL: Java.org.codehaus.groovy.runtime.NullObject;
  export var ScriptEngineLambda: Java.com.tinkerpop.gremlin.process.computer.util.ScriptEngineLambda.Static;
  export var T: Java.com.tinkerpop.gremlin.process.T.Static;
  export var TinkerFactory: Java.com.tinkerpop.gremlin.tinkergraph.structure.TinkerFactory.Static;
  export var TinkerGraph: Java.com.tinkerpop.gremlin.tinkergraph.structure.TinkerGraph.Static;
  export var UTF8: string;

  var _groovyScriptEngine: Java.com.tinkerpop.gremlin.groovy.jsr223.GremlinGroovyScriptEngine;

  // ### *initialize()* should be called once just after java has been configured.
  // Java configuration includes classpath, options, and asyncOptions.
  // If this method is called before configuration, the java.import calls will likely
  // fail due to the classes not being on the classpath.
  // This method must be called before any of the exported vars above are accessed.
  // It is wasteful, but not an error, to call this method more than once.
  export function initialize() {
    __ = java.import('com.tinkerpop.gremlin.process.graph.traversal.__');
    ByteArrayOutputStream = java.import('java.io.ByteArrayOutputStream');
    Compare = java.import('com.tinkerpop.gremlin.structure.Compare');
    GraphSONWriter = java.import('com.tinkerpop.gremlin.structure.io.graphson.GraphSONWriter');
    GremlinGroovyScriptEngine = java.import('com.tinkerpop.gremlin.groovy.jsr223.GremlinGroovyScriptEngine');
    GroovyLambda = java.import('co.redseal.gremlinnode.function.GroovyLambda');
    noargs = java.newArray<Java.String>('java.lang.String', []);
    NULL = java.callStaticMethodSync('org.codehaus.groovy.runtime.NullObject', 'getNullObject');
    ScriptEngineLambda = java.import('com.tinkerpop.gremlin.process.computer.util.ScriptEngineLambda');
    T = java.import('com.tinkerpop.gremlin.process.T');
    TinkerFactory = java.import('com.tinkerpop.gremlin.tinkergraph.structure.TinkerFactory');
    TinkerGraph = java.import('com.tinkerpop.gremlin.tinkergraph.structure.TinkerGraph');
    UTF8 = java.import('java.nio.charset.StandardCharsets').UTF_8.nameSync();

    // TODO: provide a separate factory class for script engine instances.
    _groovyScriptEngine = new GremlinGroovyScriptEngine();

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
    return new ScriptEngineLambda(_javaScriptEngineName, javascript);
  };

  export function newGroovyLambda(groovyFragment: string): Java.ScriptEngineLambda {
    // The groovy string here is *not* a closure
    // It is a code fragment with implicit parameters a,b,c, e.g.: 'println(a)'
    assert.ok(!_isClosure(groovyFragment));
    return new ScriptEngineLambda(_groovyScriptEngineName, groovyFragment);
  };

  function _isClosure(val: string): boolean {
    var closureRegex = /^\{.*\}$/;
    return _.isString(val) && val.search(closureRegex) > -1;
  };

  export function newGroovyClosure(groovyClosureString: string): Java.GroovyLambda {
    // The groovy string must be a closure expression, e.g. '{ x -> println(x) }'.
    assert.ok(_isClosure(groovyClosureString));
    return new GroovyLambda(groovyClosureString, _groovyScriptEngine);
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

  export function edgeStringify(edge: Java.Edge): string {
    var stream: Java.ByteArrayOutputStream = new ByteArrayOutputStream();
    var builder: Java.GraphSONWriter$Builder = GraphSONWriter.buildSync();
    var writer: Java.GraphSONWriter = builder.createSync();
    writer.writeEdgeSync(stream, edge);
    return stream.toStringSync(UTF8);
  };

  export function edgeToJson(edge: Java.Edge): any {
    return JSON.parse(edgeStringify(edge));
  };

  export function isJavaObject(e: any): boolean {
    return java.instanceOf(e, 'java.lang.Object');
  }

  export function asJavaObject(obj: Java.object_t): Java.Object {
    if (isJavaObject(obj)) {
      return <Java.Object> obj;
    } else {
      throw new Error('asJavaObject given an object that is not a Java.Object');
    }
  }

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
  }

  function _asJSON(elem: any): any {
    if (!_.isObject(elem)) {
      // Scalars should stay that way.
      return elem;

    } else if (_.isArray(elem)) {
      // Arrays must be recursively converted.
      return elem.map((e: any) => _asJSON(e));

    } else if (isVertex(elem)) {
      // Handle Vertex
      return vertexToJson(asVertex(elem));

    } else if (isEdge(elem)) {
      // Handle Vertex
      return edgeToJson(asEdge(elem));

    } else if (isJavaObject(elem)) {
      // If we still have an unrecognized Java object, convert it to a string.
      var javaObj: Java.Object = <Java.Object> elem;
      return {'javaClass': javaObj.getClassSync().getNameSync(), 'toString': javaObj.toStringSync()};

    } else if ('toJSON' in elem) {
      // If we have a 'toJSON' method, use it.
      return elem;

    } else {
      // Recursively convert any other kind of object.
      return _.mapValues(elem, (value: any) => _asJSON(value));
    }
  }

  export function asJSONSync(traversal: Java.Traversal): any {
    var array: any[] = traversal.toListSync().toArraySync().map((elem: any) => _asJSON(elem));
    return JSON.parse(JSON.stringify(array));
  };

  var _groovyScriptEngineName: string = 'Groovy';
  var _javaScriptEngineName: string = 'JavaScript';
}

export = Tinkerpop;
