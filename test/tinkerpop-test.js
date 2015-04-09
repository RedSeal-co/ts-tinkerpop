// # tinkerpop-test.ts
/// <reference path='../typings/bluebird/bluebird.d.ts' />
/// <reference path='../typings/chai/chai.d.ts'/>
/// <reference path='../typings/debug/debug.d.ts' />
/// <reference path='../typings/glob/glob.d.ts' />
/// <reference path='../typings/lodash/lodash.d.ts'/>
/// <reference path='../typings/mocha/mocha.d.ts'/>
/// <reference path='../typings/node/node.d.ts'/>
/// <reference path='../typings/tmp/tmp.d.ts'/>
'use strict';
require('source-map-support').install();
var _ = require('lodash');
var BluePromise = require('bluebird');
var chai = require('chai');
var debug = require('debug');
var fs = require('fs');
var tmp = require('tmp');
var TP = require('../lib/ts-tinkerpop');
var expect = chai.expect;
var L = TP.L;
var dlog = debug('ts-tinkerpop:test');
var sortByAll = _.sortByAll;
before(function (done) {
    TP.getTinkerpop().then(function (t) {
        if (TP !== t) {
            throw new Error('Tinkerpop is not a singleton.');
        }
        ;
        done();
    });
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
            var allVerticesTraversal = graph.traversal().V();
            // The "count" method applies to a Traversal, destructively measuring the number of
            // elements in it.
            allVerticesTraversal.count().nextP().then(function (count) {
                expect(count.valueOf()).to.equal(0);
                // Count edges.
                var allEdgesTraversal = graph.traversal().E();
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
        // Gremlin would be `graph.traversal().V.value('name').dedup`.  However, it can also be written with
        // the sugar syntax for property access: `graph.traversal.V.name.dedup`.
        it('has certain names', function () {
            var distinctNamesTraversal = graph.traversal().V().values('name').dedup();
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
            return graph.traversal().V().has('name', 'marko').nextP().then(function (v) {
                expect(v).to.be.ok;
                var name = v.value('name');
                expect(name).to.be.equal('marko');
            });
        });
        it('g.V().value("name")', function () {
            return graph.traversal().V().values('name').toListP().then(function (list) { return list.toArrayP(); }).then(function (data) {
                expect(data).to.be.ok;
                var expected = ['marko', 'vadas', 'lop', 'josh', 'ripple', 'peter'];
                expect(data).to.deep.equal(expected);
            });
        });
        it('filter() with JavaScript lambda', function () {
            var js = 'a.get().value("name") == "lop"';
            var lambda = TP.newJavaScriptLambda(js);
            return graph.traversal().V().filter(lambda).toListP().then(function (list) { return list.toArrayP(); }).then(function (recs) {
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
            var chosen = graph.traversal().V().has('age').choose(lambda).option(5, __.in()).option(4, __.out()).option(3, __.both()).values('name');
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
            var chosen = graph.traversal().V().has('age').choose(lambda).option(5, __.in()).option(4, __.out()).option(3, __.both()).values('name');
            return chosen.toListP().then(function (list) { return list.toArrayP(); }).then(function (actual) {
                var expected = ['marko', 'ripple', 'lop'];
                expect(actual.sort()).to.deep.equal(expected.sort());
            });
        });
        it('TP.forEach(g.V())', function () {
            var traversal = graph.traversal().V();
            return TP.forEach(traversal, function (obj) {
                var v = TP.asVertex(obj);
                var json = TP.vertexToJson(v);
                expect(json).to.include.keys(['id', 'label', 'type', 'properties']);
                expect(json.type).to.equal('vertex');
                return BluePromise.resolve();
            });
        });
        it('TP.forEach(g.E())', function () {
            var traversal = graph.traversal().E();
            return TP.forEach(traversal, function (obj) {
                var e = TP.asEdge(obj);
                var json = TP.edgeToJson(e);
                expect(json).to.include.keys(['id', 'label', 'type', 'properties', 'inV', 'outV', 'inVLabel', 'outVLabel']);
                expect(json.type).to.equal('edge');
                return BluePromise.resolve();
            });
        });
        it('TP.asJSON(long)', function () {
            var traversal = graph.traversal().V().count();
            var json = TP.asJSON(traversal);
            var expected = ['6'];
            expect(json).to.deep.equal(expected);
        });
        it('TP.asJSON(vertices)', function () {
            var traversal = graph.traversal().V().has('lang', TP.Compare.eq, 'java');
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
            var traversal = graph.traversal().V().has('lang', TP.Compare.eq, 'java');
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
            var traversal = graph.traversal().E().has('weight', TP.Compare.eq, TP.java.newFloat(1.0));
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
        it('TP.asJSON(maps)', function () {
            var traversal = graph.traversal().V().as('a').out().as('b').select().by(TP.T.id);
            var json = TP.asJSON(traversal);
            var expected = [
                { a: 1, b: 2 },
                { a: 1, b: 3 },
                { a: 1, b: 4 },
                { a: 4, b: 3 },
                { a: 4, b: 5 },
                { a: 6, b: 3 },
            ];
            expect(sortByAll(json, ['a', 'b'])).to.deep.equal(expected);
        });
        it('TP.asJSON(map of vertices)', function () {
            var traversal = graph.traversal().V(1).as('a').out().has(TP.T.id, 2).as('b').select();
            var json = TP.asJSON(traversal);
            var simplified = _.map(json, function (map) { return _.mapValues(map, TP.simplifyVertexProperties); });
            var expected = [
                {
                    a: {
                        id: 1,
                        label: 'vertex',
                        type: 'vertex',
                        properties: {
                            name: 'marko',
                            age: 29
                        }
                    },
                    b: {
                        id: 2,
                        label: 'vertex',
                        type: 'vertex',
                        properties: {
                            name: 'vadas',
                            age: 27
                        }
                    }
                }
            ];
            expect(json).to.deep.equal(expected);
        });
        it('TP.asJSON(map entries)', function () {
            var traversal = graph.traversal().V().as('v').values('name').as('name').back('v').out().groupCount('c').by(TP.__.back('name')).cap('c').unfold();
            dlog(TP.jsify(traversal.asAdmin().clone().toList()));
            var json = TP.asJSON(traversal);
            var expected = [
                { key: 'josh', value: '2' },
                { key: 'marko', value: '3' },
                { key: 'peter', value: '1' },
            ];
            expect(sortByAll(json, ['key'])).to.deep.equal(expected);
        });
        it('TP.asJSON(path labels)', function () {
            var traversal = graph.traversal().V().as('a').out().as('b').out().as('c').map(TP.newGroovyClosure('{ it -> it.path.labels() }'));
            dlog(TP.jsify(traversal.asAdmin().clone().toList()));
            var json = TP.asJSON(traversal);
            var expected = [
                [['a'], ['b'], ['c']],
                [['a'], ['b'], ['c']],
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
describe('isLongValue', function () {
    it('returns false on JS scalar types', function () {
        var scalars = [
            undefined,
            null,
            0,
            1,
            2,
            0.0,
            1.1,
            2.2,
            'one',
            'two',
            'three',
            true,
            false,
        ];
        _.forEach(scalars, function (scalar) { return expect(TP.isLongValue(scalar), scalar).to.be.false; });
    });
    it('returns false on Number', function () {
        expect(TP.isLongValue(new Number(123))).to.be.false;
    });
    it('returns false on Number subtype that has additional fields', function () {
        var hybrid = new Number(123);
        hybrid.longValue = '123';
        hybrid.reverse = '321';
        expect(TP.isLongValue(hybrid)).to.be.false;
    });
    it('returns true on L literal', function () {
        expect(TP.isLongValue(L(123))).to.be.true;
    });
    it('returns true on hand-crafted longValue_t', function () {
        var fake = new Number(123);
        fake.longValue = '123';
        expect(TP.isLongValue(fake)).to.be.true;
    });
    it('returns false on Java Long', function () {
        expect(TP.isLongValue(TP.java.newLong(123))).to.be.false;
    });
});
// Used in testing isJavaObject.
var Foo = (function () {
    function Foo(s) {
        this.s = s;
    }
    return Foo;
})();
describe('isJavaObject', function () {
    it('returns false on JS scalar types', function () {
        var scalars = [
            undefined,
            null,
            0,
            1,
            2,
            0.0,
            1.1,
            2.2,
            'one',
            'two',
            'three',
            true,
            false,
        ];
        _.forEach(scalars, function (scalar) { return expect(TP.isJavaObject(scalar), scalar).to.be.false; });
    });
    it('returns false on JS Number', function () {
        expect(TP.isJavaObject(new Number(123))).to.be.false;
    });
    it('returns false on JS String', function () {
        expect(TP.isJavaObject(new String('foo'))).to.be.false;
    });
    it('returns false on JS Boolean', function () {
        expect(TP.isJavaObject(new Boolean(true))).to.be.false;
    });
    it('returns false on Java.longValue_t', function () {
        var longValue = L(123);
        expect(TP.isJavaObject(longValue)).to.be.false;
    });
    it('returns true on Java.Long', function () {
        expect(TP.isJavaObject(TP.java.newLong(123))).to.be.true;
    });
    it('returns false on JS array', function () {
        expect(TP.isJavaObject([1, 2, 3])).to.be.false;
    });
    it('returns false on non-Java JS object', function () {
        expect(TP.isJavaObject(new Foo('foo'))).to.be.false;
    });
    it('returns false on Java class representations', function () {
        expect(TP.isJavaObject(TP.autoImport('HashMap'))).to.be.false;
    });
    it('returns true on Java object', function () {
        var HashMap = TP.autoImport('HashMap');
        var hashMap = new HashMap();
        expect(TP.isJavaObject(hashMap)).to.be.true;
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
describe('isType', function () {
    it('returns false for non-Java objects', function () {
        var type = 'java.lang.Object';
        var objects = [null, undefined, 'abc', 123, true, false, { 'foo': 9 }];
        _.forEach(objects, function (o) { return expect(TP.isType(o, type), o).to.be.false; });
    });
    it('returns true on exact match', function () {
        expect(TP.isType(TP.java.newLong(123), 'java.lang.Long')).to.be.true;
        var ArrayList = TP.autoImport('ArrayList');
        expect(TP.isType(new ArrayList(), 'java.util.ArrayList')).to.be.true;
    });
    it('returns true for supertypes', function () {
        expect(TP.isType(TP.java.newLong(123), 'java.lang.Number')).to.be.true;
        var ArrayList = TP.autoImport('ArrayList');
        expect(TP.isType(new ArrayList(), 'java.util.List')).to.be.true;
    });
    it('returns false for unrelated types', function () {
        expect(TP.isType(TP.java.newLong(123), 'java.lang.Integer')).to.be.false;
        var ArrayList = TP.autoImport('ArrayList');
        expect(TP.isType(new ArrayList(), 'java.util.HashMap')).to.be.false;
    });
});
describe('jsify', function () {
    it('converts Java long to JS string', function () {
        var javaLong = L(123);
        var jsLong = TP.jsify(javaLong);
        expect(jsLong).to.deep.equal('123');
        expect(TP.isJavaObject(jsLong), 'JS long representation should not be a Java object').to.be.false;
    });
    it('converts Java List to JS array', function () {
        var ArrayList = TP.autoImport('ArrayList');
        var javaList = new ArrayList();
        javaList.add('one');
        javaList.add('two');
        javaList.add('three');
        var nestedList = new ArrayList();
        nestedList.add('nested');
        nestedList.add('list');
        javaList.add(nestedList);
        var jsArray = TP.jsify(javaList);
        expect(_.isArray(jsArray)).to.be.true;
        expect(jsArray).to.deep.equal(['one', 'two', 'three', ['nested', 'list']]);
    });
    it('recurses into a Java array', function () {
        var ArrayList = TP.autoImport('ArrayList');
        var javaList = new ArrayList();
        javaList.add('one');
        javaList.add('two');
        javaList.add('three');
        var nestedList = new ArrayList();
        nestedList.add('nested');
        nestedList.add('list');
        javaList.add(nestedList);
        var jsArray = TP.jsify(javaList.toArray());
        expect(_.isArray(jsArray)).to.be.true;
        expect(jsArray).to.deep.equal(['one', 'two', 'three', ['nested', 'list']]);
    });
    it('converts Java Map to JS object', function () {
        var HashMap = TP.autoImport('HashMap');
        var javaMap = new HashMap();
        javaMap.put('one', 1);
        javaMap.put('two', 'deux');
        var nestedMap = new HashMap();
        nestedMap.put('nested', 'NIDO');
        nestedMap.put('map', 'CARTA');
        javaMap.put('three', nestedMap);
        var js = TP.jsify(javaMap);
        expect(_.isObject(js)).to.be.true;
        expect(js).to.deep.equal({ 'one': 1, 'two': 'deux', 'three': { 'nested': 'NIDO', 'map': 'CARTA' } });
    });
    it('converts Java Set to JS array', function () {
        var HashSet = TP.autoImport('HashSet');
        var hashSet = new HashSet();
        hashSet.add('one');
        hashSet.add('two');
        hashSet.add('three');
        var nestedSet = new HashSet();
        nestedSet.add('nested');
        nestedSet.add('set');
        hashSet.add(nestedSet);
        var actual = TP.jsify(hashSet);
        expect(_.isArray(actual)).to.be.true;
        actual.sort();
        dlog('actual:', actual);
        // Divide the results into arrays and not-arrays.
        var grouped = _.groupBy(actual, _.isArray);
        // Check the scalar members.
        var scalars = grouped.false;
        expect(scalars).to.have.members(['one', 'two', 'three']);
        // Check the nested array.
        var arrays = grouped.true;
        expect(arrays).to.have.length(1);
        expect(arrays[0]).to.have.members(['nested', 'set']);
    });
    it('converts Java BulkSet to JS array of key/count objects', function () {
        var BulkSet = TP.autoImport('BulkSet');
        var bulkSet = new BulkSet();
        bulkSet.add('one', 1);
        bulkSet.add('two', 2);
        bulkSet.add('three', 3);
        var actual = TP.jsify(bulkSet);
        expect(_.isArray(actual)).to.be.true;
        actual = sortByAll(actual, ['key']);
        dlog('actual:', actual);
        var expected = [
            { key: 'one', count: L(1) },
            { key: 'two', count: L(2) },
            { key: 'two', count: L(2) },
            { key: 'three', count: L(3) },
            { key: 'three', count: L(3) },
            { key: 'three', count: L(3) },
        ];
        expected = sortByAll(expected, ['key']);
        dlog('expected:', expected);
        expect(actual).to.deep.equal(expected);
    });
    it('converts Java Map$Entry to JS key/value map', function () {
        var LinkedHashMap = TP.autoImport('LinkedHashMap');
        var javaMap = new LinkedHashMap();
        javaMap.put('one', 1);
        javaMap.put('two', 'deux');
        javaMap.put('long', L(123));
        var nestedMap = new LinkedHashMap();
        nestedMap.put('nested', 'NIDO');
        nestedMap.put('map', 'CARTA');
        // Create a List containing Map$Entry's
        var ArrayList = TP.autoImport('ArrayList');
        var nestedList = new ArrayList();
        var it = nestedMap.entrySet().iterator();
        while (it.hasNext()) {
            nestedList.add(it.next());
        }
        javaMap.put('nested', nestedList);
        var js = TP.jsify(javaMap.entrySet().toArray());
        expect(_.isObject(js)).to.be.true;
        expect(js).to.deep.equal([
            { key: 'one', value: 1 },
            { key: 'two', value: 'deux' },
            { key: 'long', value: '123' },
            { key: 'nested', value: [
                { key: 'nested', value: 'NIDO' },
                { key: 'map', value: 'CARTA' }
            ] }
        ]);
    });
    it('converts Path to JS array of labels and objects', function () {
        var MutablePath = TP.autoImport('MutablePath');
        var path = MutablePath.make();
        // Add some simple items to the path.
        path.extend(123, 'one');
        path.extend(456, 'two');
        // They don't have to have labels.
        path.extend('foo');
        // They can have multiple labels.
        path.extend('bar', 'a', 'b', 'c');
        // Complex objects can appear in the path, and those should be recursively jsify-ed.
        var ArrayList = TP.autoImport('ArrayList');
        var javaList = new ArrayList();
        javaList.add('un');
        javaList.add('deux');
        javaList.add('trois');
        path.extend(javaList, 'complex');
        // Paths can even contain other Paths.
        var nestedPath = MutablePath.make();
        nestedPath.extend(1, 'uno');
        nestedPath.extend(2, 'dos');
        nestedPath.extend(3, 'tres');
        path.extend(nestedPath, 'nested');
        var js = TP.jsify(path);
        expect(TP.isJavaObject(js), 'jsify should not return Java Path').to.be.false;
        expect(_.isArray(js), 'jsify should turn Path into JS array').to.be.true;
        var expected = [
            { object: 123, labels: ['one'] },
            { object: 456, labels: ['two'] },
            { object: 'foo', labels: [] },
            { object: 'bar', labels: ['a', 'b', 'c'] },
            { object: ['un', 'deux', 'trois'], labels: ['complex'] },
            {
                object: [
                    { object: 1, labels: ['uno'] },
                    { object: 2, labels: ['dos'] },
                    { object: 3, labels: ['tres'] },
                ],
                labels: ['nested']
            },
        ];
        expect(js).to.deep.equal(expected);
    });
});
//# sourceMappingURL=tinkerpop-test.js.map