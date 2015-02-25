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

var noargs: Java.array_t<Java.Object>;

before((done: MochaDone) => {
  java.asyncOptions = {
    promiseSuffix: 'Promise',
    promisify: require('bluebird').promisify
  };

  var filenames = glob.sync('target/dependency/**/*.jar');
  filenames.forEach((name: string) => { java.classpath.push(name); });

  noargs = java.newArray<Java.Object>('java.lang.Object', []);
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

  var TinkerGraph: Java.com.tinkerpop.gremlin.tinkergraph.structure.TinkerGraph.Static;
  var graph: Java.TinkerGraph;

  before((done: MochaDone) => {
    TinkerGraph = java.import('com.tinkerpop.gremlin.tinkergraph.structure.TinkerGraph');
    expect(TinkerGraph).to.be.ok;
    done();
  });

  // ## TinkerGraph in-memory
  // Tests using an empty in-memory TinkerGraph database instance.
  describe('TinkerGraph empty', function() {

    before(() => {
      graph = TinkerGraph.openSync();
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
      var allVerticesTraversal = graph.VSync(noargs);

      // The "count" method applies to a Traversal, destructively measuring the number of
      // elements in it.
      allVerticesTraversal.countSync().next(function(err: Error, count: Java.Object) {
        expect(err).to.not.exist;
        expect(count.valueOf()).to.equal(0);

        // Count edges.
        var allEdgesTraversal = graph.ESync(noargs);

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

    var TinkerFactory: Java.com.tinkerpop.gremlin.tinkergraph.structure.TinkerFactory.Static;
    var graph: Java.TinkerGraph;

    before(function() {
      TinkerFactory = java.import('com.tinkerpop.gremlin.tinkergraph.structure.TinkerFactory');
      expect(TinkerFactory).to.be.ok;
      graph = TinkerFactory.createClassicSync();
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
      var props: Java.array_t<Java.String> = java.newArray<Java.String>('java.lang.String', ['name']);
      var distinctNamesTraversal: Java.GraphTraversal = graph.VSync(noargs).valuesSync(props).dedupSync();
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

  });

});
