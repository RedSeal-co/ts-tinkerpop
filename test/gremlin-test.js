// # gremlin-test.ts
/// <reference path='../typings/chai/chai.d.ts'/>
/// <reference path='../typings/glob/glob.d.ts' />
/// <reference path='../typings/java/java.d.ts' />
/// <reference path='../typings/lodash/lodash.d.ts' />
/// <reference path='../typings/mocha/mocha.d.ts'/>
/// <reference path='../typings/node/node.d.ts'/>
/// <reference path='../typings/should/should.d.ts'/>
//
// Tests that gremlin-node is installed and working.  Test based on gremlin-node documentation and
// the built-in "TinkerGraph" sample graph.
//
// See https://github.com/inolen/gremlin-node
//
// In many of these tests, one must understand the difference between creating a "traversal", which
// is the manifestation of a particular sequence of Gremlin steps, and executing that traversal to
// retrieve the data from the graph.  This distinction is important to understand in the design of
// efficient applications.  Typically, the desired application logic should be encapsulated in as
// few traversals as possible in order to make the backend do most of the computation, and to avoid
// latency between client (Node.js) and server (graph database).  To aid in this understanding, the
// variables in this test representing traversals are named with a "Traversal" suffix, and are
// instantiated explicitly.
'use strict';
require('source-map-support').install();
var chai = require('chai');
var glob = require('glob');
var java = require('java');
var noargs;
before(function (done) {
    java.asyncOptions = {
        promiseSuffix: 'Promise',
        promisify: require('bluebird').promisify
    };
    var filenames = glob.sync('target/dependency/**/*.jar');
    filenames.forEach(function (name) {
        java.classpath.push(name);
    });
    noargs = java.newArray('java.lang.Object', []);
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
    var TinkerGraph;
    var graph;
    before(function (done) {
        TinkerGraph = java.import('com.tinkerpop.gremlin.tinkergraph.structure.TinkerGraph');
        expect(TinkerGraph).to.be.ok;
        done();
    });
    // ## TinkerGraph in-memory
    // Tests using an empty in-memory TinkerGraph database instance.
    describe('TinkerGraph empty', function () {
        before(function () {
            graph = TinkerGraph.openSync();
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
            var allVerticesTraversal = graph.VSync(noargs);
            // The "count" method applies to a Traversal, destructively measuring the number of
            // elements in it.
            allVerticesTraversal.countSync().next(function (err, count) {
                expect(err).to.not.exist;
                expect(count.valueOf()).to.equal(0);
                // Count edges.
                var allEdgesTraversal = graph.ESync(noargs);
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
        var TinkerFactory;
        var graph;
        before(function () {
            TinkerFactory = java.import('com.tinkerpop.gremlin.tinkergraph.structure.TinkerFactory');
            expect(TinkerFactory).to.be.ok;
            graph = TinkerFactory.createClassicSync();
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
            var props = java.newArray('java.lang.String', ['name']);
            var distinctNamesTraversal = graph.VSync(noargs).valuesSync(props).dedupSync();
            expect(distinctNamesTraversal).to.be.ok;
            return distinctNamesTraversal.toListPromise().then(function (list) { return list.toArrayPromise(); }).then(function (data) {
                var expected = ['lop', 'vadas', 'marko', 'peter', 'ripple', 'josh'];
                // Sort data to ignore sequence differences.
                expected.sort();
                data.sort();
                expect(data).to.deep.equal(expected);
            });
        });
    });
});
//# sourceMappingURL=gremlin-test.js.map