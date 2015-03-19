var _ = require('lodash');
var ra = require('require-all');

var LOAD_CHECK_MS = 1;
var references = {};

var loadedCheck = false;
var loadedWarning = false;

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
  _.defaults(reference, {interval: 60000, id: 'id', loaded: false, err: null, enabled: false, array: [], map: {}, fn: {} });
  references[reference.name] = reference;
}

function get(referenceName) {
  if(!loadedCheck && !loadedWarning) {
    loadedWarning = true;
    console.log('WARNING: You are accessing reference data without first checking if it has been loaded, this may or may not be a problem.');
  }
  return references[referenceName];
}

function ticker(reference) {
  reference.enabled = true;
  tick.bind(reference)(true);
  setTimeout(function() {
    return setInterval(tick.bind(reference), reference.interval);
  }, Math.random() * 50 + 25); // Introduce slight fuzziness to avoid all pollers coinciding
}

function tick(firstTick) {

  var reference = this;

  var handleError = function(err) {
      reference.loaded = false;
      reference.err = err;
  }

  reference.poller(function(err, changes) {

    if(err) { return handleError(err); }

    if(firstTick || changes) {

      reference.retriever(function(err, data) {

        if(err) { return handleError(err); }
        reference.err = null;

        var dataIsArray = data.constructor === Array;

        if(dataIsArray) {

          // !Always update the array in place
          reference.type = 'data';
          reference.array.length = 0;
          data.forEach(function(value) {
            reference.array.push(value);
          });

          // Mapify any array data if it fits the pattern
          if(reference.id && data[0][reference.id]) {
            mapify(reference, data);
          }

        } else {

          reference.type = 'map';
          clearMap(reference);
          _.defaults(reference.map, data);

        }

        bindHelpers(reference);

        reference.loaded = true;

      });

    }

  });

}

function clearMap(reference) {
  _.keys(reference.map).forEach(function(key) {
    delete reference.map[key];
  });
}

function mapify(reference, data) {
  clearMap(reference);
  data.forEach(function(item) {
      reference.map[item.id] = item;
  });
}

function bindHelpers(reference) {
  _.forOwn(reference.fn, function(fn, key) {
    if(typeof fn === 'function') {
      reference.fn[key] = fn.bind(reference);
    }
  });
}

function load(toLoad, next) {

  var anyLoaded = false;

  if(!toLoad || toLoad.length === 0) {
    toLoad = _.keys(references);
  }

  toLoad.forEach(function(reference) {
    if(!references[reference]) {
      console.log('Attempted to load reference that doesnt exist: ' + reference);
    } else {
      references[reference].ticker = ticker(references[reference]);
      anyLoaded = true;
    }
  });

  return anyLoaded ? loaded(next) : next();

}

function loaded(next) {

  var checkIsLoaded = _.filter(_.values(references), function(reference) {
    return reference.enabled;
  });

  var isLoaded = function() {
    var isLoaded = true;
    checkIsLoaded.forEach(function(reference) {
      isLoaded = isLoaded && (reference.loaded || reference.err);
    });
    return isLoaded;
  }

  var checkLoaded = function() {
    if(isLoaded()) {
      checkLoaded = true;
      return next();
    } else {
      setTimeout(checkLoaded, LOAD_CHECK_MS);
    }
  }

  checkLoaded();

}

function status() {
  return _.map(_.values(references), function(reference) {
      return {
        name: reference.name,
        interval: reference.interval,
        id: reference.id,
        type: reference.type,
        err: reference.err,
        loaded: reference.loaded,
        count: reference.array.length ? reference.array.length : Object.keys(reference.map).length
      }
  });
}

module.exports = {
  attach: attach,
  attachPath: attachPath,
  load: load,
  loaded: loaded,
  reset: reset,
  get: get,
  status: status
};
