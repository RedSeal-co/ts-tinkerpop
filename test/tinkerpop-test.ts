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

declare function require(name: string): any;
require('source-map-support').install();

import _ = require('lodash');
import BluePromise = require('bluebird');
import chai = require('chai');
import debug = require('debug');
import fs = require('fs');
import path = require('path');
import tmp = require('tmp');
import TP = require('../lib/ts-tinkerpop');
import util = require('util');

import expect = chai.expect;
import L = TP.L;
import Java = TP.Java;

var dlog = debug('ts-tinkerpop:test');

var readFileP = BluePromise.promisify(fs.readFile);

// TODO: Add sortByAll to lodash.d.ts
interface SortByAll {
  (collection: any, props: string[]): any[];
}

var sortByAll: SortByAll = (<any>_).sortByAll;

before((done: MochaDone): void => {

  TP.getTinkerpop().then((t: TP.Static) => {
    if (TP !== t) {
      throw new Error('Tinkerpop is not a singleton.');
    };
    done();
  });

});

describe('autoImport', (): void => {

  it('works for ArrayList', () => {
    var ArrayList: Java.ArrayList.Static = TP.autoImport('ArrayList');
    expect(ArrayList).to.exist;
  });

  it('works for Traversal', () => {
    var Traversal: Java.Traversal.Static = TP.autoImport('Traversal');
    expect(Traversal).to.exist;
  });

});

