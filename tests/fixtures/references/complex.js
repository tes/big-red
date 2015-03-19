var data = {
  'A':{data:'hello'},
  'B':{data:'goodbye'},
};

module.exports = {
  name:'complex',
  retriever: function(next) {
    next(null, data);
  },
  poller: function(next) {
    next();
  }
};
