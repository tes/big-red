var data = [
  {code:'1', name:'Big Bird', type:'bird'},
  {code:'2', name:'Snuffleupagus', type: 'elephant'}
];

module.exports = {
  name:'sesame-street',
  id:'code',
  retriever: function(next) {
    next(null, data);
  },
  poller: function(next) {
    next();
  },
  fn: {
    first: function() {
      var self = this.array;
      return self[0];
    }
  }
};