describe('Gremlin', (): void => {

  var graph: Java.TinkerGraph;

  before((done: MochaDone): void => {
    expect(TP.TinkerGraph).to.be.ok;
    done();
  });

  // ## TinkerGraph in-memory
  // Tests using an empty in-memory TinkerGraph database instance.
  describe('TinkerGraph empty', (): void => {

    before((): void => {
      graph = TP.TinkerGraph.open();
      expect(graph).to.be.ok;
    });

    after((done: MochaDone): void => {
      if (graph) {
        graph.closeP().then((): void => {
          graph = null;
          done();
        });
      } else {
          done();
      }
    });

    it('should initialize', (): void => {
      // intentionally blank
    });

    // Check that the Gremlin statements `graph.V.count()` and `graph.E.count()` return `0`.
    it('should be empty', (done: MochaDone): void => {
      // Count vertices.
      var allVerticesTraversal = graph.traversal().V();

      // The "count" method applies to a Traversal, destructively measuring the number of
      // elements in it.
      allVerticesTraversal.count().nextP().then((count: Java.Object): void => {
        expect(count.valueOf()).to.equal(0);

        // Count edges.
        var allEdgesTraversal = graph.traversal().E();

        allEdgesTraversal.count().nextP().then((count: Java.Object): void => {
          expect(count.valueOf()).to.equal(0);
          done();
        });
      });
    });

  });

  // ## TinkerGraph built-in example
  // Tests using the graph referenced in Gremlin documentation examples like
  // https://github.com/tinkerpop/gremlin/wiki/Basic-Graph-Traversals
  describe('TinkerGraph built-in example', (): void => {

    var graph: Java.TinkerGraph;

    before((): void => {
      expect(TP.TinkerFactory).to.be.ok;
      graph = TP.TinkerFactory.createClassic();
      expect(graph).to.be.ok;
    });

    after((done: MochaDone): void => {
      if (graph) {
        graph.closeP().then((): void => {
          graph = null;
          done();
        });
      } else {
        done();
      }
    });

    it('should initialize', (): void => {
      // intentionally blank
    });

    // To extract the unique values of the "name" property from all vertices, the canonical
    // Gremlin would be `graph.traversal().V.value('name').dedup`.  However, it can also be written with
    // the sugar syntax for property access: `graph.traversal.V.name.dedup`.
    it('has certain names', (): BluePromise<void> => {
      var distinctNamesTraversal: Java.GraphTraversal = graph.traversal().V().values('name').dedup();
      expect(distinctNamesTraversal).to.be.ok;
      return distinctNamesTraversal
        .toListP()
        .then((list: Java.List) => list.toArrayP())
        .then((data: Java.object_t[] ) => {
          var expected = ['lop', 'vadas', 'marko', 'peter', 'ripple', 'josh'];
          // Sort data to ignore sequence differences.
          expected.sort();
          data.sort();
          expect(data).to.deep.equal(expected);
        });
      });

    it('g.V().has("name", "marko") -> v.value("name")', (): BluePromise<void> => {
      return graph.traversal().V().has('name', 'marko')
        .nextP()
        .then((v: Java.Vertex) => {
          expect(v).to.be.ok;
          var name: Java.object_t = v.value('name');
          expect(name).to.be.equal('marko');
        });
    });

    it('g.V().values("name")', (): BluePromise<void> => {
      return graph.traversal().V().values('name').toListP()
        .then((list: Java.List) => list.toArrayP())
        .then((data: Java.object_t[] ) => {
          expect(data).to.be.ok;
          var expected = [ 'marko', 'vadas', 'lop', 'josh', 'ripple', 'peter' ];
          expect(data).to.deep.equal(expected);
        });
    });

    it('filter() with JavaScript lambda', (): BluePromise<void> => {
      var js = 'a.get().value("name") == "lop"';
      var lambda = TP.newJavaScriptLambda(js);
      return graph.traversal().V().filter(lambda).toListP()
        .then((list: Java.List) => list.toArrayP())
        .then((recs: Java.object_t[] ) => {
          expect(recs).to.be.ok;
          expect(recs.length).to.equal(1);
          var v: Java.Vertex = TP.asVertex(recs[0]);
          var vertexObj: any = TP.vertexToJson(v);
          var expected = {
            id: 3,
            label: 'vertex',
            properties: {
              name: [ { id: 5, value: 'lop' } ],
              lang: [ { id: 6, value: 'java' } ]
            }
          };
          expect(vertexObj).to.deep.equal(expected);
        });
    });

    it('choose(Function).option with integer choice, groovy fragment', (): BluePromise<void> => {
      var __ = TP.__;

      // Use the result of the function as a key to the map of traversal choices.
      var groovy = 'a.value("name").length()';
      var lambda = TP.newGroovyLambda(groovy);

      var chosen = graph.traversal().V().has('age').choose(lambda)
          .option(5, __.in())
          .option(4, __.out())
          .option(3, __.both())
          .values('name');

      return chosen.toListP()
        .then((list: Java.List) => list.toArrayP())
        .then((actual: Java.object_t[] ) => {
          var expected = ['marko', 'ripple', 'lop'];
          expect(actual.sort()).to.deep.equal(expected.sort());
        });
    });

    it('choose(Function).option with integer choice, groovy closure', (): BluePromise<void> => {
      var __ = TP.__;

      // Use the result of the function as a key to the map of traversal choices.
      var groovy = '{ vertex -> vertex.value("name").length() }';
      var lambda = TP.newGroovyClosure(groovy);

      var chosen = graph.traversal().V().has('age').choose(lambda)
          .option(5, __.in())
          .option(4, __.out())
          .option(3, __.both())
          .values('name');

      return chosen.toListP()
        .then((list: Java.List) => list.toArrayP())
        .then((actual: Java.object_t[] ) => {
          var expected = ['marko', 'ripple', 'lop'];
          expect(actual.sort()).to.deep.equal(expected.sort());
        });
    });

    it('TP.forEach(g.V())', (): BluePromise<void> => {
      var traversal = graph.traversal().V();
      return TP.forEach(traversal, (obj: Java.Object): BluePromise<void> => {
        var v: Java.Vertex = TP.asVertex(obj);
        var json: any = TP.vertexToJson(v);
        expect(json).to.include.keys(['id', 'label', 'properties']);
        expect(json.label).to.equal('vertex');
        return BluePromise.resolve();
      });
    });

    it('TP.forEach(g.E())', (): BluePromise<void> => {
      var traversal = graph.traversal().E();
      return TP.forEach(traversal, (obj: Java.Object): BluePromise<void> => {
        var e: Java.Edge = TP.asEdge(obj);
        var json: any = TP.edgeToJson(e);
        expect(json).to.include.keys(['id', 'type', 'label', 'properties', 'inV', 'outV', 'inVLabel', 'outVLabel']);
        expect(json.type).to.equal('edge');
        return BluePromise.resolve();
      });
    });

    it('TP.forEach(g.V().values("name")) (i.e. forEach consumer works with strings)', (): BluePromise<void> => {
      var expectedNames: string[] = [ 'marko', 'vadas', 'lop', 'josh', 'ripple', 'peter' ];
      var traversal = graph.traversal().V().values('name');
      return TP.forEach(traversal, (obj: string): void => {
        expect(_.isString(obj)).to.be.ok;
        expect(expectedNames).to.include(obj);
        return;
      });
    });

    it('TP.asJSON(long)', (): void => {
      var traversal = graph.traversal().V().count();
      var json: any[] = TP.asJSON(traversal);
      var expected = [ '6' ];
      expect(json).to.deep.equal(expected);
    });

    it('TP.asJSON(vertices)', (): void => {
      var traversal = graph.traversal().V().has('lang', 'java');
      var json: any[] = TP.asJSON(traversal);
      var expected = [
        {
          id: 3,
          label: 'vertex',
          properties:
          {
            name: [ { id: 5, value: 'lop' } ],
            lang: [ { id: 6, value: 'java' } ]
          }
        },
        {
          id: 5,
          label: 'vertex',
          properties:
          {
            name: [ { id: 9, value: 'ripple' } ],
            lang: [ { id: 10, value: 'java' } ]
          }
        }
      ];
      expect(json).to.deep.equal(expected);
    });

    it('TP.asJSON(vertices) with simplifyVertex', (): void => {
      var traversal = graph.traversal().V().has('lang', 'java');
      var json: any[] = TP.simplifyVertexProperties(TP.asJSON(traversal));
      var expected = [
        {
          id: 3,
          label: 'vertex',
          properties:
          {
            name: 'lop',
            lang: 'java'
          }
        },
        {
          id: 5,
          label: 'vertex',
          properties:
          {
            name: 'ripple',
            lang: 'java'
          }
        }
      ];
      expect(json).to.deep.equal(expected);
    });

    it('TP.asJSON(edges)', (): void => {
      var traversal = graph.traversal().E().has('weight', TP.Java.newFloat(1.0));
      var json: any[] = TP.asJSON(traversal);
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

    it('TP.asJSON(maps)', (): void => {
      var traversal = graph.traversal().V().as('a').out().as('b').select().by(TP.T.id);
      var json: any[] = TP.asJSON(traversal);
      var expected: any[] = [
        { a: 1, b: 2 },
        { a: 1, b: 3 },
        { a: 1, b: 4 },
        { a: 4, b: 3 },
        { a: 4, b: 5 },
        { a: 6, b: 3 },
      ];
      expect(sortByAll(json, ['a', 'b'])).to.deep.equal(expected);
    });

    it('TP.asJSON(map of vertices)', (): void => {
      var traversal = graph.traversal().V(1).as('a').out().has(TP.T.id, 2).as('b').select();
      var json: any[] = TP.asJSON(traversal);
      var simplified: any[] = _.map(json, (map: any): any => _.mapValues(map, TP.simplifyVertexProperties));
      var expected: any[] = [
        {
          a: {
            id: 1,
            label: 'vertex',
            properties: {
              name: 'marko',
              age: 29
            }
          },
          b: {
            id: 2,
            label: 'vertex',
            properties: {
              name: 'vadas',
              age: 27
            }
          }
        }
      ];
      expect(json).to.deep.equal(expected);
    });

    it('TP.asJSON(map entries)', (): void => {
      var traversal: Java.GraphTraversal = graph.traversal().V().as('v')
        .values('name').as('name')
        .select('v').out().groupCount('c').by(TP.__.select('name'))
        .cap('c')
        .unfold();

      dlog(TP.jsify(traversal.asAdmin().clone().toList()));

      var json: any[] = TP.asJSON(traversal);
      var expected: any[] = [
        { key: 'josh', value: '2' },
        { key: 'marko', value: '3' },
        { key: 'peter', value: '1' },
      ];
      expect(sortByAll(json, ['key'])).to.deep.equal(expected);
    });

    it('TP.asJSON(path labels)', (): void => {
      var traversal: Java.GraphTraversal = graph.traversal().V().as('a').out().as('b').out().as('c').select()
        .map(TP.newGroovyClosure('{ it -> it.path().labels() }'));

      dlog(TP.jsify(traversal.asAdmin().clone().toList()));

      var json: any[] = TP.asJSON(traversal);
      var expected: any[] = [
        [ ['a'], ['b'], ['c'], [] ],
        [ ['a'], ['b'], ['c'], [] ],
      ];
      expect(json).to.deep.equal(expected);
    });

  });

});

describe('Groovy support', (): void => {

  var engine: Java.GremlinGroovyScriptEngine;

  before((): void => {
    engine = TP.getGroovyEngine();
  });

  it('initializes', (): void => {
    expect(engine).to.exist;
  });

  it('does NOT come with test classes already imported', (): void => {
    var imports: Java.Map = engine.imports();
    expect(imports.toString()).to.not.contain('co.redseal.gremlinnode.testing');
  });

  it('accepts valid Groovy', (): void => {
    var groovy: Java.Closure = <Java.Closure> engine.eval('{ it -> it.toString() }');
    expect(groovy).to.exist;
    expect(groovy.call(123)).to.deep.equal('123');
  });

  it('rejects invalid Groovy', (): void => {
    expect((): void => {
      engine.eval('this is not valid Groovy');
      return;
    }).to.throw(Error);
  });

  it('importGroovy introduces types for newGroovyClosure but not newGroovyLambda', function () {
    // We're going to try to define a lambda that references an application-specific datatype.
    var groovy: string = '{ -> new TestClass() }';

    // Check that the TestClass is NOT in the Groovy imports already.
    var testClassName: string = 'co.redseal.gremlinnode.testing.TestClass'
    expect(engine.imports().toString()).to.not.contain(testClassName);

    // Make sure it IS in the classpath.
    var TestClass: Java.TestClass.Static = TP.Java.importClass(testClassName);
    expect(TestClass).to.exist;

    // First check that TestClass is not defined.
    expect(() => TP.newGroovyClosure(groovy)).to.throw(/unable to resolve class TestClass/);
    expect(() => TP.newGroovyLambda('new TestClass()').get()).to.throw(/unable to resolve class TestClass/);

    // Now import it, and check that it shows up in the imports.
    TP.importGroovy(testClassName);
    dlog('engine.imports()', engine.imports().toString());
    expect(engine.imports().toString()).to.contain(testClassName);

    // Retry the lambda.
    var lambda: Java.GroovyLambda = TP.newGroovyClosure(groovy);
    expect(lambda.get().toString()).to.deep.equal('TestClass');

    // Show that it does NOT affect newGroovyLambda.
    expect(() => TP.newGroovyLambda('new TestClass()').get()).to.throw(/unable to resolve class TestClass/);
  });

});

describe('isLongValue', () => {

  it('returns false on JS scalar types', () => {
    var scalars: any[] = [
      undefined,
      null,
      0, 1, 2,
      0.0, 1.1, 2.2,
      'one', 'two', 'three',
      true, false,
    ];

    _.forEach(scalars, (scalar: any) => expect(TP.isLongValue(scalar), scalar).to.be.false);
  });

  it('returns false on Number', () => {
    expect(TP.isLongValue(new Number(123))).to.be.false;
  });

  it('returns false on Number subtype that has additional fields', () => {
    var hybrid: any = new Number(123);
    hybrid.longValue = '123';
    hybrid.reverse = '321';
    expect(TP.isLongValue(hybrid)).to.be.false;
  });

  it('returns true on L literal', () => {
    expect(TP.isLongValue(L(123))).to.be.true;
  });

  it('returns true on hand-crafted longValue_t', () => {
    var fake: any = new Number(123);
    fake.longValue = '123';
    expect(TP.isLongValue(fake)).to.be.true;
  });

  it('returns false on Java Long', () => {
    expect(TP.isLongValue(TP.Java.newLong(123))).to.be.false;
  });

});

// Used in testing isJavaObject.
class Foo {
  s: string;
  constructor(s: string) { this.s = s; }
}

describe('isJavaObject', () => {

  it('returns false on JS scalar types', () => {
    var scalars: any[] = [
      undefined,
      null,
      0, 1, 2,
      0.0, 1.1, 2.2,
      'one', 'two', 'three',
      true, false,
    ];

    _.forEach(scalars, (scalar: any) => expect(TP.isJavaObject(scalar), scalar).to.be.false);
  });

  it('returns false on JS Number', () => {
    expect(TP.isJavaObject(new Number(123))).to.be.false;
  });

  it('returns false on JS String', () => {
    expect(TP.isJavaObject(new String('foo'))).to.be.false;
  });

  it('returns false on JS Boolean', () => {
    expect(TP.isJavaObject(new Boolean(true))).to.be.false;
  });

  it('returns false on Java.longValue_t', () => {
    var longValue: Java.longValue_t = L(123);
    expect(TP.isJavaObject(longValue)).to.be.false;
  });

  it('returns true on Java.Long', () => {
    expect(TP.isJavaObject(TP.Java.newLong(123))).to.be.true;
  });

  it('returns false on JS array', () => {
    expect(TP.isJavaObject([1, 2, 3])).to.be.false;
  });

  it('returns false on non-Java JS object', () => {
    expect(TP.isJavaObject(new Foo('foo'))).to.be.false;
  });

  it('returns false on Java class representations', () => {
    expect(TP.isJavaObject(TP.autoImport('HashMap'))).to.be.false;
  });

  it('returns true on Java object', () => {
    var HashMap: Java.HashMap.Static = TP.autoImport('HashMap');
    var hashMap: Java.HashMap = new HashMap();
    expect(TP.isJavaObject(hashMap)).to.be.true;
  });

});

describe('GraphSON support', () => {

  var g: Java.Graph;

  beforeEach((done: MochaDone): void => {
    TP.TinkerFactory.createClassicP()
      .then((graph: Java.Graph): void => {
        g = graph;
      })
      .then((): void => done())
      .catch(done);
  });

  // Create an empty, in-memory Gremlin graph.
  function makeEmptyTinker(): Java.Graph {
    var graph: Java.Graph = TP.TinkerGraph.open();
    var str: string = graph.toString();
    var expected: string = 'tinkergraph[vertices:0 edges:0]';
    expect(str, 'Expected graph to be empty').to.deep.equal(expected);
    return graph;
  }

  it('can save and load GraphSON synchronously', (done: MochaDone): void => {
    tmp.tmpName((err: any, path: string): void => {
      if (err) {
        // A failure in tmpName is not a failure in gremlin-node.
        // If this ever fails, it is likely some environmental problem.
        throw err;
      }
      expect(TP.saveGraphSONSync(g, path), 'saveGraphSONSync did not return graph').to.deep.equal(g);
      var g2: Java.Graph = makeEmptyTinker();
      expect(TP.loadGraphSONSync(g2, path), 'loadGraphSONSync did not return graph').to.deep.equal(g2);
      var str: string = g2.toString();
      var expected: string = 'tinkergraph[vertices:6 edges:6]';
      expect(str, 'GraphSON was not read correctly').to.deep.equal(expected);
      fs.unlink(path, done);
    });
  });

  it('can save and load "pretty" GraphSON synchronously', (done: MochaDone): void => {
    tmp.tmpName((err: any, path: string): void => {
      if (err) {
        // A failure in tmpName is not a failure in gremlin-node.
        // If this ever fails, it is likely some environmental problem.
        throw err;
      }
      expect(TP.savePrettyGraphSONSync(g, path), 'savePrettyGraphSONSync did not return graph').to.deep.equal(g);
      var g2: Java.Graph = makeEmptyTinker();
      expect(TP.loadPrettyGraphSONSync(g2, path), 'loadPrettyGraphSONSync did not return graph').to.deep.equal(g2);
      var str: string = g2.toString();
      var expected: string = 'tinkergraph[vertices:6 edges:6]';
      expect(str, 'GraphSON was not read correctly').to.deep.equal(expected);
      fs.unlink(path, done);
    });
  });

  it('can save and load GraphSON asynchronously via callback', (done: MochaDone): void => {
    tmp.tmpName((err: any, path: string): void => {
      if (err) {
        // A failure in tmpName is not a failure in gremlin-node.
        // If this ever fails, it is likely some environmental problem.
        throw err;
      }
      TP.saveGraphSON(g, path, (err: Error, graph: Java.Graph): void => {
        expect(err).to.not.exist;
        expect(g, 'saveGraphSON did not return graph').to.deep.equal(graph);

        var g2: Java.Graph = makeEmptyTinker();
        TP.loadGraphSON(g2, path, (err: Error, graph: Java.Graph): void => {
          expect(err).to.not.exist;
          expect(g2, 'loadGraphSON did not return graph').to.deep.equal(graph);
          var str: string = g2.toString();
          var expected: string = 'tinkergraph[vertices:6 edges:6]';
          expect(str, 'GraphSON was not read correctly').to.deep.equal(expected);
          fs.unlink(path, done);
        });
      });
    });
  });

  it('can save and load "pretty" GraphSON asynchronously via callback', (done: MochaDone): void => {
    tmp.tmpName((err: any, path: string): void => {
      if (err) {
        // A failure in tmpName is not a failure in gremlin-node.
        // If this ever fails, it is likely some environmental problem.
        throw err;
      }
      TP.savePrettyGraphSON(g, path, (err: Error, graph: Java.Graph): void => {
        expect(err).to.not.exist;
        expect(g, 'saveGraphSON did not return graph').to.deep.equal(graph);

        var g2: Java.Graph = makeEmptyTinker();
        TP.loadPrettyGraphSON(g2, path, (err: Error, graph: Java.Graph): void => {
          expect(err).to.not.exist;
          expect(g2, 'loadGraphSON did not return graph').to.deep.equal(graph);
          var str: string = g2.toString();
          var expected: string = 'tinkergraph[vertices:6 edges:6]';
          expect(str, 'GraphSON was not read correctly').to.deep.equal(expected);
          fs.unlink(path, done);
        });
      });
    });
  });

  it('can save and load GraphSON asynchronously via promise', (): BluePromise<void> => {
    var tmpNameP = BluePromise.promisify(tmp.tmpName);
    var g2: Java.Graph;
    var path: string;
    return tmpNameP()
      .then((_path: string): BluePromise<Java.Graph> => {
        path = _path;
        return TP.saveGraphSON(g, path);
      })
      .then((graph: Java.Graph): BluePromise<Java.Graph> => {
        expect(g, 'saveGraphSON did not return graph').to.deep.equal(graph);
        g2 = makeEmptyTinker();
        return TP.loadGraphSON(g2, path);
      })
      .then((graph: Java.Graph): BluePromise<void> => {
        expect(g2, 'loadGraphSON did not return graph').to.deep.equal(graph);
        var str: string = g2.toString();
        var expected: string = 'tinkergraph[vertices:6 edges:6]';
        expect(str, 'GraphSON was not read correctly').to.deep.equal(expected);

        var unlinkP = BluePromise.promisify(fs.unlink);
        return unlinkP(path);
      });
  });

  it('can save and load "pretty" GraphSON asynchronously via promise', (): BluePromise<void> => {
    var tmpNameP = BluePromise.promisify(tmp.tmpName);
    var g2: Java.Graph;
    var path: string;
    return tmpNameP()
      .then((_path: string): BluePromise<Java.Graph> => {
        path = _path;
        return TP.savePrettyGraphSON(g, path);
      })
      .then((graph: Java.Graph): BluePromise<Java.Graph> => {
        expect(g, 'savePrettyGraphSON did not return graph').to.deep.equal(graph);
        g2 = makeEmptyTinker();
        return TP.loadPrettyGraphSON(g2, path);
      })
      .then((graph: Java.Graph): BluePromise<void> => {
        expect(g2, 'loadGraphSON did not return graph').to.deep.equal(graph);
        var str: string = g2.toString();
        var expected: string = 'tinkergraph[vertices:6 edges:6]';
        expect(str, 'GraphSON was not read correctly').to.deep.equal(expected);

        var unlinkP = BluePromise.promisify(fs.unlink);
        return unlinkP(path);
      });
  });

});

describe('Pretty GraphSON support using TheCrew', () => {

  var g: Java.Graph;

  beforeEach((done: MochaDone): void => {
    TP.TinkerFactory.createTheCrewP()
      .then((graph: Java.Graph): void => {
        g = graph;
      })
      .then((): void => done())
      .catch(done);
  });

  // Create an empty, in-memory Gremlin graph.
  function makeEmptyTinker(): Java.Graph {
    var graph: Java.Graph = TP.TinkerGraph.open();
    var str: string = graph.toString();
    var expected: string = 'tinkergraph[vertices:0 edges:0]';
    expect(str, 'Expected graph to be empty').to.deep.equal(expected);
    return graph;
  }

  it('can save and load "pretty" GraphSON synchronously', (done: MochaDone): void => {
    tmp.tmpName((err: any, path: string): void => {
      if (err) {
        // A failure in tmpName is not a failure in gremlin-node.
        // If this ever fails, it is likely some environmental problem.
        throw err;
      }
      expect(TP.savePrettyGraphSONSync(g, path), 'savePrettyGraphSONSync did not return graph').to.deep.equal(g);
      var g2: Java.Graph = makeEmptyTinker();
      expect(TP.loadPrettyGraphSONSync(g2, path), 'loadPrettyGraphSONSync did not return graph').to.deep.equal(g2);
      var str: string = g2.toString();
      var expected: string = 'tinkergraph[vertices:6 edges:14]';
      expect(str, 'GraphSON was not read correctly').to.deep.equal(expected);
      fs.unlink(path, done);
    });
  });

  it('can save and load "pretty" GraphSON asynchronously via callback', (done: MochaDone): void => {
    tmp.tmpName((err: any, path: string): void => {
      if (err) {
        // A failure in tmpName is not a failure in gremlin-node.
        // If this ever fails, it is likely some environmental problem.
        throw err;
      }
      TP.savePrettyGraphSON(g, path, (err: Error, graph: Java.Graph): void => {
        expect(err).to.not.exist;
        expect(g, 'saveGraphSON did not return graph').to.deep.equal(graph);

        var g2: Java.Graph = makeEmptyTinker();
        TP.loadPrettyGraphSON(g2, path, (err: Error, graph: Java.Graph): void => {
          expect(err).to.not.exist;
          expect(g2, 'loadGraphSON did not return graph').to.deep.equal(graph);
          var str: string = g2.toString();
          var expected: string = 'tinkergraph[vertices:6 edges:14]';
          expect(str, 'GraphSON was not read correctly').to.deep.equal(expected);
          fs.unlink(path, done);
        });
      });
    });
  });

  it('can save and load "pretty" GraphSON asynchronously via promise', (): BluePromise<void> => {
    var tmpNameP = BluePromise.promisify(tmp.tmpName);
    var g2: Java.Graph;
    var path: string;
    return tmpNameP()
      .then((_path: string): BluePromise<Java.Graph> => {
        path = _path;
        return TP.savePrettyGraphSON(g, path);
      })
      .then((graph: Java.Graph): BluePromise<Java.Graph> => {
        expect(g, 'savePrettyGraphSON did not return graph').to.deep.equal(graph);
        g2 = makeEmptyTinker();
        return TP.loadPrettyGraphSON(g2, path);
      })
      .then((graph: Java.Graph): BluePromise<void> => {
        expect(g2, 'loadGraphSON did not return graph').to.deep.equal(graph);
        var str: string = g2.toString();
        var expected: string = 'tinkergraph[vertices:6 edges:14]';
        expect(str, 'GraphSON was not read correctly').to.deep.equal(expected);

        var unlinkP = BluePromise.promisify(fs.unlink);
        return unlinkP(path);
      });
  });

  it('yields a file identical to a golden reference file', (): BluePromise<void> => {
    var tmpNameP = BluePromise.promisify(tmp.tmpName);
    var liveContents: string;
    var tmpPath: string;
    return tmpNameP()
      .then((_path: string): BluePromise<Java.Graph> => {
        tmpPath = _path;
        return TP.savePrettyGraphSON(g, tmpPath);
      })
      .then((graph: Java.Graph): BluePromise<Java.Graph> => {
        expect(g, 'savePrettyGraphSON did not return graph').to.deep.equal(graph);
        return readFileP(tmpPath, { encoding: 'utf8' })
      })
      .then((_liveContents: string): BluePromise<void> => {
        liveContents = _liveContents;
        var unlinkP = BluePromise.promisify(fs.unlink);
        return unlinkP(tmpPath);
      })
      .then((): BluePromise<string> => {
        var goldenPath = path.join(__dirname, 'data', 'thecrew.json');
        return readFileP(goldenPath, { encoding: 'utf8' })
      })
      .then((goldenContents: string): BluePromise<void> => {
        expect(liveContents.split('\n')).to.deep.equal(goldenContents.split('\n'));
        return;
      });
  });

});

describe('isType', (): void => {

  it('returns false for non-Java objects', (): void => {
    var type: string = 'java.lang.Object';
    var objects: any[] = [ null, undefined, 'abc', 123, true, false, {'foo': 9} ];
    _.forEach(objects, (o: any) => expect(TP.isType(o, type), o).to.be.false);
  });

  it('returns true on exact match', (): void => {
    expect(TP.isType(TP.Java.newLong(123), 'java.lang.Long')).to.be.true;
    var ArrayList: Java.ArrayList.Static = TP.autoImport('ArrayList');
    expect(TP.isType(new ArrayList(), 'java.util.ArrayList')).to.be.true;
  });

  it('returns true for supertypes', (): void => {
    expect(TP.isType(TP.Java.newLong(123), 'java.lang.Number')).to.be.true;
    var ArrayList: Java.ArrayList.Static = TP.autoImport('ArrayList');
    expect(TP.isType(new ArrayList(), 'java.util.List')).to.be.true;
  });

  it('returns false for unrelated types', (): void => {
    expect(TP.isType(TP.Java.newLong(123), 'java.lang.Integer')).to.be.false;
    var ArrayList: Java.ArrayList.Static = TP.autoImport('ArrayList');
    expect(TP.isType(new ArrayList(), 'java.util.HashMap')).to.be.false;
  });

});

describe('jsify', (): void => {

  it('converts Java long to JS string', (): void => {
    var javaLong: Java.longValue_t = L(123);
    var jsLong: any = TP.jsify(javaLong);
    expect(jsLong).to.deep.equal('123');
    expect(TP.isJavaObject(jsLong), 'JS long representation should not be a Java object').to.be.false;
  });

  it('converts Java List to JS array', (): void => {
    var ArrayList: Java.ArrayList.Static = TP.autoImport('ArrayList');
    var javaList: Java.List = new ArrayList();
    javaList.add('one');
    javaList.add('two');
    javaList.add('three');

    var nestedList: Java.List = new ArrayList();
    nestedList.add('nested');
    nestedList.add('list');
    javaList.add(nestedList)

    var jsArray: string[] = TP.jsify(javaList);
    expect(_.isArray(jsArray)).to.be.true;
    expect(jsArray).to.deep.equal(['one', 'two', 'three', ['nested', 'list']]);
  });

  it('recurses into a Java array', (): void => {
    var ArrayList: Java.ArrayList.Static = TP.autoImport('ArrayList');
    var javaList: Java.List = new ArrayList();
    javaList.add('one');
    javaList.add('two');
    javaList.add('three');

    var nestedList: Java.List = new ArrayList();
    nestedList.add('nested');
    nestedList.add('list');
    javaList.add(nestedList)

    var jsArray: string[] = TP.jsify(javaList.toArray());
    expect(_.isArray(jsArray)).to.be.true;
    expect(jsArray).to.deep.equal(['one', 'two', 'three', ['nested', 'list']]);
  });

  it('converts Java Map to JS object', (): void => {
    var HashMap: Java.HashMap.Static = TP.autoImport('HashMap');
    var javaMap: Java.HashMap = new HashMap();
    javaMap.put('one', 1);
    javaMap.put('two', 'deux');

    var nestedMap: Java.HashMap = new HashMap();
    nestedMap.put('nested', 'NIDO');
    nestedMap.put('map', 'CARTA');
    javaMap.put('three', nestedMap);

    var js: any = TP.jsify(javaMap);
    expect(_.isObject(js)).to.be.true;
    expect(js).to.deep.equal({'one': 1, 'two': 'deux', 'three': {'nested': 'NIDO', 'map': 'CARTA'}});
  });

  it('converts Java Set to JS array', (): void => {
    var HashSet: Java.HashSet.Static = TP.autoImport('HashSet');
    var hashSet: Java.HashSet = new HashSet();
    hashSet.add('one');
    hashSet.add('two');
    hashSet.add('three');

    var nestedSet: Java.HashSet = new HashSet();
    nestedSet.add('nested');
    nestedSet.add('set');
    hashSet.add(nestedSet)

    var actual: any = TP.jsify(hashSet);
    expect(_.isArray(actual)).to.be.true;
    actual.sort();
    dlog('actual:', actual);

    // Divide the results into arrays and not-arrays.
    var grouped: any = _.groupBy(actual, _.isArray);
    // Check the scalar members.
    var scalars: string[] = grouped.false;
    expect(scalars).to.have.members(['one', 'two', 'three']);
    // Check the nested array.
    var arrays: string[] = grouped.true;
    expect(arrays).to.have.length(1);
    expect(arrays[0]).to.have.members(['nested', 'set']);
  });

  it('converts Java BulkSet to JS array of key/count objects', (): void => {
    var BulkSet: Java.BulkSet.Static = TP.autoImport('BulkSet');
    var bulkSet: Java.BulkSet = new BulkSet();
    bulkSet.add('one', 1);
    bulkSet.add('two', 2);
    bulkSet.add('three', 3);

    var actual: any = TP.jsify(bulkSet);
    expect(_.isArray(actual)).to.be.true;
    actual = sortByAll(actual, ['key']);
    dlog('actual:', actual);

    var expected: any[] = [
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

  it('converts Java Map$Entry to JS key/value map', (): void => {
    var LinkedHashMap: Java.HashMap.Static = TP.autoImport('LinkedHashMap');
    var javaMap: Java.LinkedHashMap = new LinkedHashMap();
    javaMap.put('one', 1);
    javaMap.put('two', 'deux');
    javaMap.put('long', L(123));

    var nestedMap: Java.LinkedHashMap = new LinkedHashMap();
    nestedMap.put('nested', 'NIDO');
    nestedMap.put('map', 'CARTA');

    // Create a List containing Map$Entry's
    var ArrayList: Java.ArrayList.Static = TP.autoImport('ArrayList');
    var nestedList: Java.List = new ArrayList();
    var it = nestedMap.entrySet().iterator();
    while (it.hasNext()) {
      nestedList.add(it.next());
    }
    javaMap.put('nested', nestedList);

    var js: any = TP.jsify(javaMap.entrySet().toArray());
    expect(_.isObject(js)).to.be.true;
    expect(js).to.deep.equal([
      { key: 'one', value: 1 },
      { key: 'two', value: 'deux' },
      { key: 'long', value: '123' },
      { key: 'nested', value: [
        { key: 'nested', value: 'NIDO' },
        { key: 'map', value: 'CARTA' }
      ]}]);
  });

  it('converts Path to JS array of labels and objects', (): void => {
    var MutablePath: Java.MutablePath.Static = TP.autoImport('MutablePath');
    var path: Java.MutablePath = MutablePath.make();

    // Add some simple items to the path.
    path.extend(123, 'one');
    path.extend(456, 'two');

    // They don't have to have labels.
    path.extend('foo');

    // They can have multiple labels.
    path.extend('bar', 'a', 'b', 'c');

    // Complex objects can appear in the path, and those should be recursively jsify-ed.
    var ArrayList: Java.ArrayList.Static = TP.autoImport('ArrayList');
    var javaList: Java.List = new ArrayList();
    javaList.add('un');
    javaList.add('deux');
    javaList.add('trois');
    path.extend(javaList, 'complex');

    // Paths can even contain other Paths.
    var nestedPath: Java.MutablePath = MutablePath.make();
    nestedPath.extend(1, 'uno');
    nestedPath.extend(2, 'dos');
    nestedPath.extend(3, 'tres');
    path.extend(nestedPath, 'nested');

    var js: any = TP.jsify(path);
    expect(TP.isJavaObject(js), 'jsify should not return Java Path').to.be.false;
    expect(_.isArray(js), 'jsify should turn Path into JS array').to.be.true;
    var expected: TP.PathElement[] = [
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
