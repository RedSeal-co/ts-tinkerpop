/// <reference path='typings/java/java.d.ts' />
/// <reference path='typings/lodash/lodash.d.ts' />
var _ = require('lodash');
var java = require('java');
var J;
(function (J) {
    'use strict';
    J.__;
    J.noargs;
    J.T;
    J.TinkerFactory;
    J.TinkerGraph;
    // ### *initialize()* should be called once just after java has been configured.
    // Java configuration includes classpath, options, and asyncOptions.
    // If this method is called before configuration, the java.import calls will likely
    // fail due to the classes not being on the classpath.
    // This method must be called before any of the exported vars above are accessed.
    // It is wasteful, but not an error, to call this method more than once.
    function initialize() {
        J.__ = java.import('com.tinkerpop.gremlin.process.graph.traversal.__');
        J.noargs = java.newArray('java.lang.String', []);
        J.T = java.import('com.tinkerpop.gremlin.process.T');
        J.TinkerFactory = java.import('com.tinkerpop.gremlin.tinkergraph.structure.TinkerFactory');
        J.TinkerGraph = java.import('com.tinkerpop.gremlin.tinkergraph.structure.TinkerGraph');
    }
    J.initialize = initialize;
    function id(n) {
        return java.newLong(n);
    }
    J.id = id;
    function ids(a) {
        return java.newArray('java.lang.Object', _.map(a, function (n) { return id(n); }));
    }
    J.ids = ids;
    function S(strs) {
        return java.newArray('java.lang.String', strs);
    }
    J.S = S;
})(J || (J = {}));
module.exports = J;
//# sourceMappingURL=index.js.map