// # tinkerpop-test.ts
/// <reference path='../typings/bluebird/bluebird.d.ts' />
/// <reference path='../typings/chai/chai.d.ts'/>
/// <reference path='../typings/debug/debug.d.ts' />
/// <reference path='../typings/glob/glob.d.ts' />
/// <reference path='../typings/mocha/mocha.d.ts'/>
/// <reference path='../typings/node/node.d.ts'/>
/// <reference path='../typings/tmp/tmp.d.ts'/>
'use strict';
require('source-map-support').install();
var BluePromise = require('bluebird');
var chai = require('chai');
var debug = require('debug');
var fs = require('fs');
var glob = require('glob');
var tmp = require('tmp');
var TP = require('../lib/ts-tinkerpop');
var expect = chai.expect;
var java = TP.java;
var dlog = debug('ts-tinkerpop:test');
before(function (done) {
    java.asyncOptions = {
        syncSuffix: '',
        promiseSuffix: 'P',
        promisify: require('bluebird').promisify
    };
    var filenames = glob.sync('target/**/*.jar');
    filenames.forEach(function (name) {
        dlog('classpath:', name);
        java.classpath.push(name);
    });
    TP.initialize();
    done();
});
describe('autoImport', function () {
    it('works for ArrayList', function () {
        var ArrayList = TP.autoImport('ArrayList');
        expect(ArrayList).to.exist;
    });
    it('works for Traversal', function () {
        var Traversal = TP.autoImport('Traversal');
        expect(Traversal).to.exist;
    });
});
describe('Gremlin', function () {
    var graph;
    before(function (done) {
        expect(TP.TinkerGraph).to.be.ok;
        done();
    });
    // ## TinkerGraph in-memory
    // Tests using an empty in-memory TinkerGraph database instance.
    describe('TinkerGraph empty', function () {
        before(function () {
            graph = TP.TinkerGraph.open();
            expect(graph).to.be.ok;
        });
        after(function (done) {
            if (graph) {
                graph.closeP().then(function () {
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
            var allVerticesTraversal = graph.V();
            // The "count" method applies to a Traversal, destructively measuring the number of
            // elements in it.
            allVerticesTraversal.count().nextP().then(function (count) {
                expect(count.valueOf()).to.equal(0);
                // Count edges.
                var allEdgesTraversal = graph.E();
                allEdgesTraversal.count().nextP().then(function (count) {
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
            graph = TP.TinkerFactory.createClassic();
            expect(graph).to.be.ok;
        });
        after(function (done) {
            if (graph) {
                graph.closeP().then(function () {
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
            var distinctNamesTraversal = graph.V().values('name').dedup();
            expect(distinctNamesTraversal).to.be.ok;
            return distinctNamesTraversal.toListP().then(function (list) { return list.toArrayP(); }).then(function (data) {
                var expected = ['lop', 'vadas', 'marko', 'peter', 'ripple', 'josh'];
                // Sort data to ignore sequence differences.
                expected.sort();
                data.sort();
                expect(data).to.deep.equal(expected);
            });
        });
        it('g.V().has("name", "marko") -> v.value("name")', function () {
            return graph.V().has('name', 'marko').nextP().then(function (v) {
                expect(v).to.be.ok;
                var name = v.value('name');
                expect(name).to.be.equal('marko');
            });
        });
        it('g.V().value("name")', function () {
            return graph.V().values('name').toListP().then(function (list) { return list.toArrayP(); }).then(function (data) {
                expect(data).to.be.ok;
                var expected = ['marko', 'vadas', 'lop', 'josh', 'ripple', 'peter'];
                expect(data).to.deep.equal(expected);
            });
        });
        it('filter() with JavaScript lambda', function () {
            var js = 'a.get().value("name") == "lop"';
            var lambda = TP.newJavaScriptLambda(js);
            return graph.V().filter(lambda).toListP().then(function (list) { return list.toArrayP(); }).then(function (recs) {
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
            var chosen = graph.V().has('age').choose(lambda).option(5, __.in()).option(4, __.out()).option(3, __.both()).values('name');
            return chosen.toListP().then(function (list) { return list.toArrayP(); }).then(function (actual) {
                var expected = ['marko', 'ripple', 'lop'];
                expect(actual.sort()).to.deep.equal(expected.sort());
            });
        });
        it('choose(Function).option with integer choice, groovy closure', function () {
            var __ = TP.__;
            // Use the result of the function as a key to the map of traversal choices.
            var groovy = '{ vertex -> vertex.value("name").length() }';
            var lambda = TP.newGroovyClosure(groovy);
            var chosen = graph.V().has('age').choose(lambda).option(5, __.in()).option(4, __.out()).option(3, __.both()).values('name');
            return chosen.toListP().then(function (list) { return list.toArrayP(); }).then(function (actual) {
                var expected = ['marko', 'ripple', 'lop'];
                expect(actual.sort()).to.deep.equal(expected.sort());
            });
        });
        it('TP.forEach(g.V())', function () {
            var traversal = graph.V();
            return TP.forEach(traversal, function (obj) {
                var v = TP.asVertex(obj);
                var json = TP.vertexToJson(v);
                expect(json).to.include.keys(['id', 'label', 'type', 'properties']);
                expect(json.type).to.equal('vertex');
                return BluePromise.resolve();
            });
        });
        it('TP.forEach(g.E())', function () {
            var traversal = graph.E();
            return TP.forEach(traversal, function (obj) {
                var e = TP.asEdge(obj);
                var json = TP.edgeToJson(e);
                expect(json).to.include.keys(['id', 'label', 'type', 'properties', 'inV', 'outV', 'inVLabel', 'outVLabel']);
                expect(json.type).to.equal('edge');
                return BluePromise.resolve();
            });
        });
        it('TP.asJSON(vertices)', function () {
            var traversal = graph.V().has('lang', TP.Compare.eq, 'java');
            var json = TP.asJSON(traversal);
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
        it('TP.asJSON(vertices) with simplifyVertex', function () {
            var traversal = graph.V().has('lang', TP.Compare.eq, 'java');
            var json = TP.simplifyVertexProperties(TP.asJSON(traversal));
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
        it('TP.asJSON(edges)', function () {
            var traversal = graph.E().has('weight', TP.Compare.eq, java.newFloat(1.0));
            var json = TP.asJSON(traversal);
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
describe('Groovy support', function () {
    var engine;
    before(function () {
        engine = TP.getGroovyEngine();
    });
    it('initializes', function () {
        expect(engine).to.exist;
    });
    it('does NOT come with test classes already imported', function () {
        var imports = engine.imports();
        expect(imports.toString()).to.not.contain('co.redseal.gremlinnode.testing');
    });
    it('accepts valid Groovy', function () {
        var groovy = engine.eval('{ it -> it.toString() }');
        expect(groovy).to.exist;
        expect(groovy.call(123)).to.deep.equal('123');
    });
    it('rejects invalid Groovy', function () {
        expect(function () {
            engine.eval('this is not valid Groovy');
            return;
        }).to.throw(Error);
    });
    it('importGroovy introduces types for newGroovyClosure but not newGroovyLambda', function () {
        // We're going to try to define a lambda that references an application-specific datatype.
        var groovy = '{ -> new TestClass() }';
        // Check that the TestClass is NOT in the Groovy imports already.
        var testClassName = 'co.redseal.gremlinnode.testing.TestClass';
        expect(engine.imports().toString()).to.not.contain(testClassName);
        // Make sure it IS in the classpath.
        var TestClass = TP.java.import(testClassName);
        expect(TestClass).to.exist;
        // First check that TestClass is not defined.
        expect(function () { return TP.newGroovyClosure(groovy); }).to.throw(/unable to resolve class TestClass/);
        expect(function () { return TP.newGroovyLambda('new TestClass()').get(); }).to.throw(/unable to resolve class TestClass/);
        // Now import it, and check that it shows up in the imports.
        TP.importGroovy(testClassName);
        dlog('engine.imports()', engine.imports().toString());
        expect(engine.imports().toString()).to.contain(testClassName);
        // Retry the lambda.
        var lambda = TP.newGroovyClosure(groovy);
        expect(lambda.get().toString()).to.deep.equal('TestClass');
        // Show that it does NOT affect newGroovyLambda.
        expect(function () { return TP.newGroovyLambda('new TestClass()').get(); }).to.throw(/unable to resolve class TestClass/);
    });
});
describe('GraphSON support', function () {
    var g;
    beforeEach(function (done) {
        TP.TinkerFactory.createClassicP().then(function (graph) {
            g = graph;
        }).then(function () { return done(); }).catch(done);
    });
    // Create an empty, in-memory Gremlin graph.
    function makeEmptyTinker() {
        var graph = TP.TinkerGraph.open();
        var str = graph.toString();
        var expected = 'tinkergraph[vertices:0 edges:0]';
        expect(str, 'Expected graph to be empty').to.deep.equal(expected);
        return graph;
    }
    it('can save and load GraphSON synchronously', function (done) {
        tmp.tmpName(function (err, path) {
            if (err) {
                throw err;
            }
            expect(TP.saveGraphSONSync(g, path), 'saveGraphSONSync did not return graph').to.deep.equal(g);
            var g2 = makeEmptyTinker();
            expect(TP.loadGraphSONSync(g2, path), 'loadGraphSONSync did not return graph').to.deep.equal(g2);
            var str = g2.toString();
            var expected = 'tinkergraph[vertices:6 edges:6]';
            expect(str, 'GraphSON was not read correctly').to.deep.equal(expected);
            fs.unlink(path, done);
        });
    });
    it('can save and load "pretty" GraphSON synchronously', function (done) {
        tmp.tmpName(function (err, path) {
            if (err) {
                throw err;
            }
            expect(TP.savePrettyGraphSONSync(g, path), 'savePrettyGraphSONSync did not return graph').to.deep.equal(g);
            var g2 = makeEmptyTinker();
            expect(TP.loadGraphSONSync(g2, path), 'loadGraphSONSync did not return graph').to.deep.equal(g2);
            var str = g2.toString();
            var expected = 'tinkergraph[vertices:6 edges:6]';
            expect(str, 'GraphSON was not read correctly').to.deep.equal(expected);
            fs.unlink(path, done);
        });
    });
    it('can save and load GraphSON asynchronously via callback', function (done) {
        tmp.tmpName(function (err, path) {
            if (err) {
                throw err;
            }
            TP.saveGraphSON(g, path, function (err, graph) {
                expect(err).to.not.exist;
                expect(g, 'saveGraphSON did not return graph').to.deep.equal(graph);
                var g2 = makeEmptyTinker();
                TP.loadGraphSON(g2, path, function (err, graph) {
                    expect(err).to.not.exist;
                    expect(g2, 'loadGraphSON did not return graph').to.deep.equal(graph);
                    var str = g2.toString();
                    var expected = 'tinkergraph[vertices:6 edges:6]';
                    expect(str, 'GraphSON was not read correctly').to.deep.equal(expected);
                    fs.unlink(path, done);
                });
            });
        });
    });
    it('can save and load "pretty" GraphSON asynchronously via callback', function (done) {
        tmp.tmpName(function (err, path) {
            if (err) {
                throw err;
            }
            TP.savePrettyGraphSON(g, path, function (err, graph) {
                expect(err).to.not.exist;
                expect(g, 'saveGraphSON did not return graph').to.deep.equal(graph);
                var g2 = makeEmptyTinker();
                TP.loadGraphSON(g2, path, function (err, graph) {
                    expect(err).to.not.exist;
                    expect(g2, 'loadGraphSON did not return graph').to.deep.equal(graph);
                    var str = g2.toString();
                    var expected = 'tinkergraph[vertices:6 edges:6]';
                    expect(str, 'GraphSON was not read correctly').to.deep.equal(expected);
                    fs.unlink(path, done);
                });
            });
        });
    });
    it('can save and load GraphSON asynchronously via promise', function () {
        var tmpNameP = BluePromise.promisify(tmp.tmpName);
        var g2;
        var path;
        return tmpNameP().then(function (_path) {
            path = _path;
            return TP.saveGraphSON(g, path);
        }).then(function (graph) {
            expect(g, 'saveGraphSON did not return graph').to.deep.equal(graph);
            g2 = makeEmptyTinker();
            return TP.loadGraphSON(g2, path);
        }).then(function (graph) {
            expect(g2, 'loadGraphSON did not return graph').to.deep.equal(graph);
            var str = g2.toString();
            var expected = 'tinkergraph[vertices:6 edges:6]';
            expect(str, 'GraphSON was not read correctly').to.deep.equal(expected);
            var unlinkP = BluePromise.promisify(fs.unlink);
            return unlinkP(path);
        });
    });
    it('can save and load "pretty" GraphSON asynchronously via promise', function () {
        var tmpNameP = BluePromise.promisify(tmp.tmpName);
        var g2;
        var path;
        return tmpNameP().then(function (_path) {
            path = _path;
            return TP.savePrettyGraphSON(g, path);
        }).then(function (graph) {
            expect(g, 'savePrettyGraphSON did not return graph').to.deep.equal(graph);
            g2 = makeEmptyTinker();
            return TP.loadGraphSON(g2, path);
        }).then(function (graph) {
            expect(g2, 'loadGraphSON did not return graph').to.deep.equal(graph);
            var str = g2.toString();
            var expected = 'tinkergraph[vertices:6 edges:6]';
            expect(str, 'GraphSON was not read correctly').to.deep.equal(expected);
            var unlinkP = BluePromise.promisify(fs.unlink);
            return unlinkP(path);
        });
    });
});
//# sourceMappingURL=tinkerpop-test.js.map