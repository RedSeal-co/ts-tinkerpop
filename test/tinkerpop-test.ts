// # tinkerpop-test.ts
/// <reference path='../typings/bluebird/bluebird.d.ts' />
/// <reference path='../typings/chai/chai.d.ts'/>
/// <reference path='../typings/debug/debug.d.ts' />
/// <reference path='../typings/glob/glob.d.ts' />
/// <reference path='../typings/java/java.d.ts' />
/// <reference path='../typings/mocha/mocha.d.ts'/>
/// <reference path='../typings/node/node.d.ts'/>

'use strict';

declare function require(name: string): any;
require('source-map-support').install();

import BluePromise = require('bluebird');
import chai = require('chai');
import debug = require('debug');
import glob = require('glob');
import java = require('java');
import TP = require('../lib/index');
import util = require('util');

var dlog = debug('ts-tinkerpop:test');

before((done: MochaDone): void => {
  java.asyncOptions = {
    syncSuffix: 'Sync',
    promiseSuffix: 'P',
    promisify: require('bluebird').promisify
  };

  var filenames = glob.sync('target/**/*.jar');
  filenames.forEach((name: string): void => { dlog(name); java.classpath.push(name); });

  TP.initialize();
  done();
});

describe('Gremlin', (): void => {

  var expect = chai.expect;

  var graph: Java.TinkerGraph;

  before((done: MochaDone): void => {
    expect(TP.TinkerGraph).to.be.ok;
    done();
  });

  // ## TinkerGraph in-memory
  // Tests using an empty in-memory TinkerGraph database instance.
  describe('TinkerGraph empty', (): void => {

    before((): void => {
      graph = TP.TinkerGraph.openSync();
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
      var allVerticesTraversal = graph.VSync();

      // The "count" method applies to a Traversal, destructively measuring the number of
      // elements in it.
      allVerticesTraversal.countSync().nextP().then((count: Java.Object): void => {
        expect(count.valueOf()).to.equal(0);

        // Count edges.
        var allEdgesTraversal = graph.ESync();

        allEdgesTraversal.countSync().nextP().then((count: Java.Object): void => {
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
      graph = TP.TinkerFactory.createClassicSync();
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
      var distinctNamesTraversal: Java.GraphTraversal = graph.VSync().valuesSync('name').dedupSync();
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
      return graph.VSync().hasSync('name', 'marko')
        .nextP()
        .then((v: Java.Vertex) => {
          expect(v).to.be.ok;
          var name: Java.object_t = v.valueSync('name');
          expect(name).to.be.equal('marko');
        });
    });

    it('g.V().valueSync("name")', (): BluePromise<void> => {
      return graph.VSync().valuesSync('name').toListP()
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
      return graph.VSync().filterSync(lambda).toListP()
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

      var chosen = graph.VSync().hasSync('age').chooseSync(lambda)
          .optionSync(5, __.inSync())
          .optionSync(4, __.outSync())
          .optionSync(3, __.bothSync())
          .valuesSync('name');

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

      var chosen = graph.VSync().hasSync('age').chooseSync(lambda)
          .optionSync(5, __.inSync())
          .optionSync(4, __.outSync())
          .optionSync(3, __.bothSync())
          .valuesSync('name');

      return chosen.toListP()
        .then((list: Java.List) => list.toArrayP())
        .then((actual: Java.object_t[] ) => {
          var expected = ['marko', 'ripple', 'lop'];
          expect(actual.sort()).to.deep.equal(expected.sort());
        });
    });

    it('TP.forEach(g.V())', (): BluePromise<void> => {
      var traversal = graph.VSync();
      return TP.forEach(traversal, (obj: Java.Object): BluePromise<void> => {
        var v: Java.Vertex = TP.asVertex(obj);
        var json: any = TP.vertexToJson(v);
        expect(json).to.include.keys(['id', 'label', 'type', 'properties']);
        expect(json.type).to.equal('vertex');
        return BluePromise.resolve();
      });
    });

    it('TP.forEach(g.E())', (): BluePromise<void> => {
      var traversal = graph.ESync();
      return TP.forEach(traversal, (obj: Java.Object): BluePromise<void> => {
        var e: Java.Edge = TP.asEdge(obj);
        var json: any = TP.edgeToJson(e);
        expect(json).to.include.keys(['id', 'label', 'type', 'properties', 'inV', 'outV', 'inVLabel', 'outVLabel']);
        expect(json.type).to.equal('edge');
        return BluePromise.resolve();
      });
    });

    it('TP.asJSONSync(vertices)', (): void => {
      var traversal = graph.VSync().hasSync('lang', TP.Compare.eq, 'java');
      var json: any = TP.asJSONSync(traversal);
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

    it('TP.asJSONSync(vertices) with simplifyVertex', (): void => {
      var traversal = graph.VSync().hasSync('lang', TP.Compare.eq, 'java');
      var json: any = TP.simplifyVertexProperties(TP.asJSONSync(traversal));
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

    it('TP.asJSONSync(edges)', (): void => {
      var traversal = graph.ESync().hasSync('weight', TP.Compare.eq, java.newFloat(1.0));
      var json: any = TP.asJSONSync(traversal);
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
