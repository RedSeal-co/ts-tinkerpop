// # tinkerpop-test.ts
/// <reference path='../typings/bluebird/bluebird.d.ts' />
/// <reference path='../typings/chai/chai.d.ts'/>
/// <reference path='../typings/debug/debug.d.ts' />
/// <reference path='../typings/glob/glob.d.ts' />
/// <reference path='../typings/mocha/mocha.d.ts'/>
/// <reference path='../typings/node/node.d.ts'/>
/// <reference path='../typings/tmp/tmp.d.ts'/>

'use strict';

declare function require(name: string): any;
require('source-map-support').install();

import BluePromise = require('bluebird');
import chai = require('chai');
import debug = require('debug');
import fs = require('fs');
import glob = require('glob');
import tmp = require('tmp');
import TP = require('../lib/ts-tinkerpop');
import util = require('util');

import expect = chai.expect;
import java = TP.java;

var dlog = debug('ts-tinkerpop:test');

before((done: MochaDone): void => {
  java.asyncOptions = {
    syncSuffix: '',
    promiseSuffix: 'P',
    promisify: require('bluebird').promisify
  };

  var filenames = glob.sync('target/**/*.jar');
  filenames.forEach((name: string): void => {
    dlog('classpath:', name);
    java.classpath.push(name);
  });

  TP.initialize();
  done();
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
      var allVerticesTraversal = graph.V();

      // The "count" method applies to a Traversal, destructively measuring the number of
      // elements in it.
      allVerticesTraversal.count().nextP().then((count: Java.Object): void => {
        expect(count.valueOf()).to.equal(0);

        // Count edges.
        var allEdgesTraversal = graph.E();

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
    // Gremlin would be `graph.V.value('name').dedup`.  However, it can also be written with
    // the shortcut syntax for property access: `graph.V.name.dedup`.
    it('has certain names', (): BluePromise<void> => {
      var distinctNamesTraversal: Java.GraphTraversal = graph.V().values('name').dedup();
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
      return graph.V().has('name', 'marko')
        .nextP()
        .then((v: Java.Vertex) => {
          expect(v).to.be.ok;
          var name: Java.object_t = v.value('name');
          expect(name).to.be.equal('marko');
        });
    });

    it('g.V().value("name")', (): BluePromise<void> => {
      return graph.V().values('name').toListP()
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
      return graph.V().filter(lambda).toListP()
        .then((list: Java.List) => list.toArrayP())
        .then((recs: Java.object_t[] ) => {
          expect(recs).to.be.ok;
          expect(recs.length).to.equal(1);
          var v: Java.Vertex = TP.asVertex(recs[0]);
          var vertexObj: any = TP.vertexToJson(v);
          var expected = {
            id: 3,
            label: 'vertex',
            type: 'vertex',
            properties: {
              name: [ { id: 4, value: 'lop', properties: {} } ],
              lang: [ { id: 5, value: 'java', properties: {} } ]
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

      var chosen = graph.V().has('age').choose(lambda)
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

      var chosen = graph.V().has('age').choose(lambda)
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
      var traversal = graph.V();
      return TP.forEach(traversal, (obj: Java.Object): BluePromise<void> => {
        var v: Java.Vertex = TP.asVertex(obj);
        var json: any = TP.vertexToJson(v);
        expect(json).to.include.keys(['id', 'label', 'type', 'properties']);
        expect(json.type).to.equal('vertex');
        return BluePromise.resolve();
      });
    });

    it('TP.forEach(g.E())', (): BluePromise<void> => {
      var traversal = graph.E();
      return TP.forEach(traversal, (obj: Java.Object): BluePromise<void> => {
        var e: Java.Edge = TP.asEdge(obj);
        var json: any = TP.edgeToJson(e);
        expect(json).to.include.keys(['id', 'label', 'type', 'properties', 'inV', 'outV', 'inVLabel', 'outVLabel']);
        expect(json.type).to.equal('edge');
        return BluePromise.resolve();
      });
    });

    it('TP.asJSON(vertices)', (): void => {
      var traversal = graph.V().has('lang', TP.Compare.eq, 'java');
      var json: any = TP.asJSON(traversal);
      var expected = [
        {
          id: 3,
          label: 'vertex',
          type: 'vertex',
          properties:
          {
            name: [ { id: 4, value: 'lop', properties: {} } ],
            lang: [ { id: 5, value: 'java', properties: {} } ]
          }
        },
        {
          id: 5,
          label: 'vertex',
          type: 'vertex',
          properties:
          {
            name: [ { id: 8, value: 'ripple', properties: {} } ],
            lang: [ { id: 9, value: 'java', properties: {} } ]
          }
        }
      ];
      expect(json).to.deep.equal(expected);
    });

    it('TP.asJSON(vertices) with simplifyVertex', (): void => {
      var traversal = graph.V().has('lang', TP.Compare.eq, 'java');
      var json: any = TP.simplifyVertexProperties(TP.asJSON(traversal));
      var expected = [
        {
          id: 3,
          label: 'vertex',
          type: 'vertex',
          properties:
          {
            name: 'lop',
            lang: 'java'
          }
        },
        {
          id: 5,
          label: 'vertex',
          type: 'vertex',
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
      var traversal = graph.E().has('weight', TP.Compare.eq, java.newFloat(1.0));
      var json: any = TP.asJSON(traversal);
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
    var TestClass: Java.TestClass.Static = TP.java.import(testClassName);
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
      expect(TP.loadGraphSONSync(g2, path), 'loadGraphSONSync did not return graph').to.deep.equal(g2);
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

});
