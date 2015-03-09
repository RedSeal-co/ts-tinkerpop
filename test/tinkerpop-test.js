// # tinkerpop-test.ts
/// <reference path='../typings/bluebird/bluebird.d.ts' />
/// <reference path='../typings/chai/chai.d.ts'/>
/// <reference path='../typings/debug/debug.d.ts' />
/// <reference path='../typings/glob/glob.d.ts' />
/// <reference path='../typings/java/java.d.ts' />
/// <reference path='../typings/lodash/lodash.d.ts' />
/// <reference path='../typings/mocha/mocha.d.ts'/>
/// <reference path='../typings/node/node.d.ts'/>
/// <reference path='../typings/should/should.d.ts'/>
'use strict';
require('source-map-support').install();
var BluePromise = require('bluebird');
var chai = require('chai');
var debug = require('debug');
var glob = require('glob');
var java = require('java');
var T = require('../index');
var dlog = debug('ts-tinkerpop:test');
before(function (done) {
    java.asyncOptions = {
        promiseSuffix: 'Promise',
        promisify: require('bluebird').promisify
    };
    var filenames = glob.sync('target/**/*.jar');
    filenames.forEach(function (name) {
        dlog(name);
        java.classpath.push(name);
    });
    T.initialize();
    done();
});
describe('Gremlin', function () {
    var async = require('async');
    var expect = chai.expect;
    var semaphore = require('semaphore');
    var stringify = require('json-stable-stringify');
    var temp = require('temp');
    // Cleanup temp files at exit.
    temp.track();
    var graph;
    before(function (done) {
        expect(T.TinkerGraph).to.be.ok;
        done();
    });
    // ## TinkerGraph in-memory
    // Tests using an empty in-memory TinkerGraph database instance.
    describe('TinkerGraph empty', function () {
        before(function () {
            graph = T.TinkerGraph.openSync();
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
            var allVerticesTraversal = graph.VSync(T.noargs);
            // The "count" method applies to a Traversal, destructively measuring the number of
            // elements in it.
            allVerticesTraversal.countSync().next(function (err, count) {
                expect(err).to.not.exist;
                expect(count.valueOf()).to.equal(0);
                // Count edges.
                var allEdgesTraversal = graph.ESync(T.noargs);
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
            expect(T.TinkerFactory).to.be.ok;
            graph = T.TinkerFactory.createClassicSync();
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
            var distinctNamesTraversal = graph.VSync(T.noargs).valuesSync(T.S(['name'])).dedupSync();
            expect(distinctNamesTraversal).to.be.ok;
            return distinctNamesTraversal.toListPromise().then(function (list) { return list.toArrayPromise(); }).then(function (data) {
                var expected = ['lop', 'vadas', 'marko', 'peter', 'ripple', 'josh'];
                // Sort data to ignore sequence differences.
                expected.sort();
                data.sort();
                expect(data).to.deep.equal(expected);
            });
        });
        // See http://gremlindocs.com/#recipes/shortest-path, first method
        it('can inefficiently find many paths between two nodes', function (done) {
            var traversal = graph.VSync(T.ids([2]));
            traversal = traversal.asSync('x');
            traversal = traversal.bothSync(T.noargs);
            //       traversal = traversal.repeatSync();
            //         .jump('x', function (it) { return it.object.id != "6" && it.loops < 6; }).path();
            //       traversal.toJSON(function(err, data) {
            //         should.not.exist(err);
            //         expect(data).to.be.ok;
            //         expect(data).to.have.length(39);
            //         done();
            //       });
            expect(traversal).to.be.ok;
            done();
        });
        it('g.V().has("name", "marko") -> v.value("name")', function () {
            return graph.VSync(T.noargs).hasSync('name', 'marko').nextPromise().then(function (v) {
                expect(v).to.be.ok;
                var name = v.valueSync('name');
                expect(name).to.be.equal('marko');
            });
        });
        it('g.V().valueSync("name")', function () {
            return graph.VSync(T.noargs).valuesSync(T.S(['name'])).toListPromise().then(function (list) { return list.toArrayPromise(); }).then(function (data) {
                expect(data).to.be.ok;
                var expected = ['marko', 'vadas', 'lop', 'josh', 'ripple', 'peter'];
                expect(data).to.deep.equal(expected);
            });
        });
        it('filter() with JavaScript lambda', function () {
            var js = 'a.get().value("name") == "lop"';
            var lambda = T.newJavaScriptLambda(js);
            return graph.VSync(T.noargs).filterSync(lambda).toListPromise().then(function (list) { return list.toArrayPromise(); }).then(function (recs) {
                expect(recs).to.be.ok;
                expect(recs.length).to.equal(1);
                var v = T.asVertex(recs[0]);
                var vertexObj = T.vertexToJson(v);
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
            var __ = T.__;
            // Use the result of the function as a key to the map of traversal choices.
            var groovy = 'a.value("name").length()';
            var lambda = T.newGroovyLambda(groovy);
            var chosen = graph.VSync(T.noargs).hasSync('age').chooseSync(lambda).optionSync(5, __.inSync(T.noargs)).optionSync(4, __.outSync(T.noargs)).optionSync(3, __.bothSync(T.noargs)).valuesSync(T.S(['name']));
            return chosen.toListPromise().then(function (list) { return list.toArrayPromise(); }).then(function (actual) {
                var expected = ['marko', 'ripple', 'lop'];
                expect(actual.sort()).to.deep.equal(expected.sort());
            });
        });
        it('choose(Function).option with integer choice, groovy closure', function () {
            var __ = T.__;
            // Use the result of the function as a key to the map of traversal choices.
            var groovy = '{ vertex -> vertex.value("name").length() }';
            var lambda = T.newGroovyClosure(groovy);
            var chosen = graph.VSync(T.noargs).hasSync('age').chooseSync(lambda).optionSync(5, __.inSync(T.noargs)).optionSync(4, __.outSync(T.noargs)).optionSync(3, __.bothSync(T.noargs)).valuesSync(T.S(['name']));
            return chosen.toListPromise().then(function (list) { return list.toArrayPromise(); }).then(function (actual) {
                var expected = ['marko', 'ripple', 'lop'];
                expect(actual.sort()).to.deep.equal(expected.sort());
            });
        });
        it('T.forEach(g.V())', function () {
            var traversal = graph.VSync(T.noargs);
            return T.forEach(traversal, function (obj) {
                var v = T.asVertex(obj);
                var json = T.vertexToJson(v);
                expect(json).to.include.keys(['id', 'label', 'type', 'properties']);
                expect(json.type).to.equal('vertex');
                return BluePromise.resolve();
            });
        });
        it('T.forEach(g.E())', function () {
            var traversal = graph.ESync(T.noargs);
            return T.forEach(traversal, function (obj) {
                var e = T.asEdge(obj);
                var json = T.edgeToJson(e);
                expect(json).to.include.keys(['id', 'label', 'type', 'properties', 'inV', 'outV', 'inVLabel', 'outVLabel']);
                expect(json.type).to.equal('edge');
                return BluePromise.resolve();
            });
        });
    });
});
//# sourceMappingURL=tinkerpop-test.js.map