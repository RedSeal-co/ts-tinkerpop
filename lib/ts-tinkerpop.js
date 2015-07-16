/// <reference path='../typings/debug/debug.d.ts' />
/// <reference path='../typings/json-stable-stringify/json-stable-stringify.d.ts' />
/// <reference path='../typings/lodash/lodash.d.ts' />
/// <reference path='../typings/power-assert/power-assert.d.ts' />
var _ = require('lodash');
var _java = require('./tsJavaModule');
var assert = require('power-assert');
var BluePromise = require('bluebird');
var debug = require('debug');
var fs = require('fs');
var jsonStableStringify = require('json-stable-stringify');
var dlog = debug('ts-tinkerpop');
// # ts-tinkerpop
// Helper functions for Typescript applications using [TinkerPop 3]() via [node-java](https://github.com/joeferner/node-java).
//
// See the README.md for usage notes.
var Tinkerpop;
(function (Tinkerpop) {
    'use strict';
    Tinkerpop.Java = _java.Java;
    // ### autoImport
    Tinkerpop.autoImport = Tinkerpop.Java.importClass;
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
        Tinkerpop.GroovyLambda = Tinkerpop.autoImport('co.redseal.gremlinnode.function.GroovyLambda'); // TODO: Use autoImport when #91309036 fixed
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
        return Tinkerpop.Java.ensureJvm().then(function () { return Tinkerpop; });
    }
    Tinkerpop.getTinkerpop = getTinkerpop;
    // #### `id(n: number)`
    // Tinkerpop IDs typically are long (64-bit) integers. Javascript does not support 64-bit integers.
    // There are use cases where leaving the type of an ID unspecified can result in ambiguities between
    // the Java types Integer and Long. To disambigute, use this function.
    function id(n) {
        return Tinkerpop.Java.newLong(n);
    }
    Tinkerpop.id = id;
    // #### `ids(a: number[])`
    // As above, but for creating an array of IDs.
    function ids(a) {
        return Tinkerpop.Java.newArray('java.lang.Object', _.map(a, function (n) { return id(n); }));
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
    // ### `function L(n: number)`
    // Produce a longValue_t literal.
    function L(n) {
        return Tinkerpop.Java.newLong(n).longValue();
    }
    Tinkerpop.L = L;
    // ### `function isLongValue(e: any)`
    // Checks whether an object is a longValue_t, which is the representation of Java long primitives.
    function isLongValue(obj) {
        return _.isObject(obj) && obj instanceof Number && 'longValue' in obj && _.keys(obj).length == 1;
    }
    Tinkerpop.isLongValue = isLongValue;
    // #### `function isJavaObject(e: any)`
    // Returns true if the obj is a Java object.
    // Useful for determining the runtime type of object_t returned by many java methods.
    function isJavaObject(e) {
        return _.isObject(e) && !_.isArray(e) && !isLongValue(e) && Tinkerpop.Java.instanceOf(e, 'java.lang.Object');
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
        return Tinkerpop.Java.instanceOf(v, 'org.apache.tinkerpop.gremlin.structure.Vertex');
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
        return Tinkerpop.Java.instanceOf(e, 'org.apache.tinkerpop.gremlin.structure.Edge');
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
                    return BluePromise.resolve();
                }
                else {
                    return javaIterator.nextP().then(function (obj) { return consumer(obj); }).then(function () { return _eachIterator(javaIterator, consumer); });
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
    function simplifyVertexProperties(obj) {
        if (_.isArray(obj)) {
            return _.map(obj, simplifyVertexProperties);
        }
        assert('label' in obj);
        assert.strictEqual(obj.label, 'vertex');
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
    // ### `loadPrettyGraphSON(graph: Java.Graph, filename: string)`
    // Loads the graph as GraphSON, and returns promise to the graph (for fluent API).
    function loadPrettyGraphSON(graph, filename, callback) {
        // We need to create an input stream and a reader, both of which are created asyncrously in parallel.
        // It would be nice to use Bluebird.join() perform those two operations, but the declaration for join()
        // in bluebird.d.ts isn't correct. We instead use .all(), and furthermore we use these two local variables
        // to commuicate the results of the two async operations to the final join operation.
        var theStream;
        var theReader;
        function getStream() {
            var readFileP = BluePromise.promisify(fs.readFile);
            return readFileP(filename, { encoding: 'utf8' }).then(function (jsonText) {
                var jsonObjArray = JSON.parse(jsonText);
                var jsonTextArray = _.map(jsonObjArray, JSON.stringify);
                return jsonTextArray.join('\n');
            }).then(function (uglyText) {
                var StringInputStream = Tinkerpop.autoImport('StringInputStream');
                theStream = StringInputStream.from(uglyText);
                return theStream;
            });
        }
        function getGraphReader() {
            return Tinkerpop.GraphSONReader.buildP().then(function (builder) {
                return _newGraphSONMapper().then(function (mapper) { return builder.mapperP(mapper); });
            }).then(function (builder) { return builder.createP(); }).then(function (reader) {
                theReader = reader;
                return theReader;
            });
        }
        return BluePromise.all([getStream(), getGraphReader()]).then(function () { return theReader.readGraphP(theStream, graph); }).then(function () { return graph; }).nodeify(callback);
    }
    Tinkerpop.loadPrettyGraphSON = loadPrettyGraphSON;
    // ### `loadPrettyGraphSONSync(graph: Java.Graph, filename: string)`
    // Loads the 'pretty' graph as GraphSON, and returns the graph (for fluent API).
    function loadPrettyGraphSONSync(graph, filename) {
        var jsonText = fs.readFileSync(filename, { encoding: 'utf8' });
        var jsonObjArray = JSON.parse(jsonText);
        var jsonTextArray = _.map(jsonObjArray, JSON.stringify);
        var uglyText = jsonTextArray.join('\n');
        var StringInputStream = Tinkerpop.autoImport('StringInputStream');
        var stream = StringInputStream.from(uglyText);
        var builder = Tinkerpop.GraphSONReader.build();
        var mapper = _newGraphSONMapperSync();
        builder.mapper(mapper);
        var reader = builder.create();
        reader.readGraph(stream, graph);
        return graph;
    }
    Tinkerpop.loadPrettyGraphSONSync = loadPrettyGraphSONSync;
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
    // ### `isType(o: any, typeName: string)`
    function isType(o, typeName) {
        if (!o || !_.isObject(o))
            return false;
        try {
            return Tinkerpop.Java.instanceOf(o, typeName);
        }
        catch (err) {
            return false;
        }
    }
    Tinkerpop.isType = isType;
    // ### `jsify(arg: any)`
    // Convert certain Java containers into JavaScript equivalents:
    // - List: any[]
    // - Set: any[]
    // - Map: any
    // - Map$Entry: MapEntry
    // - BulkSet: BulkSetElement[]
    // - Path: PathElement[]
    function jsify(arg) {
        if (_.isArray(arg)) {
            return _.map(arg, jsify);
        }
        else if (!_.isObject(arg)) {
            return arg;
        }
        else if (isLongValue(arg)) {
            // Represent longValue_t as string
            return arg.longValue;
        }
        else if (isType(arg, 'java.util.List')) {
            return _jsifyCollection(arg);
        }
        else if (isType(arg, 'java.util.Map')) {
            return _jsifyMap(arg);
        }
        else if (isType(arg, 'java.util.Map$Entry')) {
            return _jsifyMapEntry(arg);
        }
        else if (isType(arg, 'org.apache.tinkerpop.gremlin.process.traversal.step.util.BulkSet')) {
            // BulkSet is used to hold groupCount result, so it is given special treatment.
            return _jsifyBulkSet(arg);
        }
        else if (isType(arg, 'java.util.Set')) {
            return _jsifyCollection(arg);
        }
        else if (isType(arg, 'org.apache.tinkerpop.gremlin.process.traversal.Path')) {
            return _jsifyPath(arg);
        }
        else {
            return arg;
        }
    }
    Tinkerpop.jsify = jsify;
    // ### Non-exported Functions
    // #### `function _isClosure(val: string)`
    // Returns true if the string *smells* like a groovy closure.
    function _isClosure(val) {
        var closureRegex = /^\{.*\}$/;
        return _.isString(val) && val.search(closureRegex) > -1;
    }
    ;
    // #### `function _asJSON(elem: any)`
    // A utility function used by `asJSON`.
    function _asJSON(rawElem) {
        var elem = jsify(rawElem);
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
    // ### `_smellsLikeAPropertyContainer()`
    function _smellsLikeAPropertyContainer(elem) {
        return _.isObject(elem) && elem['@class'] === 'java.util.HashMap';
    }
    // ### `_smellsLikeAnElement()`
    function _smellsLikeAnElement(elem) {
        return _smellsLikeAPropertyContainer(elem) && !_.isUndefined(elem.id);
    }
    function _smellsLikeArrayOfElements(obj) {
        return _.isArray(obj) && obj[0] === 'java.util.ArrayList' && _.isArray(obj[1]) && _smellsLikeAnElement(obj[1][0]);
    }
    // ### `_compareIds()`
    // Compares two Tinkerpop elements (vertex or edge) by their ID.
    // Tinkerpop allows different datatypes to be used for ID. This method requires that both IDs be of the same
    // type, and tries to do something reasonable for the various representations we might see from Tinkerpop.
    function _compareIds(a, b) {
        assert.strictEqual(typeof a, typeof b);
        if (_.isNumber(a)) {
            return a - b;
        }
        else if (_.isString(a)) {
            // Even with strings, we prefer numeric sort semantics,
            // i.e. a shorter string is always less than a longer string.
            if (a.length === b.length) {
                return a.localeCompare(b);
            }
            else {
                return a.length - b.length;
            }
        }
        else if (_.isArray(a)) {
            // handles cases like this: "id": [ "java.lang.Long", 16],
            assert.strictEqual(a[0], b[0]);
            assert.strictEqual(a.length, 2);
            assert.strictEqual(b.length, 2);
            return _compareIds(a[1], b[1]);
        }
        else {
            dlog('Whatup?', a, b);
            assert(false, 'Unexpected element id type:' + typeof (a));
        }
    }
    // ### `_compareById()`
    // Compares two elements by their id
    function _compareById(a, b) {
        assert.strictEqual(typeof a.id, typeof b.id);
        assert.ok(!_.isUndefined(a.id));
        return _compareIds(a.id, b.id);
    }
    // ### `_sortElements()`
    // Called for each key,obj in a property container, this processes each object that smells like an array of elements
    function _sortElements(obj, key) {
        if (_smellsLikeArrayOfElements(obj)) {
            obj[1] = obj[1].sort(_compareById);
        }
        return obj;
    }
    // ### `_sortPropertyContainers()`
    // Called for each key,obj in an Element, this processes each object that smells like a 'property container',
    // which includes vertex `properties` hashmaps, and `inE` and `outE` edges.
    function _sortPropertyContainers(obj, key) {
        if (_smellsLikeAPropertyContainer(obj)) {
            return _.mapValues(obj, _sortElements);
        }
        else {
            return obj;
        }
    }
    // ### `_parseVertex()`
    // Parse one line of text from a Tinkerpop graphson stream, yielding one vertex.
    function _parseVertex(line) {
        var vertex = JSON.parse(line);
        assert.ok(_smellsLikeAnElement(vertex));
        // A vertex is an object, i.e. a key,value map.
        // We don't sort the keys of the object, leaving that to jsonStableStringify below.
        // But a vertex values contain `property containers`, each of which may contain embedded arrays of elements.
        return _.mapValues(vertex, _sortPropertyContainers);
    }
    // ### `prettyGraphSONString(ugly: string)`
    // Make a GraphSON string pretty, adding indentation and deterministic format.
    function _prettyGraphSONString(ugly) {
        var lines = ugly.trim().split(require('os').EOL);
        var vertices = _.map(lines, function (line) { return _parseVertex(line); });
        vertices.sort(_compareById);
        // Compute the stable JSON.
        var stringifyOpts = {
            space: 2
        };
        var prettyString = jsonStableStringify(vertices, stringifyOpts) + '\n';
        return prettyString;
    }
    // ### `_jsifyCollection(javaCollection: Java.Collection)`
    // Turn a Java Collection into a JavaScript array, recursively calling jsify.
    function _jsifyCollection(javaCollection) {
        var arr = [];
        var it = javaCollection.iterator();
        while (it.hasNext()) {
            var elem = it.next();
            var obj = jsify(elem);
            arr.push(obj);
        }
        return arr;
    }
    // ### `_jsifyMap(javaMap: Java.Map)`
    // Turn a Java Map into a JavaScript object, recursively calling jsify.
    function _jsifyMap(javaMap) {
        // it seems this type of coercion could be ported to node-java
        // https://github.com/joeferner/node-java/issues/56
        var map = {};
        var it = javaMap.entrySet().iterator();
        while (it.hasNext()) {
            var pair = it.next();
            var key = pair.getKey();
            map[key] = jsify(pair.getValue());
        }
        return map;
    }
    // ### `_jsifyMap(javaMapEntry: Java.Map$Entry)`
    // Turn a Java Map$Entry into a MapEntry object, recursively calling jsify.
    function _jsifyMapEntry(javaMapEntry) {
        var mapEntry = {
            key: jsify(javaMapEntry.getKey()),
            value: jsify(javaMapEntry.getValue())
        };
        return mapEntry;
    }
    // ### `_jsifyBulkSet(bulkSet: Java.BulkSet)`
    // Turn a TinkerPop BulkSet into an array of objects with key/count fields.
    function _jsifyBulkSet(bulkSet) {
        var arr = [];
        var it = bulkSet.iterator();
        while (it.hasNext()) {
            var key = it.next();
            var count = bulkSet.get(key);
            var elem = {
                key: jsify(key),
                count: count
            };
            arr.push(elem);
        }
        return arr;
    }
    // ### `_jsifyPath(path: Java.Path)`
    // Turn a TinkerPop Path into an array of objects with object/labels fields.
    function _jsifyPath(path) {
        // Iterate in parallel over objects and labels.
        var objects = _jsifyCollection(path.objects());
        var labelSets = _jsifyCollection(path.labels()); // TODO: Java.List<Set<String>>
        var zipped = _.zip(objects, labelSets);
        var arr = _.map(zipped, function (pair) {
            var object = pair[0];
            var labels = pair[1];
            labels.sort();
            return { object: jsify(object), labels: labels };
        });
        return arr;
    }
    // ### Non-exported variables
    var _groovyScriptEngineName = 'Groovy';
    var _javaScriptEngineName = 'JavaScript';
    var _groovyScriptEngine;
})(Tinkerpop || (Tinkerpop = {}));
function afterJvm() {
    Tinkerpop.initialize();
    return BluePromise.resolve();
}
Tinkerpop.Java.getJava().registerClientP(undefined, afterJvm);
module.exports = Tinkerpop;
//# sourceMappingURL=ts-tinkerpop.js.map