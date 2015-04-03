/// <reference path='./java.d.ts' />
/// <reference path='../typings/bluebird/bluebird.d.ts' />
/// <reference path='../typings/debug/debug.d.ts' />
/// <reference path='../typings/glob/glob.d.ts' />
/// <reference path='../typings/json-stable-stringify/json-stable-stringify.d.ts' />
/// <reference path='../typings/lodash/lodash.d.ts' />
/// <reference path='../typings/node/node.d.ts' />
/// <reference path='../typings/power-assert/power-assert.d.ts' />

import _ = require('lodash');
import _autoImport = require('./autoImport');
import _java = require('redseal-java');
import assert = require('power-assert');
import BluePromise = require('bluebird');
import debug = require('debug');
import fs = require('fs');
import glob = require('glob');
import jsonStableStringify = require('json-stable-stringify');

var dlog = debug('ts-tinkerpop');

// # ts-tinkerpop
// Helper functions for Typescript applications using [TinkerPop 3]() via [node-java](https://github.com/joeferner/node-java).
//
// See the README.md for usage notes.

module Tinkerpop {

  'use strict';

  export type Static = typeof Tinkerpop;

  // ### autoImport
  export var autoImport = _autoImport;

  // ### Exported variables

  export var java: Java.NodeAPI = _java;

  // #### TinkerPop Classes
  export var __: Java.__.Static;
  export var Compare: Java.Compare.Static;
  export var GraphSONReader: Java.GraphSONReader.Static;
  export var GraphSONWriter: Java.GraphSONWriter.Static;
  export var GraphSONMapper: Java.GraphSONMapper.Static;
  export var GremlinGroovyScriptEngine: Java.GremlinGroovyScriptEngine.Static;
  export var ScriptEngineLambda: Java.ScriptEngineLambda.Static;
  export var T: Java.T.Static;
  export var TinkerFactory: Java.TinkerFactory.Static;
  export var TinkerGraph: Java.TinkerGraph.Static;

  // #### Other Java classes
  export var ByteArrayOutputStream: Java.ByteArrayOutputStream.Static;
  export var GroovyLambda: Java.GroovyLambda.Static;

  // #### Useful singleton variables

  // The groovy runtime NULL object.
  export var NULL: Java.NullObject;

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
    __ = autoImport('__');
    ByteArrayOutputStream = autoImport('ByteArrayOutputStream');
    Compare = autoImport('Compare');
    GraphSONReader = autoImport('GraphSONReader');
    GraphSONWriter = autoImport('GraphSONWriter');
    GraphSONMapper = autoImport('GraphSONMapper');
    GremlinGroovyScriptEngine = autoImport('GremlinGroovyScriptEngine');
    GroovyLambda =
      java.import('co.redseal.gremlinnode.function.GroovyLambda');  // TODO: Use autoImport when #91309036 fixed
    NULL = autoImport('NullObject').getNullObject();
    ScriptEngineLambda = autoImport('ScriptEngineLambda');
    T = autoImport('T');
    TinkerFactory = autoImport('TinkerFactory');
    TinkerGraph = autoImport('TinkerGraph');
    UTF8 = autoImport('StandardCharsets').UTF_8.name();

    /// TODO: provide a separate factory class for script engine instances.
    _groovyScriptEngine = new GremlinGroovyScriptEngine();

