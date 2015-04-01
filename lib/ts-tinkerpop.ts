/// <reference path='./java.d.ts' />
/// <reference path='../typings/bluebird/bluebird.d.ts' />
/// <reference path='../typings/debug/debug.d.ts' />
/// <reference path='../typings/lodash/lodash.d.ts' />
/// <reference path='../typings/power-assert/power-assert.d.ts' />

import _ = require('lodash');
import _autoImport = require('./autoImport');
import _java = require('redseal-java');
import assert = require('power-assert');
import BluePromise = require('bluebird');
import debug = require('debug');

// # ts-tinkerpop
// Helper functions for Typescript applications using [TinkerPop 3]() via [node-java](https://github.com/joeferner/node-java).
//
// See the README.md for usage notes.

module Tinkerpop {

  'use strict';

  var dlog = debug('ts-tinkerpop');

  // ### autoImport
  export var autoImport = _autoImport;

  // ### Exported variables

  export var java: Java.NodeAPI = _java;

  // #### TinkerPop Classes
  export var __: Java.com.tinkerpop.gremlin.process.graph.traversal.__.Static;
  export var Compare: Java.com.tinkerpop.gremlin.structure.Compare.Static;
  export var GraphSONWriter: Java.com.tinkerpop.gremlin.structure.io.graphson.GraphSONWriter.Static;
  export var GremlinGroovyScriptEngine: Java.com.tinkerpop.gremlin.groovy.jsr223.GremlinGroovyScriptEngine.Static;
  export var ScriptEngineLambda: Java.com.tinkerpop.gremlin.process.computer.util.ScriptEngineLambda.Static;
  export var T: Java.com.tinkerpop.gremlin.process.T.Static;
  export var TinkerFactory: Java.com.tinkerpop.gremlin.tinkergraph.structure.TinkerFactory.Static;
  export var TinkerGraph: Java.com.tinkerpop.gremlin.tinkergraph.structure.TinkerGraph.Static;

  // #### Other Java classes
  export var ByteArrayOutputStream: Java.java.io.ByteArrayOutputStream.Static;
  export var GroovyLambda: Java.co.redseal.gremlinnode.function_.GroovyLambda.Static;

  // #### Useful singleton variables

  // The groovy runtime NULL object.
  export var NULL: Java.org.codehaus.groovy.runtime.NullObject;

  // The UTF8 Charset specifier
  export var UTF8: string;

  // ### Exported Functions

  // #### `initialize()`
  // This function should be called once just after java has been configured.
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
    NULL = java.callStaticMethodSync('org.codehaus.groovy.runtime.NullObject', 'getNullObject');
    ScriptEngineLambda = java.import('com.tinkerpop.gremlin.process.computer.util.ScriptEngineLambda');
    T = java.import('com.tinkerpop.gremlin.process.T');
    TinkerFactory = java.import('com.tinkerpop.gremlin.tinkergraph.structure.TinkerFactory');
    TinkerGraph = java.import('com.tinkerpop.gremlin.tinkergraph.structure.TinkerGraph');
    UTF8 = java.import('java.nio.charset.StandardCharsets').UTF_8.name();

    /// TODO: provide a separate factory class for script engine instances.
    _groovyScriptEngine = new GremlinGroovyScriptEngine();

