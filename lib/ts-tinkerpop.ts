/// <reference path='../typings/debug/debug.d.ts' />
/// <reference path='../typings/json-stable-stringify/json-stable-stringify.d.ts' />
/// <reference path='../typings/lodash/lodash.d.ts' />
/// <reference path='../typings/power-assert/power-assert.d.ts' />

import _ = require('lodash');
import _java = require('./tsJavaModule');
import assert = require('power-assert');
import BluePromise = require('bluebird');
import debug = require('debug');
import fs = require('fs');
import jsonStableStringify = require('json-stable-stringify');

var dlog = debug('ts-tinkerpop');

// # ts-tinkerpop
// Helper functions for Typescript applications using [TinkerPop 3]() via [node-java](https://github.com/joeferner/node-java).
//
// See the README.md for usage notes.

module Tinkerpop {

  'use strict';

  export import Java = _java.Java;

  export type Static = typeof Tinkerpop;

  // ### autoImport
  export var autoImport = Java.importClass;

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
      autoImport('co.redseal.gremlinnode.function.GroovyLambda');  // TODO: Use autoImport when #91309036 fixed
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
    return Java.ensureJvm().then(() => Tinkerpop);
  }

  // #### `id(n: number)`
  // Tinkerpop IDs typically are long (64-bit) integers. Javascript does not support 64-bit integers.
  // There are use cases where leaving the type of an ID unspecified can result in ambiguities between
  // the Java types Integer and Long. To disambigute, use this function.
  export function id(n: number): Java.Object {
    return Java.newLong(n);
  }

  // #### `ids(a: number[])`
  // As above, but for creating an array of IDs.
  export function ids(a: number[]) : Java.array_t<Java.Object> {
    return Java.newArray('java.lang.Object', _.map(a, (n: number) => id(n)));
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

  // ### `function L(n: number)`
  // Produce a longValue_t literal.
  export function L(n: number): Java.longValue_t {
    return Java.newLong(n).longValue();
  }

  // ### `function isLongValue(e: any)`
  // Checks whether an object is a longValue_t, which is the representation of Java long primitives.
  export function isLongValue(obj: any): boolean {
    return _.isObject(obj) && obj instanceof Number && 'longValue' in obj && _.keys(obj).length === 1;
  }

  // #### `function isJavaObject(e: any)`
  // Returns true if the obj is a Java object.
  // Useful for determining the runtime type of object_t returned by many java methods.
  export function isJavaObject(e: any): boolean {
    return _.isObject(e) && !_.isArray(e) && !isLongValue(e) && Java.instanceOf(e, 'java.lang.Object');
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
    return Java.instanceOf(v, 'org.apache.tinkerpop.gremlin.structure.Vertex');
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
    return Java.instanceOf(e, 'org.apache.tinkerpop.gremlin.structure.Edge');
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
    (item: Java.object_t): any | BluePromise<any>;
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
            return BluePromise.resolve();
          } else {
            return javaIterator.nextP()
              .then((obj: Java.object_t) => consumer(obj))
              .then(() => _eachIterator(javaIterator, consumer));
          }
        });
    }
    return _eachIterator(javaIterator, consumer);
  }

  // #### `function asJSON(traversal: Java.Traversal)`
  // Executes a traversal (synchronously!), returning a json object for all of the returned objects.
  export function asJSON(traversal: Java.Traversal): any[] {
    var array: any[] = traversal.toList().toArray().map((elem: any) => _asJSON(elem));
    return JSON.parse(JSON.stringify(array));
  };

  // #### `function simplifyVertexProperties(obj: any)`
  // Given *obj* which is a javascript object created by asJSON(),
  // return a simpler representation of the object that is more convenient for unit tests.
  // - If an array is provided, each of its elements will be simplified.
  export function simplifyVertexProperties(obj: any[]): any[];
  export function simplifyVertexProperties(obj: any): any;
  export function simplifyVertexProperties(obj: any): any {
    if (_.isArray(obj)) {
      return _.map(obj, simplifyVertexProperties);
    }
    assert('label' in obj);
    assert.strictEqual(obj.label, 'vertex');
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

  // ### `loadPrettyGraphSON(graph: Java.Graph, filename: string)`
  // Loads the graph as GraphSON, and returns promise to the graph (for fluent API).
  export function loadPrettyGraphSON(graph: Java.Graph, filename: string, callback?: GraphCallback): BluePromise<Java.Graph> {

    // We need to create an input stream and a reader, both of which are created asyncrously in parallel.
    // It would be nice to use Bluebird.join() perform those two operations, but the declaration for join()
    // in bluebird.d.ts isn't correct. We instead use .all(), and furthermore we use these two local variables
    // to commuicate the results of the two async operations to the final join operation.
    var theStream: Java.InputStream;
    var theReader: Java.GraphSONReader;

    function getStream(): BluePromise<Java.InputStream> {
      var readFileP = BluePromise.promisify(fs.readFile);
      return readFileP(filename, { encoding: 'utf8' })
        .then((jsonText: string) => {
          var jsonObjArray: any[] = JSON.parse(jsonText);
          var jsonTextArray: string[] = _.map(jsonObjArray, JSON.stringify);
          return jsonTextArray.join('\n');
        })
        .then((uglyText: string) => {
          var StringInputStream: Java.StringInputStream.Static = autoImport('StringInputStream');
          theStream = StringInputStream.from(uglyText);
          return theStream;
        });
    }

    function getGraphReader(): BluePromise<Java.GraphSONReader> {
      return GraphSONReader.buildP()
        .then((builder: Java.GraphSONReader$Builder): BluePromise<Java.GraphSONReader$Builder> => {
          return _newGraphSONMapper()
            .then((mapper: Java.GraphSONMapper): BluePromise<Java.GraphSONReader$Builder> => builder.mapperP(mapper));
        })
        .then((builder: Java.GraphSONReader$Builder): BluePromise<Java.GraphSONReader> => builder.createP())
        .then((reader: Java.GraphSONReader) => { theReader = reader; return theReader; });
    }

    return BluePromise.all([getStream(), getGraphReader()])
      .then(() => theReader.readGraphP(theStream, graph))
      .then((): Java.Graph => graph)
      .nodeify(callback);
  }

  // ### `loadPrettyGraphSONSync(graph: Java.Graph, filename: string)`
  // Loads the 'pretty' graph as GraphSON, and returns the graph (for fluent API).
  export function loadPrettyGraphSONSync(graph: Java.Graph, filename: string): Java.Graph {
    var jsonText: string = fs.readFileSync(filename, { encoding: 'utf8' });
    var jsonObjArray: any[] = JSON.parse(jsonText);
    var jsonTextArray: string[] = _.map(jsonObjArray, JSON.stringify);
    var uglyText = jsonTextArray.join('\n');

    var StringInputStream: Java.StringInputStream.Static = autoImport('StringInputStream');
    var stream: Java.InputStream = StringInputStream.from(uglyText);
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
    if (!o || !_.isObject(o)) { return false; }
    try {
      return Java.instanceOf(o, typeName);
    } catch (err) {
      return false;
    }
  }

  // ### `jsify(arg: any)`
  // Convert certain Java containers into JavaScript equivalents:
  // - List: any[]
  // - Set: any[]
  // - Map: any
  // - Map$Entry: MapEntry
  // - BulkSet: BulkSetElement[]
  // - Path: PathElement[]
  export function jsify(arg: any): any {
    if (_.isArray(arg)) {
      return _.map(arg, jsify);
    } else if (!_.isObject(arg)) {
      return arg;
    } else if (isLongValue(arg)) {
      // Represent longValue_t as string
      return arg.longValue;
    } else if (isType(arg, 'java.util.List')) {
      return _jsifyCollection(<Java.List> arg);
    } else if (isType(arg, 'java.util.Map')) {
      return _jsifyMap(<Java.Map> arg);
    } else if (isType(arg, 'java.util.Map$Entry')) {
      return _jsifyMapEntry(<Java.Map$Entry> arg);
    } else if (isType(arg, 'org.apache.tinkerpop.gremlin.process.traversal.step.util.BulkSet')) {
      // BulkSet is used to hold groupCount result, so it is given special treatment.
      return _jsifyBulkSet(<Java.BulkSet> arg);
    } else if (isType(arg, 'java.util.Set')) {
      return _jsifyCollection(<Java.Set> arg);
    } else if (isType(arg, 'org.apache.tinkerpop.gremlin.process.traversal.Path')) {
      return _jsifyPath(<Java.Path> arg);
    } else {
      return arg;
    }
  }

  // ### `interface MapEntry`
  export interface MapEntry {
    key: any;
    value: any;
  }

  // ### `interface BulkSetElement`
  // Element of a jsify-ed BulkSet.
  export interface BulkSetElement {
    key: string;
    count: Java.longValue_t;
  }

  // ### `interface PathElement`
  // Element of a jsify-ed Path.
  // - *object* is recursively jsify-ed.
  // - *labels* will be sorted.
  export interface PathElement {
    object: any;
    labels: string[];
  }

  // ### Non-exported Functions

  // #### `function _isClosure(val: string)`
  // Returns true if the string *smells* like a groovy closure.
  function _isClosure(val: string): boolean {
    var closureRegex = /^\{.*\}$/;
    return _.isString(val) && val.search(closureRegex) > -1;
  };

  // #### `function _asJSON(elem: any)`
  // A utility function used by `asJSON`.
  function _asJSON(rawElem: any): any {
    var elem: any = jsify(rawElem);

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

  // ### `_smellsLikeAPropertyContainer()`
  function _smellsLikeAPropertyContainer(elem: any): boolean {
    return _.isObject(elem) && elem['@class'] === 'java.util.HashMap';
  }

  // ### `_smellsLikeAnElement()`
  function _smellsLikeAnElement(elem: any): boolean {
    return _smellsLikeAPropertyContainer(elem) &&  !_.isUndefined(elem.id);
  }

  function _smellsLikeArrayOfElements(obj: any): boolean {
    return _.isArray(obj) && obj[0] === 'java.util.ArrayList' && _.isArray(obj[1]) && _smellsLikeAnElement(obj[1][0]);
  }

  // ### `_compareIds()`
  // Compares two Tinkerpop elements (vertex or edge) by their ID.
  // Tinkerpop allows different datatypes to be used for ID. This method requires that both IDs be of the same
  // type, and tries to do something reasonable for the various representations we might see from Tinkerpop.
  function _compareIds(a: any, b: any): number {
    assert.strictEqual(typeof a, typeof b);
    if (_.isNumber(a)) {
      return a - b;
    } else if (_.isString(a)) {
      // Even with strings, we prefer numeric sort semantics,
      // i.e. a shorter string is always less than a longer string.
      if (a.length === b.length) {
        return a.localeCompare(b);
      } else {
        return a.length - b.length;
      }
    } else if (_.isArray(a)) {
      // handles cases like this: "id": [ "java.lang.Long", 16],
      assert.strictEqual(a[0], b[0]);
      assert.strictEqual(a.length, 2);
      assert.strictEqual(b.length, 2);
      return _compareIds(a[1], b[1]);
    } else {
      dlog('Whatup?', a, b);
      assert(false, 'Unexpected element id type:' + typeof(a));
    }
  }

  // ### `_compareById()`
  // Compares two elements by their id
  function _compareById(a: any, b: any): number {
    assert.strictEqual(typeof a.id, typeof b.id);
    assert.ok(!_.isUndefined(a.id));
    return _compareIds(a.id, b.id);
  }

  // ### `_sortElements()`
  // Called for each key,obj in a property container, this processes each object that smells like an array of elements
  function _sortElements(obj: any, key: string): any {
    if (_smellsLikeArrayOfElements(obj)) {
      obj[1] = obj[1].sort(_compareById);
    }
    return obj;
  }

  // ### `_sortPropertyContainers()`
  // Called for each key,obj in an Element, this processes each object that smells like a 'property container',
  // which includes vertex `properties` hashmaps, and `inE` and `outE` edges.
  function _sortPropertyContainers(obj: any, key: string): any {
    if (_smellsLikeAPropertyContainer(obj)) {
      return _.mapValues(obj, _sortElements);
    } else {
      return obj;
    }
  }

  // ### `_parseVertex()`
  // Parse one line of text from a Tinkerpop graphson stream, yielding one vertex.
  function _parseVertex(line: string): any {
    var vertex: any = JSON.parse(line);
    assert.ok(_smellsLikeAnElement(vertex));

    // A vertex is an object, i.e. a key,value map.
    // We don't sort the keys of the object, leaving that to jsonStableStringify below.
    // But a vertex values contain `property containers`, each of which may contain embedded arrays of elements.
    return _.mapValues(vertex, _sortPropertyContainers);
  }

  // ### `prettyGraphSONString(ugly: string)`
  // Make a GraphSON string pretty, adding indentation and deterministic format.
  function _prettyGraphSONString(ugly: string): string {
    var lines: string[] = ugly.trim().split(require('os').EOL);

    var vertices: any[] = _.map(lines, (line: string) => _parseVertex(line));
    vertices.sort(_compareById);

    // Compute the stable JSON.
    var stringifyOpts: jsonStableStringify.Options = {
      space: 2
    };
    var prettyString: string = jsonStableStringify(vertices, stringifyOpts) + '\n';
    return prettyString;
  }

  // ### `_jsifyCollection(javaCollection: Java.Collection)`
  // Turn a Java Collection into a JavaScript array, recursively calling jsify.
  function _jsifyCollection(javaCollection: Java.Collection): any[] {
    var arr: any[] = [];
    var it = javaCollection.iterator();
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

  // ### `_jsifyMap(javaMapEntry: Java.Map$Entry)`
  // Turn a Java Map$Entry into a MapEntry object, recursively calling jsify.
  function _jsifyMapEntry(javaMapEntry: Java.Map$Entry): MapEntry {
    var mapEntry: MapEntry = {
      key: jsify(javaMapEntry.getKey()),
      value: jsify(javaMapEntry.getValue())
    };
    return mapEntry;
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

  // ### `_jsifyPath(path: Java.Path)`
  // Turn a TinkerPop Path into an array of objects with object/labels fields.
  function _jsifyPath(path: Java.Path): PathElement[] {
    // Iterate in parallel over objects and labels.
    var objects: any[] = _jsifyCollection(path.objects());
    var labelSets: string[][] = _jsifyCollection(path.labels());  // TODO: Java.List<Set<String>>
    var zipped: any[][] = _.zip(objects, labelSets);
    var arr: PathElement[] =
      _.map(zipped, (pair: any[]): PathElement => {
        var object: any = pair[0];
        var labels: string[] = pair[1];
        labels.sort();
        return { object: jsify(object), labels: labels };
      });
    return arr;
  }

  // ### Non-exported variables
  var _groovyScriptEngineName: string = 'Groovy';
  var _javaScriptEngineName: string = 'JavaScript';
  var _groovyScriptEngine: Java.GremlinGroovyScriptEngine;

}

function afterJvm(): BluePromise<void> {
  Tinkerpop.initialize();
  return BluePromise.resolve();
}

Tinkerpop.Java.getJava().registerClientP(undefined, afterJvm);

export = Tinkerpop;
