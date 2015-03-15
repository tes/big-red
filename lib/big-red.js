var _ = require('lodash');
var ra = require('require-all');

var LOAD_CHECK_MS = 5;
var references = {};

function reset() {
  references = {};
}

function attachPath(path) {
  _.map(_.values(ra(path)), attach);
}

function attach(reference) {
  if(!reference.name || !reference.retriever || !reference.poller) {
    return;
  }
  _.defaults(reference, {interval: 60000, id: 'id', loaded: false, err: null, data: [], map: {}, fn: {} });
  reference.ticker = ticker(reference);
  references[reference.name] = reference;
}

function get(referenceName) {
  return references[referenceName];
}

function ticker(reference) {
  tick.bind(reference)();
  setTimeout(function() {
    return setInterval(tick.bind(reference), reference.interval);
  }, Math.random() * 50 + 25); // Introduce slight fuzziness to avoid all pollers coinciding
}

function tick() {

  var reference = this;

  var handleError = function(err) {
      reference.loaded = false;
      reference.err = err;
  }

  reference.poller(function(err, changes) {

    if(err) { return handleError(err); }

    if(reference.data.length === 0 || changes) {

      reference.retriever(function(err, data) {

        if(err) { return handleError(err); }
        reference.err = null;

        var dataIsArray = data.constructor === Array;

        if(dataIsArray) {
          // !Always update the array in place
          reference.type = 'data';
          reference.data.length = 0;
          data.forEach(function(value) {
            reference.data.push(value);
          });
        } else {
          // TODO: Update properties not replace object
          reference.type = 'map';
          reference.map = data;
        }

        bindHelpers(reference);

        reference.loaded = true;

      });

    }

  });

}

function bindHelpers(reference) {
  _.forOwn(reference.fn, function(fn, key) {
    reference.fn[key] = fn.bind(reference[reference.type]);
  });
}

function loaded(next) {

  var isLoaded = function() {
    return _.filter(_.values(references), function(reference) {
      return !reference.loaded && !reference.err
    }).length === 0;
  }

  var checkLoaded = function() {
    if(isLoaded()) {
      return next();
    } else {
      setTimeout(checkLoaded, LOAD_CHECK_MS);
    }
  }

  checkLoaded();

}

module.exports = {
  attach: attach,
  attachPath: attachPath,
  loaded: loaded,
  reset: reset,
  get: get
};
