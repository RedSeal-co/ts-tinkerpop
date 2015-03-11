/// <reference path='../typings/bluebird/bluebird.d.ts' />
/// <reference path='../typings/debug/debug.d.ts' />
/// <reference path='../typings/java/java.d.ts' />
/// <reference path='../typings/lodash/lodash.d.ts' />
/// <reference path='../typings/power-assert/power-assert.d.ts' />
var _ = require('lodash');
var assert = require('power-assert');
var BluePromise = require('bluebird');
var debug = require('debug');
var java = require('java');
// # ts-tinkerpop
// Helper functions for Typescript applications using [TinkerPop 3]() via [node-java](https://github.com/joeferner/node-java).
//
// See the README.md for usage notes.
var Tinkerpop;
(function (Tinkerpop) {
    'use strict';
    var dlog = debug('ts-tinkerpop:index');
    // ### Exported variables
    // #### TinkerPop Classes
    Tinkerpop.__;
    Tinkerpop.Compare;
    Tinkerpop.GraphSONWriter;
    Tinkerpop.GremlinGroovyScriptEngine;
    Tinkerpop.ScriptEngineLambda;
    Tinkerpop.T;
    Tinkerpop.TinkerFactory;
    Tinkerpop.TinkerGraph;
    // #### Other Java classes
    Tinkerpop.ByteArrayOutputStream;
    Tinkerpop.GroovyLambda;
    // #### Useful singleton variables
    // An empty array that may be used where a method expects an array of Java String (or Object).
    Tinkerpop.noargs;
    // The groovy runtime NULL object.
    Tinkerpop.NULL;
    // The UTF8 Charset specifier
    Tinkerpop.UTF8;
    // ### Exported Functions
    // ### *initialize()* should be called once just after java has been configured.
    // Java configuration includes classpath, options, and asyncOptions.
    // If this method is called before configuration, the java.import calls will likely
    // fail due to the classes not being on the classpath.
    // This method must be called before any of the exported vars above are accessed.
    // It is wasteful, but not an error, to call this method more than once.
    function initialize() {
        Tinkerpop.__ = java.import('com.tinkerpop.gremlin.process.graph.traversal.__');
        Tinkerpop.ByteArrayOutputStream = java.import('java.io.ByteArrayOutputStream');
        Tinkerpop.Compare = java.import('com.tinkerpop.gremlin.structure.Compare');
        Tinkerpop.GraphSONWriter = java.import('com.tinkerpop.gremlin.structure.io.graphson.GraphSONWriter');
        Tinkerpop.GremlinGroovyScriptEngine = java.import('com.tinkerpop.gremlin.groovy.jsr223.GremlinGroovyScriptEngine');
        Tinkerpop.GroovyLambda = java.import('co.redseal.gremlinnode.function.GroovyLambda');
        Tinkerpop.noargs = java.newArray('java.lang.String', []);
        Tinkerpop.NULL = java.callStaticMethodSync('org.codehaus.groovy.runtime.NullObject', 'getNullObject');
        Tinkerpop.ScriptEngineLambda = java.import('com.tinkerpop.gremlin.process.computer.util.ScriptEngineLambda');
        Tinkerpop.T = java.import('com.tinkerpop.gremlin.process.T');
        Tinkerpop.TinkerFactory = java.import('com.tinkerpop.gremlin.tinkergraph.structure.TinkerFactory');
        Tinkerpop.TinkerGraph = java.import('com.tinkerpop.gremlin.tinkergraph.structure.TinkerGraph');
        Tinkerpop.UTF8 = java.import('java.nio.charset.StandardCharsets').UTF_8.nameSync();
        // TODO: provide a separate factory class for script engine instances.
        _groovyScriptEngine = new Tinkerpop.GremlinGroovyScriptEngine();
        dlog('Tinkerpop helper initialized.');
    }
    Tinkerpop.initialize = initialize;
    // ### Exported Functions
    function id(n) {
        return java.newLong(n);
    }
    Tinkerpop.id = id;
    function ids(a) {
        return java.newArray('java.lang.Object', _.map(a, function (n) { return id(n); }));
    }
    Tinkerpop.ids = ids;
    function S(strs) {
        return java.newArray('java.lang.String', strs);
    }
    Tinkerpop.S = S;
    function newJavaScriptLambda(javascript) {
        return new Tinkerpop.ScriptEngineLambda(_javaScriptEngineName, javascript);
    }
    Tinkerpop.newJavaScriptLambda = newJavaScriptLambda;
    ;
    function newGroovyLambda(groovyFragment) {
        // The groovy string here is *not* a closure
        // It is a code fragment with implicit parameters a,b,c, e.g.: 'println(a)'
        assert.ok(!_isClosure(groovyFragment));
        return new Tinkerpop.ScriptEngineLambda(_groovyScriptEngineName, groovyFragment);
    }
    Tinkerpop.newGroovyLambda = newGroovyLambda;
    ;
    function newGroovyClosure(groovyClosureString) {
        // The groovy string must be a closure expression, e.g. '{ x -> println(x) }'.
        assert.ok(_isClosure(groovyClosureString));
        return new Tinkerpop.GroovyLambda(groovyClosureString, _groovyScriptEngine);
    }
    Tinkerpop.newGroovyClosure = newGroovyClosure;
    ;
    function vertexStringify(vertex) {
        var stream = new Tinkerpop.ByteArrayOutputStream();
        var builder = Tinkerpop.GraphSONWriter.buildSync();
        var writer = builder.createSync();
        writer.writeVertexSync(stream, vertex);
        return stream.toStringSync(Tinkerpop.UTF8);
    }
    Tinkerpop.vertexStringify = vertexStringify;
    function vertexToJson(vertex) {
        return JSON.parse(vertexStringify(vertex));
    }
    Tinkerpop.vertexToJson = vertexToJson;
    function edgeStringify(edge) {
        var stream = new Tinkerpop.ByteArrayOutputStream();
        var builder = Tinkerpop.GraphSONWriter.buildSync();
        var writer = builder.createSync();
        writer.writeEdgeSync(stream, edge);
        return stream.toStringSync(Tinkerpop.UTF8);
    }
    Tinkerpop.edgeStringify = edgeStringify;
    ;
    function edgeToJson(edge) {
        return JSON.parse(edgeStringify(edge));
    }
    Tinkerpop.edgeToJson = edgeToJson;
    ;
    function isJavaObject(e) {
        return java.instanceOf(e, 'java.lang.Object');
    }
    Tinkerpop.isJavaObject = isJavaObject;
    function asJavaObject(obj) {
        if (isJavaObject(obj)) {
            return obj;
        }
        else {
            throw new Error('asJavaObject given an object that is not a Java.Object');
        }
    }
    Tinkerpop.asJavaObject = asJavaObject;
    function isVertex(v) {
        return java.instanceOf(v, 'com.tinkerpop.gremlin.structure.Vertex');
    }
    Tinkerpop.isVertex = isVertex;
    function asVertex(v) {
        if (isVertex(v)) {
            return v;
        }
        else {
            throw new Error('asVertex given an object that is not a Vertex');
        }
    }
    Tinkerpop.asVertex = asVertex;
    function isEdge(e) {
        return java.instanceOf(e, 'com.tinkerpop.gremlin.structure.Edge');
    }
    Tinkerpop.isEdge = isEdge;
    function asEdge(e) {
        if (isEdge(e)) {
            return e;
        }
        else {
            throw new Error('asEdge given an object that is not an Edge');
        }
    }
    Tinkerpop.asEdge = asEdge;
    // Applies *consumer* to each Java.Object returned by the *javaIterator*.
    // *javaIterator* may be any type that implements java.util.Iterator, including a tinkerpop Traversal.
    // *consumer* is function that will do some work on a Java.Object asychronously, returning a Promise for its completion.
    // Returns a promise that is resolved when all objects have been consumed.
    function forEach(javaIterator, consumer) {
        function _eachIterator(javaIterator, consumer) {
            return javaIterator.hasNextPromise().then(function (hasNext) {
                if (!hasNext) {
                    dlog('forEach: done');
                    return BluePromise.resolve();
                }
                else {
                    return javaIterator.nextPromise().then(function (obj) {
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
    function asJSONSync(traversal) {
        var array = traversal.toListSync().toArraySync().map(function (elem) { return _asJSON(elem); });
        return JSON.parse(JSON.stringify(array));
    }
    Tinkerpop.asJSONSync = asJSONSync;
    ;
    function simplifyVertexProperties(obj) {
        // Given *obj* which is a javascript object created by asJSONSync(),
        // return a simpler representation of the object that is more convenient for unit tests.
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
    // ### Non-exported Functions
    function _isClosure(val) {
        var closureRegex = /^\{.*\}$/;
        return _.isString(val) && val.search(closureRegex) > -1;
    }
    ;
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
            // Handle Vertex
            return edgeToJson(asEdge(elem));
        }
        else if (isJavaObject(elem)) {
            // If we still have an unrecognized Java object, convert it to a string.
            var javaObj = elem;
            return { 'javaClass': javaObj.getClassSync().getNameSync(), 'toString': javaObj.toStringSync() };
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
    // ### Non-exported variables
    var _groovyScriptEngineName = 'Groovy';
    var _javaScriptEngineName = 'JavaScript';
    var _groovyScriptEngine;
})(Tinkerpop || (Tinkerpop = {}));
module.exports = Tinkerpop;
//# sourceMappingURL=index.js.map