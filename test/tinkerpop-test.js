// # tinkerpop-test.ts
/// <reference path='../typings/bluebird/bluebird.d.ts' />
/// <reference path='../typings/chai/chai.d.ts'/>
/// <reference path='../typings/debug/debug.d.ts' />
/// <reference path='../typings/glob/glob.d.ts' />
/// <reference path='../typings/java/java.d.ts' />
/// <reference path='../typings/mocha/mocha.d.ts'/>
/// <reference path='../typings/node/node.d.ts'/>
'use strict';
require('source-map-support').install();
var BluePromise = require('bluebird');
var chai = require('chai');
var debug = require('debug');
var glob = require('glob');
var java = require('java');
var TP = require('../lib/index');
var dlog = debug('ts-tinkerpop:test');
before(function (done) {
    java.asyncOptions = {
        asyncSuffix: '',
        syncSuffix: 'Sync',
        promiseSuffix: 'Promise',
        promisify: require('bluebird').promisify
    };
    var filenames = glob.sync('target/**/*.jar');
    filenames.forEach(function (name) {
        dlog(name);
        java.classpath.push(name);
    });
    TP.initialize();
    done();
});
describe('Gremlin', function () {
    var expect = chai.expect;
    var graph;
    before(function (done) {
        expect(TP.TinkerGraph).to.be.ok;
        done();
    });
    // ## TinkerGraph in-memory
    // Tests using an empty in-memory TinkerGraph database instance.
    describe('TinkerGraph empty', function () {
        before(function () {
            graph = TP.TinkerGraph.openSync();
            expect(graph).to.be.ok;
        });
        after(function (done) {
            if (graph) {
                graph.close(function () {
                    graph = null;
                    done();
                });
            }
            else {
                done();
            }
        });
        it('should initialize', function () {
            // intentionally blank
        });
        // Check that the Gremlin statements `graph.V.count()` and `graph.E.count()` return `0`.
        it('should be empty', function (done) {
            // Count vertices.
            var allVerticesTraversal = graph.VSync();
            // The "count" method applies to a Traversal, destructively measuring the number of
            // elements in it.
            allVerticesTraversal.countSync().next(function (err, count) {
                expect(err).to.not.exist;
                expect(count.valueOf()).to.equal(0);
                // Count edges.
                var allEdgesTraversal = graph.ESync();
                allEdgesTraversal.countSync().next(function (err, count) {
                    expect(err).to.not.exist;
                    expect(count.valueOf()).to.equal(0);
                    done();
                });
            });
        });
    });
    // ## TinkerGraph built-in example
    // Tests using the graph referenced in Gremlin documentation examples like
    // https://github.com/tinkerpop/gremlin/wiki/Basic-Graph-Traversals
    describe('TinkerGraph built-in example', function () {
        var graph;
        before(function () {
            expect(TP.TinkerFactory).to.be.ok;
            graph = TP.TinkerFactory.createClassicSync();
            expect(graph).to.be.ok;
        });
        after(function (done) {
            if (graph) {
                graph.close(function () {
                    graph = null;
                    done();
                });
            }
            else {
                done();
            }
        });
        it('should initialize', function () {
            // intentionally blank
        });
        // To extract the unique values of the "name" property from all vertices, the canonical
        // Gremlin would be `graph.V.value('name').dedup`.  However, it can also be written with
        // the shortcut syntax for property access: `graph.V.name.dedup`.
        it('has certain names', function () {
            var distinctNamesTraversal = graph.VSync().valuesSync('name').dedupSync();
            expect(distinctNamesTraversal).to.be.ok;
            return distinctNamesTraversal.toListPromise().then(function (list) { return list.toArrayPromise(); }).then(function (data) {
                var expected = ['lop', 'vadas', 'marko', 'peter', 'ripple', 'josh'];
                // Sort data to ignore sequence differences.
                expected.sort();
                data.sort();
                expect(data).to.deep.equal(expected);
            });
        });
        it('g.V().has("name", "marko") -> v.value("name")', function () {
            return graph.VSync().hasSync('name', 'marko').nextPromise().then(function (v) {
                expect(v).to.be.ok;
                var name = v.valueSync('name');
                expect(name).to.be.equal('marko');
            });
        });
        it('g.V().valueSync("name")', function () {
            return graph.VSync().valuesSync('name').toListPromise().then(function (list) { return list.toArrayPromise(); }).then(function (data) {
                expect(data).to.be.ok;
                var expected = ['marko', 'vadas', 'lop', 'josh', 'ripple', 'peter'];
                expect(data).to.deep.equal(expected);
            });
        });
        it('filter() with JavaScript lambda', function () {
            var js = 'a.get().value("name") == "lop"';
            var lambda = TP.newJavaScriptLambda(js);
            return graph.VSync().filterSync(lambda).toListPromise().then(function (list) { return list.toArrayPromise(); }).then(function (recs) {
                expect(recs).to.be.ok;
                expect(recs.length).to.equal(1);
                var v = TP.asVertex(recs[0]);
                var vertexObj = TP.vertexToJson(v);
                var expected = {
                    id: 3,
                    label: 'vertex',
                    type: 'vertex',
                    properties: {
                        name: [{ id: 4, value: 'lop', properties: {} }],
                        lang: [{ id: 5, value: 'java', properties: {} }]
                    }
                };
                expect(vertexObj).to.deep.equal(expected);
            });
        });
        it('choose(Function).option with integer choice, groovy fragment', function () {
            var __ = TP.__;
            // Use the result of the function as a key to the map of traversal choices.
            var groovy = 'a.value("name").length()';
            var lambda = TP.newGroovyLambda(groovy);
            var chosen = graph.VSync().hasSync('age').chooseSync(lambda).optionSync(5, __.inSync()).optionSync(4, __.outSync()).optionSync(3, __.bothSync()).valuesSync('name');
            return chosen.toListPromise().then(function (list) { return list.toArrayPromise(); }).then(function (actual) {
                var expected = ['marko', 'ripple', 'lop'];
                expect(actual.sort()).to.deep.equal(expected.sort());
            });
        });
        it('choose(Function).option with integer choice, groovy closure', function () {
            var __ = TP.__;
            // Use the result of the function as a key to the map of traversal choices.
            var groovy = '{ vertex -> vertex.value("name").length() }';
            var lambda = TP.newGroovyClosure(groovy);
            var chosen = graph.VSync().hasSync('age').chooseSync(lambda).optionSync(5, __.inSync()).optionSync(4, __.outSync()).optionSync(3, __.bothSync()).valuesSync('name');
            return chosen.toListPromise().then(function (list) { return list.toArrayPromise(); }).then(function (actual) {
                var expected = ['marko', 'ripple', 'lop'];
                expect(actual.sort()).to.deep.equal(expected.sort());
            });
        });
        it('TP.forEach(g.V())', function () {
            var traversal = graph.VSync();
            return TP.forEach(traversal, function (obj) {
                var v = TP.asVertex(obj);
                var json = TP.vertexToJson(v);
                expect(json).to.include.keys(['id', 'label', 'type', 'properties']);
                expect(json.type).to.equal('vertex');
                return BluePromise.resolve();
            });
        });
        it('TP.forEach(g.E())', function () {
            var traversal = graph.ESync();
            return TP.forEach(traversal, function (obj) {
                var e = TP.asEdge(obj);
                var json = TP.edgeToJson(e);
                expect(json).to.include.keys(['id', 'label', 'type', 'properties', 'inV', 'outV', 'inVLabel', 'outVLabel']);
                expect(json.type).to.equal('edge');
                return BluePromise.resolve();
            });
        });
        it('TP.asJSONSync(vertices)', function () {
            var traversal = graph.VSync().hasSync('lang', TP.Compare.eq, 'java');
            var json = TP.asJSONSync(traversal);
            var expected = [
                {
                    id: 3,
                    label: 'vertex',
                    type: 'vertex',
                    properties: {
                        name: [{ id: 4, value: 'lop', properties: {} }],
                        lang: [{ id: 5, value: 'java', properties: {} }]
                    }
                },
                {
                    id: 5,
                    label: 'vertex',
                    type: 'vertex',
                    properties: {
                        name: [{ id: 8, value: 'ripple', properties: {} }],
                        lang: [{ id: 9, value: 'java', properties: {} }]
                    }
                }
            ];
            expect(json).to.deep.equal(expected);
        });
        it('TP.asJSONSync(vertices) with simplifyVertex', function () {
            var traversal = graph.VSync().hasSync('lang', TP.Compare.eq, 'java');
            var json = TP.simplifyVertexProperties(TP.asJSONSync(traversal));
            var expected = [
                {
                    id: 3,
                    label: 'vertex',
                    type: 'vertex',
                    properties: {
                        name: 'lop',
                        lang: 'java'
                    }
                },
                {
                    id: 5,
                    label: 'vertex',
                    type: 'vertex',
                    properties: {
                        name: 'ripple',
                        lang: 'java'
                    }
                }
            ];
            expect(json).to.deep.equal(expected);
        });
        it('TP.asJSONSync(edges)', function () {
            var traversal = graph.ESync().hasSync('weight', TP.Compare.eq, java.newFloat(1.0));
            var json = TP.asJSONSync(traversal);
            var expected = [
                {
                    inV: 4,
                    inVLabel: 'vertex',
                    outVLabel: 'vertex',
                    id: 8,
                    label: 'knows',
                    type: 'edge',
                    outV: 1,
                    properties: { weight: 1 }
                },
                {
                    inV: 5,
                    inVLabel: 'vertex',
                    outVLabel: 'vertex',
                    id: 10,
                    label: 'created',
                    type: 'edge',
                    outV: 4,
                    properties: { weight: 1 }
                }
            ];
            expect(json).to.deep.equal(expected);
        });
    });
});
//# sourceMappingURL=tinkerpop-test.js.map