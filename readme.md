# Big Red

This module provides a sane interface between definitions of master data that may reside in a database or other store, and an in memory cache of this data that needs to be periodically updated (e.g. if the underlying data changes).

The idea is that these data sets are typically small and slow moving, but you don't want to put the data in code as it will force a re-deploy of all services using them.  You also don't really want to hit the database on every single request given it probably only changes once a week or once a month, and you are probably getting millions of requests per day.

## Explicit Definitions

```
var br = require('big-red');

var data = [
  {id:'1', name:'Kermit', type:'frog'},
  {id:'2', name:'Miss Piggy', type: 'pig'},
  {id:'3', name:'Fozzie Bear', type: 'bear'}
];

br.attach({
  name:'muppets',
  retriever: function(next) {
    next(null, data);
  },
  trigger:function(next) {
    next();
  }
});

br.loaded(function() {
  expect(br.get('muppets').data).to.be(data);
  done();
});
```

## Definition Folder

In folder /definitions/muppets.js (have as many files as you like):

```
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
```

Then point Big Red at your definition folder:

```
var br = require('big-red');
br.attachPath('./definitions');
br.loaded(function() {
  expect(br.get('muppets').data).to.be(data);
  done();
});
```