    dlog('Tinkerpop helper initialized.');
  }

  export function getTinkerpop(): BluePromise<Static> {
    return _java.ensureJvm().then(() => Tinkerpop);
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

  // ## GraphSON API

  export interface GraphCallback {
    (err: Error, graph: Java.Graph): any;
  }

  // ### `loadGraphSON(graph: Java.Graph, filename: string)`
  // Loads the graph as GraphSON, and returns promise to the graph (for fluent API).
  export function loadGraphSON(graph: Java.Graph, filename: string, callback?: GraphCallback): BluePromise<Java.Graph> {
    var FileInputStream: Java.FileInputStream.Static = autoImport('FileInputStream');
    var stream: Java.FileInputStream = new FileInputStream(filename);
    return GraphSONReader.buildP()
      .then((builder: Java.GraphSONReader$Builder): BluePromise<Java.GraphSONReader$Builder> => {
        return _newGraphSONMapper()
          .then((mapper: Java.GraphSONMapper): BluePromise<Java.GraphSONReader$Builder> => builder.mapperP(mapper));
      })
      .then((builder: Java.GraphSONReader$Builder): BluePromise<Java.GraphSONReader> => builder.createP())
      .then((reader: Java.GraphSONReader): BluePromise<void> => reader.readGraphP(stream, graph))
      .then((): Java.Graph => graph)
      .nodeify(callback);
  }

  // ### `loadGraphSONSync(graph: Java.Graph, filename: string)`
  // Loads the graph as GraphSON, and returns the graph (for fluent API).
  export function loadGraphSONSync(graph: Java.Graph, filename: string): Java.Graph {
    var FileInputStream: Java.FileInputStream.Static = autoImport('FileInputStream');
    var stream: Java.FileInputStream = new FileInputStream(filename);
    var builder: Java.GraphSONReader$Builder = GraphSONReader.build();
    var mapper: Java.GraphSONMapper = _newGraphSONMapperSync();
    builder.mapper(mapper);
    var reader: Java.GraphSONReader = builder.create();
    reader.readGraph(stream, graph);
    return graph;
  }

  // ### `saveGraphSON(graph: Java.Graph, filename: string)`
  // Saves the graph as GraphSON, and returns promise to the graph.
  export function saveGraphSON(graph: Java.Graph, filename: string, callback?: GraphCallback): BluePromise<Java.Graph> {
    var FileOutputStream: Java.FileOutputStream.Static = autoImport('FileOutputStream');
    var stream: Java.FileOutputStream = new FileOutputStream(filename);
    return GraphSONWriter.buildP()
      .then((builder: Java.GraphSONWriter$Builder): BluePromise<Java.GraphSONWriter$Builder> => {
        return _newGraphSONMapper()
          .then((mapper: Java.GraphSONMapper): BluePromise<Java.GraphSONWriter$Builder> => builder.mapperP(mapper));
      })
      .then((builder: Java.GraphSONWriter$Builder): BluePromise<Java.GraphSONWriter> => builder.createP())
      .then((writer: Java.GraphSONWriter): BluePromise<void> => writer.writeGraphP(stream, graph))
      .then((): Java.Graph => graph)
      .nodeify(callback);
  }

  // ### `saveGraphSONSync(graph: Java.Graph, filename: string)`
  // Saves the graph as GraphSON, and returns the graph (for fluent API).
  export function saveGraphSONSync(graph: Java.Graph, filename: string): Java.Graph {
    var FileOutputStream: Java.FileOutputStream.Static = autoImport('FileOutputStream');
    var stream: Java.FileOutputStream = new FileOutputStream(filename);
    var builder: Java.GraphSONWriter$Builder = GraphSONWriter.build();
    var mapper: Java.GraphSONMapper = _newGraphSONMapperSync();
    builder.mapper(mapper);
    var writer: Java.GraphSONWriter = builder.create();
    writer.writeGraph(stream, graph);
    return graph;
  }

  // ### `savePrettyGraphSON(graph: Java.Graph, filename: string)`
  // Saves the graph as human-readable, deterministic GraphSON, and returns promise to the graph (for fluent API).
  export
  function savePrettyGraphSON(graph: Java.Graph, filename: string, callback?: GraphCallback): BluePromise<Java.Graph> {
    var ByteArrayOutputStream: Java.ByteArrayOutputStream.Static = autoImport('ByteArrayOutputStream');
    var stream: Java.ByteArrayOutputStream = new ByteArrayOutputStream();
    return GraphSONWriter.buildP()
      .then((builder: Java.GraphSONWriter$Builder): BluePromise<Java.GraphSONWriter$Builder> => {
        return _newGraphSONMapper()
          .then((mapper: Java.GraphSONMapper): BluePromise<Java.GraphSONWriter$Builder> => builder.mapperP(mapper));
      })
      .then((builder: Java.GraphSONWriter$Builder): BluePromise<Java.GraphSONWriter> => builder.createP())
      .then((writer: Java.GraphSONWriter): BluePromise<void> => writer.writeGraphP(stream, graph))
      .then((): BluePromise<string> => stream.toStringP())
      .then((ugly: string): BluePromise<void> => {
        var prettyString: string = _prettyGraphSONString(ugly);
        var writeFileP = BluePromise.promisify(fs.writeFile);
        return writeFileP(filename, prettyString);
      })
      .then((): Java.Graph => graph)
      .nodeify(callback);
  }

  // ### `savePrettyGraphSONSync(graph: Java.Graph, filename: string)`
  // Saves the graph as human-readable, deterministic GraphSON, and returns the graph (for fluent API).
  export function savePrettyGraphSONSync(graph: Java.Graph, filename: string): Java.Graph {
    // Build the GraphSON in memory in Java.
    var ByteArrayOutputStream: Java.ByteArrayOutputStream.Static = autoImport('ByteArrayOutputStream');
    var stream: Java.ByteArrayOutputStream = new ByteArrayOutputStream();
    var builder: Java.GraphSONWriter$Builder = GraphSONWriter.build();
    var mapper: Java.GraphSONMapper = _newGraphSONMapperSync();
    builder.mapper(mapper);
    var writer: Java.GraphSONWriter = builder.create();
    writer.writeGraph(stream, graph);

    // Beautify the JSON.
    var uglyString: string = stream.toString();
    var prettyString: string = _prettyGraphSONString(uglyString);

    // Write to the file.
    fs.writeFileSync(filename, prettyString);
    return graph;
  }

  // ### `isType(o: any, typeName: string)`
  export function isType(o: any, typeName: string): boolean {
    if (!o || !_.isObject(o)) return false;
    try {
      return java.instanceOf(o, typeName);
    } catch (err) {
      return false;
    }
  }

  // ### `jsify(arg: any)`
  // Convert certain Java containers into JavaScript equivalents:
  // - List: any[]
  // - Map: any
  // - BulkSet: BulkSetElement[]
  export function jsify(arg: any): any {
    if (!_.isObject(arg)) {
      return arg;
    }

    if (isType(arg, 'java.util.List')) {
      return _jsifyList(<Java.List> arg);
    } else if (isType(arg, 'java.util.Map')) {
      return _jsifyMap(<Java.Map> arg);
    } else if (isType(arg, 'com.tinkerpop.gremlin.process.util.BulkSet')) {
      return _jsifyBulkSet(<Java.BulkSet> arg);
    } else {
      return arg;
    }
  }

  // ### `interface BulkSetElement`
  // Element of a jsify-ed BulkSet.
  interface BulkSetElement {
    key: string;
    count: Java.longValue_t;
  }

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

  // ### `_newGraphSONMapper()`
  // Create a GraphSONMapper (promise) that preserves types.
  function _newGraphSONMapper(): BluePromise<Java.GraphSONMapper> {
    return GraphSONMapper.buildP()
      .then((builder: Java.GraphSONMapper$Builder): BluePromise<Java.GraphSONMapper$Builder> =>
            builder.embedTypesP(true))
      .then((builder: Java.GraphSONMapper$Builder): BluePromise<Java.GraphSONMapper> =>
            builder.createP());
  }

  // ### `_newGraphSONMapperSync()`
  // Create a GraphSONMapper that preserves types.
  function _newGraphSONMapperSync(): Java.GraphSONMapper {
    var builder: Java.GraphSONMapper$Builder = GraphSONMapper.build();
    builder.embedTypes(true);
    var mapper: Java.GraphSONMapper = builder.create();
    return mapper;
  }

  // ### `prettyGraphSONString(ugly: string)`
  // Make a GraphSON string pretty, adding indentation and deterministic format.
  function _prettyGraphSONString(ugly: string): string {
    var json: any = JSON.parse(ugly);

    // Compute the stable JSON.
    var stringifyOpts: jsonStableStringify.Options = {
      // GraphSON requires its top level properties to be in the order mode, vertices, edges.
      space: 2,
      cmp: (a: jsonStableStringify.Element, b: jsonStableStringify.Element): number => {
        if (a.key === 'edges')
          return 1;
        else if (b.key === 'edges')
          return -1;
        return a.key < b.key ? -1 : 1;
      }
    };

    var prettyString: string = jsonStableStringify(json, stringifyOpts);
    return prettyString;
  }

  // ### `_jsifyList(javaList: Java.List)`
  // Turn a Java List into a JavaScript array, recursively calling jsify.
  function _jsifyList(javaList: Java.List): any[] {
    var arr: any[] = [];
    var it = javaList.iterator();
    while (it.hasNext()) {
      var elem: any = it.next();
      var obj: any = jsify(elem);
      arr.push(obj);
    }
    return arr;
  }

  // ### `_jsifyMap(javaMap: Java.Map)`
  // Turn a Java Map into a JavaScript object, recursively calling jsify.
  function _jsifyMap(javaMap: Java.Map): any {
    // it seems this type of coercion could be ported to node-java
    // https://github.com/joeferner/node-java/issues/56
    var map: any = {};
    var it: Java.Iterator = javaMap.entrySet().iterator();
    while (it.hasNext()) {
      var pair: Java.Map$Entry = <Java.Map$Entry> it.next();
      var key: string = <string> pair.getKey();
      map[key] = jsify(pair.getValue());
    }
    return map;
  }

  // ### `_jsifyBulkSet(bulkSet: Java.BulkSet)`
  // Turn a TinkerPop BulkSet into an array of objects with key/count fields.
  function _jsifyBulkSet(bulkSet: Java.BulkSet): BulkSetElement[] {
    var arr: BulkSetElement[] = [];
    var it: Java.Iterator = bulkSet.iterator();
    while (it.hasNext()) {
      var key: any = it.next();
      var count: Java.longValue_t = bulkSet.get(key);
      var elem: BulkSetElement = {
        key: jsify(key),
        count: count
      };
      arr.push(elem);
    }
    return arr;
  }

  // ### Non-exported variables
  var _groovyScriptEngineName: string = 'Groovy';
  var _javaScriptEngineName: string = 'JavaScript';
  var _groovyScriptEngine: Java.com.tinkerpop.gremlin.groovy.jsr223.GremlinGroovyScriptEngine;

}

function beforeJvm(): BluePromise<void> {
  var globP = BluePromise.promisify(glob);
  return globP('target/**/*.jar').then((filenames: string[]) => {
    filenames.forEach((name: string): void => {
      dlog('classpath:', name);
      _java.classpath.push(name);
    });
  });
}

function afterJvm(): BluePromise<void> {
  Tinkerpop.initialize();
  return BluePromise.resolve();
}

// This code is executed just once at module import time
_java.asyncOptions = {
  syncSuffix: '',
  promiseSuffix: 'P',
  // Should be able to use BluePromise.promisify here, but TSC gives a type error.
  // TODO: Fix this after changing ts-java's declaration of the promisify type.
  promisify: require('bluebird').promisify
};
_java.registerClientP(beforeJvm, afterJvm);


export = Tinkerpop;
