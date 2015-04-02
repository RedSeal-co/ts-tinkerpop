/// <reference path='./java.d.ts' />
/// <reference path='../typings/bluebird/bluebird.d.ts' />
/// <reference path='../typings/debug/debug.d.ts' />
/// <reference path='../typings/glob/glob.d.ts' />
/// <reference path='../typings/json-stable-stringify/json-stable-stringify.d.ts' />
/// <reference path='../typings/lodash/lodash.d.ts' />
/// <reference path='../typings/node/node.d.ts' />
/// <reference path='../typings/power-assert/power-assert.d.ts' />
var _ = require('lodash');
var _autoImport = require('./autoImport');
var _java = require('redseal-java');
var assert = require('power-assert');
var BluePromise = require('bluebird');
var debug = require('debug');
var fs = require('fs');
var glob = require('glob');
var jsonStableStringify = require('json-stable-stringify');
var dlog = debug('ts-tinkerpop');
// # ts-tinkerpop
// Helper functions for Typescript applications using [TinkerPop 3]() via [node-java](https://github.com/joeferner/node-java).
//
// See the README.md for usage notes.
var Tinkerpop;
(function (Tinkerpop) {
    'use strict';
    // ### autoImport
    Tinkerpop.autoImport = _autoImport;
    // ### Exported variables
    Tinkerpop.java = _java;
    // #### TinkerPop Classes
    Tinkerpop.__;
    Tinkerpop.Compare;
    Tinkerpop.GraphSONReader;
    Tinkerpop.GraphSONWriter;
    Tinkerpop.GraphSONMapper;
    Tinkerpop.GremlinGroovyScriptEngine;
    Tinkerpop.ScriptEngineLambda;
    Tinkerpop.T;
    Tinkerpop.TinkerFactory;
    Tinkerpop.TinkerGraph;
    // #### Other Java classes
    Tinkerpop.ByteArrayOutputStream;
    Tinkerpop.GroovyLambda;
    // #### Useful singleton variables
    // The groovy runtime NULL object.
    Tinkerpop.NULL;
    // The UTF8 Charset specifier
    Tinkerpop.UTF8;
    // ### Exported Functions
    // #### `initialize()`
    // This function should be called once just after java has been configured.
    // Java configuration includes classpath, options, and asyncOptions.
    // If this method is called before configuration, the java.import calls will likely
    // fail due to the classes not being on the classpath.
    // This method must be called before any of the exported vars above are accessed.
    // It is wasteful, but not an error, to call this method more than once.
    function initialize() {
        Tinkerpop.__ = Tinkerpop.autoImport('__');
        Tinkerpop.ByteArrayOutputStream = Tinkerpop.autoImport('ByteArrayOutputStream');
        Tinkerpop.Compare = Tinkerpop.autoImport('Compare');
        Tinkerpop.GraphSONReader = Tinkerpop.autoImport('GraphSONReader');
        Tinkerpop.GraphSONWriter = Tinkerpop.autoImport('GraphSONWriter');
        Tinkerpop.GraphSONMapper = Tinkerpop.autoImport('GraphSONMapper');
        Tinkerpop.GremlinGroovyScriptEngine = Tinkerpop.autoImport('GremlinGroovyScriptEngine');
        Tinkerpop.GroovyLambda = Tinkerpop.java.import('co.redseal.gremlinnode.function.GroovyLambda'); // TODO: Use autoImport when #91309036 fixed
        Tinkerpop.NULL = Tinkerpop.autoImport('NullObject').getNullObject();
        Tinkerpop.ScriptEngineLambda = Tinkerpop.autoImport('ScriptEngineLambda');
        Tinkerpop.T = Tinkerpop.autoImport('T');
        Tinkerpop.TinkerFactory = Tinkerpop.autoImport('TinkerFactory');
        Tinkerpop.TinkerGraph = Tinkerpop.autoImport('TinkerGraph');
        Tinkerpop.UTF8 = Tinkerpop.autoImport('StandardCharsets').UTF_8.name();
        /// TODO: provide a separate factory class for script engine instances.
        _groovyScriptEngine = new Tinkerpop.GremlinGroovyScriptEngine();
        dlog('Tinkerpop helper initialized.');
    }
    Tinkerpop.initialize = initialize;
    function getTinkerpop() {
        return _java.ensureJvm().then(function () { return Tinkerpop; });
    }
    Tinkerpop.getTinkerpop = getTinkerpop;
    // #### `id(n: number)`
    // Tinkerpop IDs typically are long (64-bit) integers. Javascript does not support 64-bit integers.
    // There are use cases where leaving the type of an ID unspecified can result in ambiguities between
    // the Java types Integer and Long. To disambigute, use this function.
    function id(n) {
        return Tinkerpop.java.newLong(n);
    }
    Tinkerpop.id = id;
    // #### `ids(a: number[])`
    // As above, but for creating an array of IDs.
    function ids(a) {
        return Tinkerpop.java.newArray('java.lang.Object', _.map(a, function (n) { return id(n); }));
    }
    Tinkerpop.ids = ids;
    // #### `newJavaScriptLambda(javascript: string)`
    // Creates a lambda function from a javascript string.
    function newJavaScriptLambda(javascript) {
        return new Tinkerpop.ScriptEngineLambda(_javaScriptEngineName, javascript);
    }
    Tinkerpop.newJavaScriptLambda = newJavaScriptLambda;
    ;
    // #### `newGroovyLambda(groovyFragment: string)`
    // Creates a lambda function from a groovy code fragment (*not*) a closure string).
    // Lambdas of this form have more overhead than lambdas created with `newGroovyClosure()`.
    function newGroovyLambda(groovyFragment) {
        // The groovy string here is *not* a closure.
        // It is a code fragment with implicit parameters a,b,c, e.g.: 'println(a)'.
        assert.ok(!_isClosure(groovyFragment));
        return new Tinkerpop.ScriptEngineLambda(_groovyScriptEngineName, groovyFragment);
    }
    Tinkerpop.newGroovyLambda = newGroovyLambda;
    ;
    // #### `newGroovyClosure(groovyClosureString: string)`
    // Creates a lambda function from a groovy closure string.
    function newGroovyClosure(groovyClosureString) {
        // The groovy string must be a closure expression, e.g. '{ x -> println(x) }'.
        assert.ok(_isClosure(groovyClosureString));
        return new Tinkerpop.GroovyLambda(groovyClosureString, _groovyScriptEngine);
    }
    Tinkerpop.newGroovyClosure = newGroovyClosure;
    ;
    // ### `getGroovyEngine()`
    // Returns the Groovy engine used by `newGroovyLambda` and `newGroovyClosure`.
    function getGroovyEngine() {
        return _groovyScriptEngine;
    }
    Tinkerpop.getGroovyEngine = getGroovyEngine;
    // ### `importGroovy(pkgOrClass: string)`
    // Imports a Java package or class, based on fully-qualified wildcard or class name.  This affects the operation of
    // `newGroovyClosure` but does NOT affect `newGroovyLambda`.
    function importGroovy(javaClassOrPkg) {
        var engine = getGroovyEngine();
        var HashSet = Tinkerpop.autoImport('HashSet');
        var imports = new HashSet();
        imports.add('import ' + javaClassOrPkg);
        engine.addImports(imports);
    }
    Tinkerpop.importGroovy = importGroovy;
    // #### `vertexStringify(vertex: Java.Vertex)`
    // Converts a Tinkerpop Vertex to a string representation.
    // See also `vertexToJson` below.
    function vertexStringify(vertex) {
        var stream = new Tinkerpop.ByteArrayOutputStream();
        var builder = Tinkerpop.GraphSONWriter.build();
        var writer = builder.create();
        writer.writeVertex(stream, vertex);
        return stream.toString(Tinkerpop.UTF8);
    }
    Tinkerpop.vertexStringify = vertexStringify;
    // #### `vertexToJson(vertex: Java.Vertex)`
    // Converts a Tinkerpop Vertex to a javascript (json) object.
    function vertexToJson(vertex) {
        return JSON.parse(vertexStringify(vertex));
    }
    Tinkerpop.vertexToJson = vertexToJson;
    // #### `function edgeStringify(edge: Java.Edge)`
    // Converts a Tinkerpop Edge to a string representation.
    // See also `edgeToJson` below.
    function edgeStringify(edge) {
        var stream = new Tinkerpop.ByteArrayOutputStream();
        var builder = Tinkerpop.GraphSONWriter.build();
        var writer = builder.create();
        writer.writeEdge(stream, edge);
        return stream.toString(Tinkerpop.UTF8);
    }
    Tinkerpop.edgeStringify = edgeStringify;
    ;
    // #### `function edgeToJson(edge: Java.Edge)`
    // Converts a Tinkerpop Edge to a javascript (json) object.
    function edgeToJson(edge) {
        return JSON.parse(edgeStringify(edge));
    }
    Tinkerpop.edgeToJson = edgeToJson;
    ;
    // #### `function isJavaObject(e: any)`
    // Returns true if the obj is a Java object.
    // Useful for determining the runtime type of object_t returned by many java methods.
    function isJavaObject(e) {
        return Tinkerpop.java.instanceOf(e, 'java.lang.Object');
    }
    Tinkerpop.isJavaObject = isJavaObject;
    // #### `function asJavaObject(obj: Java.object_t)`
    // Useful for when in a given context an application expects that an object_t really is a Java.Object,
    // but for defensive programming purposes wants to do the runtime check rather than a simple cast.
    function asJavaObject(obj) {
        if (isJavaObject(obj)) {
            return obj;
        }
        else {
            throw new Error('asJavaObject given an object that is not a Java.Object');
        }
    }
    Tinkerpop.asJavaObject = asJavaObject;
    // #### `function isVertex(v: any)`
    // Returns true if v is a Tinkerpop Vertex.
    function isVertex(v) {
        return Tinkerpop.java.instanceOf(v, 'com.tinkerpop.gremlin.structure.Vertex');
    }
    Tinkerpop.isVertex = isVertex;
    // #### `function asVertex(v: Java.object_t)`
    // Useful for when in a given context an application expects that an object_t really is a Java.Vertex,
    // but for defensive programming purposes wants to do the runtime check rather than a simple cast.
    function asVertex(v) {
        if (isVertex(v)) {
            return v;
        }
        else {
            throw new Error('asVertex given an object that is not a Vertex');
        }
    }
    Tinkerpop.asVertex = asVertex;
    // #### `function isEdge(e: any)`
    // Returns true if e is a Tinkerpop Edge.
    function isEdge(e) {
        return Tinkerpop.java.instanceOf(e, 'com.tinkerpop.gremlin.structure.Edge');
    }
    Tinkerpop.isEdge = isEdge;
    // #### `function asEdge(e: Java.object_t)`
    // Useful for when in a given context an application expects that an object_t really is a Java.Edge,
    // but for defensive programming purposes wants to do the runtime check rather than a simple cast.
    function asEdge(e) {
        if (isEdge(e)) {
            return e;
        }
        else {
            throw new Error('asEdge given an object that is not an Edge');
        }
    }
    Tinkerpop.asEdge = asEdge;
    // #### `forEach(javaIterator: Java.Iterator, consumer: ConsumeObject)`
    // Applies *consumer* to each Java.Object returned by the *javaIterator*.
    // *javaIterator* may be any type that implements java.util.Iterator, including a tinkerpop Traversal.
    // *consumer* is function that will do some work on a Java.Object asychronously, returning a Promise for its completion.
    // Returns a promise that is resolved when all objects have been consumed.
    function forEach(javaIterator, consumer) {
        function _eachIterator(javaIterator, consumer) {
            return javaIterator.hasNextP().then(function (hasNext) {
                if (!hasNext) {
                    dlog('forEach: done');
                    return BluePromise.resolve();
                }
                else {
                    return javaIterator.nextP().then(function (obj) {
                        dlog('forEach: consuming');
                        return consumer(obj);
                    }).then(function () {
                        dlog('forEach: recursing');
                        return _eachIterator(javaIterator, consumer);
                    });
                }
            });
        }
        return _eachIterator(javaIterator, consumer);
    }
    Tinkerpop.forEach = forEach;
    // #### `function asJSON(traversal: Java.Traversal)`
    // Executes a traversal (synchronously!), returning a json object for all of the returned objects.
    function asJSON(traversal) {
        var array = traversal.toList().toArray().map(function (elem) { return _asJSON(elem); });
        return JSON.parse(JSON.stringify(array));
    }
    Tinkerpop.asJSON = asJSON;
    ;
    // #### `function simplifyVertexProperties(obj: any)`
    // Given *obj* which is a javascript object created by asJSON(),
    // return a simpler representation of the object that is more convenient for unit tests.
    function simplifyVertexProperties(obj) {
        if (_.isArray(obj)) {
            return _.map(obj, simplifyVertexProperties);
        }
        obj.properties = _.mapValues(obj.properties, function (propValue) {
            var values = _.pluck(propValue, 'value');
            return (values.length === 1) ? values[0] : values;
        });
        return obj;
    }
    Tinkerpop.simplifyVertexProperties = simplifyVertexProperties;
    ;
    // ### `loadGraphSON(graph: Java.Graph, filename: string)`
    // Loads the graph as GraphSON, and returns promise to the graph (for fluent API).
    function loadGraphSON(graph, filename, callback) {
        var FileInputStream = Tinkerpop.autoImport('FileInputStream');
        var stream = new FileInputStream(filename);
        return Tinkerpop.GraphSONReader.buildP().then(function (builder) {
            return _newGraphSONMapper().then(function (mapper) { return builder.mapperP(mapper); });
        }).then(function (builder) { return builder.createP(); }).then(function (reader) { return reader.readGraphP(stream, graph); }).then(function () { return graph; }).nodeify(callback);
    }
    Tinkerpop.loadGraphSON = loadGraphSON;
    // ### `loadGraphSONSync(graph: Java.Graph, filename: string)`
    // Loads the graph as GraphSON, and returns the graph (for fluent API).
    function loadGraphSONSync(graph, filename) {
        var FileInputStream = Tinkerpop.autoImport('FileInputStream');
        var stream = new FileInputStream(filename);
        var builder = Tinkerpop.GraphSONReader.build();
        var mapper = _newGraphSONMapperSync();
        builder.mapper(mapper);
        var reader = builder.create();
        reader.readGraph(stream, graph);
        return graph;
    }
    Tinkerpop.loadGraphSONSync = loadGraphSONSync;
    // ### `saveGraphSON(graph: Java.Graph, filename: string)`
    // Saves the graph as GraphSON, and returns promise to the graph.
    function saveGraphSON(graph, filename, callback) {
        var FileOutputStream = Tinkerpop.autoImport('FileOutputStream');
        var stream = new FileOutputStream(filename);
        return Tinkerpop.GraphSONWriter.buildP().then(function (builder) {
            return _newGraphSONMapper().then(function (mapper) { return builder.mapperP(mapper); });
        }).then(function (builder) { return builder.createP(); }).then(function (writer) { return writer.writeGraphP(stream, graph); }).then(function () { return graph; }).nodeify(callback);
    }
    Tinkerpop.saveGraphSON = saveGraphSON;
    // ### `saveGraphSONSync(graph: Java.Graph, filename: string)`
    // Saves the graph as GraphSON, and returns the graph (for fluent API).
    function saveGraphSONSync(graph, filename) {
        var FileOutputStream = Tinkerpop.autoImport('FileOutputStream');
        var stream = new FileOutputStream(filename);
        var builder = Tinkerpop.GraphSONWriter.build();
        var mapper = _newGraphSONMapperSync();
        builder.mapper(mapper);
        var writer = builder.create();
        writer.writeGraph(stream, graph);
        return graph;
    }
    Tinkerpop.saveGraphSONSync = saveGraphSONSync;
    // ### `savePrettyGraphSON(graph: Java.Graph, filename: string)`
    // Saves the graph as human-readable, deterministic GraphSON, and returns promise to the graph (for fluent API).
    function savePrettyGraphSON(graph, filename, callback) {
        var ByteArrayOutputStream = Tinkerpop.autoImport('ByteArrayOutputStream');
        var stream = new ByteArrayOutputStream();
        return Tinkerpop.GraphSONWriter.buildP().then(function (builder) {
            return _newGraphSONMapper().then(function (mapper) { return builder.mapperP(mapper); });
        }).then(function (builder) { return builder.createP(); }).then(function (writer) { return writer.writeGraphP(stream, graph); }).then(function () { return stream.toStringP(); }).then(function (ugly) {
            var prettyString = _prettyGraphSONString(ugly);
            var writeFileP = BluePromise.promisify(fs.writeFile);
            return writeFileP(filename, prettyString);
        }).then(function () { return graph; }).nodeify(callback);
    }
    Tinkerpop.savePrettyGraphSON = savePrettyGraphSON;
    // ### `savePrettyGraphSONSync(graph: Java.Graph, filename: string)`
    // Saves the graph as human-readable, deterministic GraphSON, and returns the graph (for fluent API).
    function savePrettyGraphSONSync(graph, filename) {
        // Build the GraphSON in memory in Java.
        var ByteArrayOutputStream = Tinkerpop.autoImport('ByteArrayOutputStream');
        var stream = new ByteArrayOutputStream();
        var builder = Tinkerpop.GraphSONWriter.build();
        var mapper = _newGraphSONMapperSync();
        builder.mapper(mapper);
        var writer = builder.create();
        writer.writeGraph(stream, graph);
        // Beautify the JSON.
        var uglyString = stream.toString();
        var prettyString = _prettyGraphSONString(uglyString);
        // Write to the file.
        fs.writeFileSync(filename, prettyString);
        return graph;
    }
    Tinkerpop.savePrettyGraphSONSync = savePrettyGraphSONSync;
    // ### Non-exported Functions
    // #### `function _isClosure(val: string)`
    // Returns true if the string *smells* like a groovy closure.
    function _isClosure(val) {
        var closureRegex = /^\{.*\}$/;
        return _.isString(val) && val.search(closureRegex) > -1;
    }
    ;
    // #### `function _asJSON(elem: any)`
    // A utility function used by `asJSONSync`.
    function _asJSON(elem) {
        if (!_.isObject(elem)) {
            // Scalars should stay that way.
            return elem;
        }
        else if (_.isArray(elem)) {
            // Arrays must be recursively converted.
            return elem.map(function (e) { return _asJSON(e); });
        }
        else if (isVertex(elem)) {
            // Handle Vertex
            return vertexToJson(asVertex(elem));
        }
        else if (isEdge(elem)) {
            // Handle Edge
            return edgeToJson(asEdge(elem));
        }
        else if (isJavaObject(elem)) {
            // If we still have an unrecognized Java object, convert it to a string.
            var javaObj = elem;
            return { 'javaClass': javaObj.getClass().getName(), 'toString': javaObj.toString() };
        }
        else if ('toJSON' in elem) {
            // If we have a 'toJSON' method, use it.
            return elem;
        }
        else {
            // Recursively convert any other kind of object.
            return _.mapValues(elem, function (value) { return _asJSON(value); });
        }
    }
    // ### `_newGraphSONMapper()`
    // Create a GraphSONMapper (promise) that preserves types.
    function _newGraphSONMapper() {
        return Tinkerpop.GraphSONMapper.buildP().then(function (builder) { return builder.embedTypesP(true); }).then(function (builder) { return builder.createP(); });
    }
    // ### `_newGraphSONMapperSync()`
    // Create a GraphSONMapper that preserves types.
    function _newGraphSONMapperSync() {
        var builder = Tinkerpop.GraphSONMapper.build();
        builder.embedTypes(true);
        var mapper = builder.create();
        return mapper;
    }
    // Make a GraphSON string pretty, adding indentation and deterministic format.
    function _prettyGraphSONString(ugly) {
        var json = JSON.parse(ugly);
        // Compute the stable JSON.
        var stringifyOpts = {
            // GraphSON requires its top level properties to be in the order mode, vertices, edges.
            space: 2,
            cmp: function (a, b) {
                if (a.key === 'edges')
                    return 1;
                else if (b.key === 'edges')
                    return -1;
                return a.key < b.key ? -1 : 1;
            }
        };
        var prettyString = jsonStableStringify(json, stringifyOpts);
        return prettyString;
    }
    // ### Non-exported variables
    var _groovyScriptEngineName = 'Groovy';
    var _javaScriptEngineName = 'JavaScript';
    var _groovyScriptEngine;
})(Tinkerpop || (Tinkerpop = {}));
function beforeJvm() {
    var globP = BluePromise.promisify(glob);
    return globP('target/**/*.jar').then(function (filenames) {
        filenames.forEach(function (name) {
            dlog('classpath:', name);
            _java.classpath.push(name);
        });
    });
}
function afterJvm() {
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
module.exports = Tinkerpop;
//# sourceMappingURL=ts-tinkerpop.js.map