    dlog('Tinkerpop helper initialized.');
  }

  // #### `id(n: number)`
  // Tinkerpop IDs typically are long (64-bit) integers. Javascript does not support 64-bit integers.
  // There are use cases where leaving the type of an ID unspecified can result in ambiguities between
  // the Java types Integer and Long. To disambigute, use this function.
  export function id(n: number): Java.Object {
    return java.newLong(n);
  }

  // #### `ids(a: number[])`
  // As above, but for creating an array of IDs.
  export function ids(a: number[]) : Java.array_t<Java.Object> {
    return java.newArray('java.lang.Object', _.map(a, (n: number) => id(n)));
  }

  // #### `newJavaScriptLambda(javascript: string)`
  // Creates a lambda function from a javascript string.
  export function newJavaScriptLambda(javascript: string): Java.ScriptEngineLambda {
    return new ScriptEngineLambda(_javaScriptEngineName, javascript);
  };

  // #### `newGroovyLambda(groovyFragment: string)`
  // Creates a lambda function from a groovy code fragment (*not*) a closure string).
  // Lambdas of this form have more overhead than lambdas created with `newGroovyClosure()`.
  export function newGroovyLambda(groovyFragment: string): Java.ScriptEngineLambda {
    // The groovy string here is *not* a closure.
    // It is a code fragment with implicit parameters a,b,c, e.g.: 'println(a)'.
    assert.ok(!_isClosure(groovyFragment));
    return new ScriptEngineLambda(_groovyScriptEngineName, groovyFragment);
  };

  // #### `newGroovyClosure(groovyClosureString: string)`
  // Creates a lambda function from a groovy closure string.
  export function newGroovyClosure(groovyClosureString: string): Java.GroovyLambda {
    // The groovy string must be a closure expression, e.g. '{ x -> println(x) }'.
    assert.ok(_isClosure(groovyClosureString));
    return new GroovyLambda(groovyClosureString, _groovyScriptEngine);
  };

  // ### `getGroovyEngine()`
  // Returns the Groovy engine used by `newGroovyLambda` and `newGroovyClosure`.
  export function getGroovyEngine(): Java.GremlinGroovyScriptEngine {
    return _groovyScriptEngine;
  }

  // ### `importGroovy(pkgOrClass: string)`
  // Imports a Java package or class, based on fully-qualified wildcard or class name.  This affects the operation of
  // `newGroovyClosure` but does NOT affect `newGroovyLambda`.
  export function importGroovy(javaClassOrPkg: string): void {
    var engine = getGroovyEngine();
    var HashSet: Java.HashSet.Static = autoImport('HashSet');
    var imports: Java.HashSet = new HashSet();
    imports.add('import ' + javaClassOrPkg);
    engine.addImports(imports);
  }

  // #### `vertexStringify(vertex: Java.Vertex)`
  // Converts a Tinkerpop Vertex to a string representation.
  // See also `vertexToJson` below.
  export function vertexStringify(vertex: Java.Vertex): string {
    var stream: Java.ByteArrayOutputStream = new ByteArrayOutputStream();
    var builder: Java.GraphSONWriter$Builder = GraphSONWriter.build();
    var writer: Java.GraphSONWriter = builder.create();
    writer.writeVertex(stream, vertex);
    return stream.toString(UTF8);
  }

  // #### `vertexToJson(vertex: Java.Vertex)`
  // Converts a Tinkerpop Vertex to a javascript (json) object.
  export function vertexToJson(vertex: Java.Vertex): any {
    return JSON.parse(vertexStringify(vertex));
  }

  // #### `function edgeStringify(edge: Java.Edge)`
  // Converts a Tinkerpop Edge to a string representation.
  // See also `edgeToJson` below.
  export function edgeStringify(edge: Java.Edge): string {
    var stream: Java.ByteArrayOutputStream = new ByteArrayOutputStream();
    var builder: Java.GraphSONWriter$Builder = GraphSONWriter.build();
    var writer: Java.GraphSONWriter = builder.create();
    writer.writeEdge(stream, edge);
    return stream.toString(UTF8);
  };

  // #### `function edgeToJson(edge: Java.Edge)`
  // Converts a Tinkerpop Edge to a javascript (json) object.
  export function edgeToJson(edge: Java.Edge): any {
    return JSON.parse(edgeStringify(edge));
  };

  // #### `function isJavaObject(e: any)`
  // Returns true if the obj is a Java object.
  // Useful for determining the runtime type of object_t returned by many java methods.
  export function isJavaObject(e: any): boolean {
    return java.instanceOf(e, 'java.lang.Object');
  }

  // #### `function asJavaObject(obj: Java.object_t)`
  // Useful for when in a given context an application expects that an object_t really is a Java.Object,
  // but for defensive programming purposes wants to do the runtime check rather than a simple cast.
  export function asJavaObject(obj: Java.object_t): Java.Object {
    if (isJavaObject(obj)) {
      return <Java.Object> obj;
    } else {
      throw new Error('asJavaObject given an object that is not a Java.Object');
    }
  }

  // #### `function isVertex(v: any)`
  // Returns true if v is a Tinkerpop Vertex.
  export function isVertex(v: any): boolean {
    return java.instanceOf(v, 'com.tinkerpop.gremlin.structure.Vertex');
  }

  // #### `function asVertex(v: Java.object_t)`
  // Useful for when in a given context an application expects that an object_t really is a Java.Vertex,
  // but for defensive programming purposes wants to do the runtime check rather than a simple cast.
  export function asVertex(v: Java.object_t): Java.Vertex {
    if (isVertex(v)) {
      return <Java.Vertex> v;
    } else {
      throw new Error('asVertex given an object that is not a Vertex');
    }
  }

  // #### `function isEdge(e: any)`
  // Returns true if e is a Tinkerpop Edge.
  export function isEdge(e: any): boolean {
    return java.instanceOf(e, 'com.tinkerpop.gremlin.structure.Edge');
  }

  // #### `function asEdge(e: Java.object_t)`
  // Useful for when in a given context an application expects that an object_t really is a Java.Edge,
  // but for defensive programming purposes wants to do the runtime check rather than a simple cast.
  export function asEdge(e: Java.object_t): Java.Edge {
    if (isEdge(e)) {
      return <Java.Edge> e;
    } else {
      throw new Error('asEdge given an object that is not an Edge');
    }
  }

  // #### `interface ConsumeObject`
  // A function interface for Java Object consumer.
  // See `forEach` below.
  export interface ConsumeObject {
    (item: Java.Object): BluePromise<void>;
  }

  // #### `forEach(javaIterator: Java.Iterator, consumer: ConsumeObject)`
  // Applies *consumer* to each Java.Object returned by the *javaIterator*.
  // *javaIterator* may be any type that implements java.util.Iterator, including a tinkerpop Traversal.
  // *consumer* is function that will do some work on a Java.Object asychronously, returning a Promise for its completion.
  // Returns a promise that is resolved when all objects have been consumed.
  export function forEach(javaIterator: Java.Iterator, consumer: ConsumeObject): BluePromise<void> {
    function _eachIterator(javaIterator: Java.Iterator, consumer: ConsumeObject): BluePromise<void> {
      return javaIterator.hasNextP()
        .then((hasNext: boolean): BluePromise<void> => {
          if (!hasNext) {
            dlog('forEach: done');
            return BluePromise.resolve();
          } else {
            return javaIterator.nextP()
              .then((obj: Java.Object) => { dlog('forEach: consuming'); return consumer(obj); })
              .then(() => { dlog('forEach: recursing'); return _eachIterator(javaIterator, consumer); });
          }
        });
    }
    return _eachIterator(javaIterator, consumer);
  }

  // #### `function asJSON(traversal: Java.Traversal)`
  // Executes a traversal (synchronously!), returning a json object for all of the returned objects.
  export function asJSON(traversal: Java.Traversal): any {
    var array: any[] = traversal.toList().toArray().map((elem: any) => _asJSON(elem));
    return JSON.parse(JSON.stringify(array));
  };

  // #### `function simplifyVertexProperties(obj: any)`
  // Given *obj* which is a javascript object created by asJSON(),
  // return a simpler representation of the object that is more convenient for unit tests.
  export function simplifyVertexProperties(obj: any): any {
    if (_.isArray(obj)) {
      return _.map(obj, simplifyVertexProperties);
    }

    obj.properties = _.mapValues(obj.properties, (propValue: any) => {
      var values = _.pluck(propValue, 'value');
      return (values.length === 1) ? values[0] : values;
    });
    return obj;
  };

  // ### Non-exported Functions

  // #### `function _isClosure(val: string)`
  // Returns true if the string *smells* like a groovy closure.
  function _isClosure(val: string): boolean {
    var closureRegex = /^\{.*\}$/;
    return _.isString(val) && val.search(closureRegex) > -1;
  };

  // #### `function _asJSON(elem: any)`
  // A utility function used by `asJSONSync`.
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
      // Handle Edge
      return edgeToJson(asEdge(elem));

    } else if (isJavaObject(elem)) {
      // If we still have an unrecognized Java object, convert it to a string.
      var javaObj: Java.Object = <Java.Object> elem;
      return {'javaClass': javaObj.getClass().getName(), 'toString': javaObj.toString()};

    } else if ('toJSON' in elem) {
      // If we have a 'toJSON' method, use it.
      return elem;

    } else {
      // Recursively convert any other kind of object.
      return _.mapValues(elem, (value: any) => _asJSON(value));
    }
  }

  // ### Non-exported variables
  var _groovyScriptEngineName: string = 'Groovy';
  var _javaScriptEngineName: string = 'JavaScript';
  var _groovyScriptEngine: Java.com.tinkerpop.gremlin.groovy.jsr223.GremlinGroovyScriptEngine;

}

export = Tinkerpop;
