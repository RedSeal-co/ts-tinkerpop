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

declare function require(name: string): any;
require('source-map-support').install();

import _ = require('lodash');
import chai = require('chai');
import should = require('should');
import glob = require('glob');
import java = require('java');
import J = require('../index');

before((done: MochaDone) => {
  java.asyncOptions = {
    promiseSuffix: 'Promise',
    promisify: require('bluebird').promisify
  };

  var filenames = glob.sync('target/dependency/**/*.jar');
  filenames.forEach((name: string) => { java.classpath.push(name); });

  J.initialize();
  done();
});

describe('Gremlin', function() {

  var async = require('async');
  var expect = chai.expect;
  var semaphore = require('semaphore');
  var stringify = require('json-stable-stringify');
  var temp = require('temp');
  // Cleanup temp files at exit.
  temp.track();

  var graph: Java.TinkerGraph;

  before((done: MochaDone) => {
    expect(J.TinkerGraph).to.be.ok;
    done();
  });

  // ## TinkerGraph in-memory
  // Tests using an empty in-memory TinkerGraph database instance.
  describe('TinkerGraph empty', function() {

    before(() => {
      graph = J.TinkerGraph.openSync();
      expect(graph).to.be.ok;
    });

    after((done: MochaDone) => {
      if (graph) {
        graph.close(() => {
          graph = null;
          done();
        });
      } else {
          done();
      }
    });

    it('should initialize', function() {
      // intentionally blank
    });

    // Check that the Gremlin statements `graph.V.count()` and `graph.E.count()` return `0`.
    it('should be empty', function(done: MochaDone) {
      // Count vertices.
      var allVerticesTraversal = graph.VSync(J.noargs);

      // The "count" method applies to a Traversal, destructively measuring the number of
      // elements in it.
      allVerticesTraversal.countSync().next(function(err: Error, count: Java.Object) {
        expect(err).to.not.exist;
        expect(count.valueOf()).to.equal(0);

        // Count edges.
        var allEdgesTraversal = graph.ESync(J.noargs);

        allEdgesTraversal.countSync().next(function(err: Error, count: Java.Object) {
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
  describe('TinkerGraph built-in example', function() {

    var graph: Java.TinkerGraph;

    before(function() {
      expect(J.TinkerFactory).to.be.ok;
      graph = J.TinkerFactory.createClassicSync();
      expect(graph).to.be.ok;
    });

    after(function(done: MochaDone) {
      if (graph) {
        graph.close(function() {
          graph = null;
          done();
        });
      } else {
        done();
      }
    });

    it('should initialize', function() {
      // intentionally blank
    });

    // To extract the unique values of the "name" property from all vertices, the canonical
    // Gremlin would be `graph.V.value('name').dedup`.  However, it can also be written with
    // the shortcut syntax for property access: `graph.V.name.dedup`.
    it('has certain names', function() {
      var distinctNamesTraversal: Java.GraphTraversal = graph.VSync(J.noargs).valuesSync(J.S(['name'])).dedupSync();
      expect(distinctNamesTraversal).to.be.ok;
      return distinctNamesTraversal
        .toListPromise()
        .then((list: Java.List) => list.toArrayPromise())
        .then((data: Java.object_t[] ) => {
          var expected = ['lop', 'vadas', 'marko', 'peter', 'ripple', 'josh'];
          // Sort data to ignore sequence differences.
          expected.sort();
          data.sort();
          expect(data).to.deep.equal(expected);
        });
      });

    // See http://gremlindocs.com/#recipes/shortest-path, first method
    it('can inefficiently find many paths between two nodes', function(done: MochaDone) {
      var traversal: Java.GraphTraversal = graph.VSync(J.ids([2]));
      traversal = traversal.asSync('x');
      traversal = traversal.bothSync(J.noargs);
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

    it('g.V().has("name", "marko") -> v.value("name")',  function() {
      return graph.VSync(J.noargs).hasSync('name', 'marko')
        .nextPromise()
        .then((v: Java.Vertex) => {
          expect(v).to.be.ok;
          var name: Java.object_t = v.valueSync('name');
          expect(name).to.be.equal('marko');
        });
    });

    it('g.V().valueSync("name")',  function() {
      return graph.VSync(J.noargs).valuesSync(J.S(['name'])).toListPromise()
        .then((list: Java.List) => list.toArrayPromise())
        .then((data: Java.object_t[] ) => {
          expect(data).to.be.ok;
          console.log(data);
        });
    });

  });

});
