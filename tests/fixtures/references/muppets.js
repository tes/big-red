
var data = [
              {id:'1', name:'Kermit', type:'frog'},
              {id:'2', name:'Miss Piggy', type: 'pig'},
              {id:'3', name:'Fozzie Bear', type: 'bear'}
            ];

module.exports = {
  name:'muppets',
  retriever: function(next) {
    next(null, data);
  },
  trigger:function(next) {
    next();
  }
}
