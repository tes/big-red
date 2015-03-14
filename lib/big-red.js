var _ = require('lodash');
var references = {};

function reset() {
  references = {};
}

function attach(reference) {
  if(!reference.name || !reference.retriever || !reference.trigger) {
    return;
  }
  _.defaults(reference, { interval: 60000, loaded: false, 'ticker': ticker(reference) });
  references[reference.name] = reference;
}

function get(reference) {
  return references[reference] ? references[reference]._data : undefined;
}

function ticker(reference) {
  tick.bind(reference)();
  return setInterval(tick.bind(reference), reference.interval);
}

function tick() {
  var reference = this;
  reference.trigger(function(err, changes) {
    if(err) return;
    if(!reference._data || changes) {
      reference.retriever(function(err, data) {
        if(err) return;
        reference._data = data;
        reference.loaded = true;
      });
    }
  });
}

function loaded(next) {

  var isLoaded = function() {
    return _.filter(_.values(references), function(reference) { return !reference.loaded; }).length === 0;
  }

  var checkLoaded = function() {
    if(isLoaded()) {
      return next();
    } else {
      setTimeout(checkLoaded, 1);
    }
  }

  checkLoaded();

}

module.exports = {
  attach: attach,
  loaded: loaded,
  reset: reset,
  get: get
};
