/// <reference path="java.d.ts" />
/// <reference path="../typings/bluebird/bluebird.d.ts" />
/// <reference path="../typings/debug/debug.d.ts" />
/// <reference path="../typings/lodash/lodash.d.ts" />
/// <reference path="../typings/power-assert/power-assert.d.ts" />
import _autoImport = require('./autoImport');
import _java = require('redseal-java');
import BluePromise = require('bluebird');
declare module Tinkerpop {
    var autoImport: typeof _autoImport;
    var java: typeof _java;
    var __: Java.com.tinkerpop.gremlin.process.graph.traversal.__.Static;
    var Compare: Java.com.tinkerpop.gremlin.structure.Compare.Static;
    var GraphSONWriter: Java.com.tinkerpop.gremlin.structure.io.graphson.GraphSONWriter.Static;
    var GremlinGroovyScriptEngine: Java.com.tinkerpop.gremlin.groovy.jsr223.GremlinGroovyScriptEngine.Static;
    var ScriptEngineLambda: Java.com.tinkerpop.gremlin.process.computer.util.ScriptEngineLambda.Static;
    var T: Java.com.tinkerpop.gremlin.process.T.Static;
    var TinkerFactory: Java.com.tinkerpop.gremlin.tinkergraph.structure.TinkerFactory.Static;
    var TinkerGraph: Java.com.tinkerpop.gremlin.tinkergraph.structure.TinkerGraph.Static;
    var ByteArrayOutputStream: Java.java.io.ByteArrayOutputStream.Static;
    var GroovyLambda: Java.co.redseal.gremlinnode.function_.GroovyLambda.Static;
    var NULL: Java.org.codehaus.groovy.runtime.NullObject;
    var UTF8: string;
    function initialize(): void;
    function id(n: number): Java.Object;
    function ids(a: number[]): Java.array_t<Java.Object>;
    function newJavaScriptLambda(javascript: string): Java.ScriptEngineLambda;
    function newGroovyLambda(groovyFragment: string): Java.ScriptEngineLambda;
    function newGroovyClosure(groovyClosureString: string): Java.GroovyLambda;
    function vertexStringify(vertex: Java.Vertex): string;
    function vertexToJson(vertex: Java.Vertex): any;
    function edgeStringify(edge: Java.Edge): string;
    function edgeToJson(edge: Java.Edge): any;
    function isJavaObject(e: any): boolean;
    function asJavaObject(obj: Java.object_t): Java.Object;
    function isVertex(v: any): boolean;
    function asVertex(v: Java.object_t): Java.Vertex;
    function isEdge(e: any): boolean;
    function asEdge(e: Java.object_t): Java.Edge;
    interface ConsumeObject {
        (item: Java.Object): BluePromise<void>;
    }
    function forEach(javaIterator: Java.Iterator, consumer: ConsumeObject): BluePromise<void>;
    function asJSON(traversal: Java.Traversal): any;
    function simplifyVertexProperties(obj: any): any;
}
export = Tinkerpop;
