/// <reference path='typings/java/java.d.ts' />
/// <reference path='typings/lodash/lodash.d.ts' />
var _ = require('lodash');
var java = require('java');
var Tinkerpop;
(function (Tinkerpop) {
    'use strict';
    Tinkerpop.__;
    Tinkerpop.ByteArrayOutputStream;
    Tinkerpop.GraphSONWriter;
    Tinkerpop.GroovyLambda;
    Tinkerpop.noargs;
    Tinkerpop.NULL;
    Tinkerpop.ScriptEngineLambda;
    Tinkerpop.T;
    Tinkerpop.TinkerFactory;
    Tinkerpop.TinkerGraph;
    Tinkerpop.UTF8;
    // ### *initialize()* should be called once just after java has been configured.
    // Java configuration includes classpath, options, and asyncOptions.
    // If this method is called before configuration, the java.import calls will likely
    // fail due to the classes not being on the classpath.
    // This method must be called before any of the exported vars above are accessed.
    // It is wasteful, but not an error, to call this method more than once.
    function initialize() {
        Tinkerpop.__ = java.import('com.tinkerpop.gremlin.process.graph.traversal.__');
        Tinkerpop.ByteArrayOutputStream = java.import('java.io.ByteArrayOutputStream');
        Tinkerpop.GraphSONWriter = java.import('com.tinkerpop.gremlin.structure.io.graphson.GraphSONWriter');
        Tinkerpop.GroovyLambda = java.import('co.redseal.gremlinnode.function.GroovyLambda');
        Tinkerpop.noargs = java.newArray('java.lang.String', []);
        Tinkerpop.NULL = java.callStaticMethodSync('org.codehaus.groovy.runtime.NullObject', 'getNullObject');
        Tinkerpop.ScriptEngineLambda = java.import('com.tinkerpop.gremlin.process.computer.util.ScriptEngineLambda');
        Tinkerpop.T = java.import('com.tinkerpop.gremlin.process.T');
        Tinkerpop.TinkerFactory = java.import('com.tinkerpop.gremlin.tinkergraph.structure.TinkerFactory');
        Tinkerpop.TinkerGraph = java.import('com.tinkerpop.gremlin.tinkergraph.structure.TinkerGraph');
        Tinkerpop.UTF8 = java.import('java.nio.charset.StandardCharsets').UTF_8.nameSync();
    }
    Tinkerpop.initialize = initialize;
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
        return new Tinkerpop.ScriptEngineLambda(_javaScriptEngineName, javascript); //
    }
    Tinkerpop.newJavaScriptLambda = newJavaScriptLambda;
    ;
    function newGroovyLambda(groovy) {
        return new Tinkerpop.ScriptEngineLambda(_groovyScriptEngineName, groovy);
    }
    Tinkerpop.newGroovyLambda = newGroovyLambda;
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
    function asVertex(v) {
        if (java.instanceOf(v, 'com.tinkerpop.gremlin.structure.Vertex')) {
            return v;
        }
        else {
            throw new Error('asVertex given an object that is not a Vertex');
        }
    }
    Tinkerpop.asVertex = asVertex;
    var _groovyScriptEngineName = 'Groovy';
    var _javaScriptEngineName = 'JavaScript';
})(Tinkerpop || (Tinkerpop = {}));
module.exports = Tinkerpop;
//# sourceMappingURL=index.js.map