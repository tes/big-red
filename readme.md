# Big Red

This module provides a sane interface between definitions of master data that may reside in a database or other store, and an in memory cache of this data that needs to be periodically updated (e.g. if the underlying data changes).

The idea is that these data sets are typically small and slow moving, but you don't want to put the data in code as it will force a re-deploy of all services using them.  You also don't really want to hit the database on every single request given it probably only changes once a week or once a month, and you are probably getting millions of requests per day.

## Explicit Definitions

You can explicitly attach a reference data handler (the example shows data in memory - clearly in the real world you would go off to a data store or a web service to get this data):


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

### Concepts

A reference data handler must consist of the following:

```
{
  name:'muppets',
  retriever: function(next) {
    next(null, data);
  },
  trigger:function(next) {
    next();
  },
  fn: {
    first: function() {
      var self = this;
      return self[0];
    }
  }
}
```

|Field|Description|
------|------------
name|This is the name you can use to later retrieve the data loaded by it.
retriever|This is the function that will retrieve the data from the remote data source, it needs to respond with next(err, data) - where data is the data that will be cached in memory.
trigger|This is the function that will be executed to determine if the cache should be refreshed, it needs to respond with next(err, true|false) where the second parameter is true if the data should be refreshed.
fn|A list of helper functions that will be bound to the data and exposed on the resultant cache object under the fn map.

### Data in first tick

As the data is loaded asynchronously, you need to ensure that you do not attempt to do anything with the data until you are sure if it is loaded, and if you are unsure (e.g. your code isn't in the context of a request), then wrap it with:

```
br.loaded(function() {
  // Your code
});
```

This is effectively 'dom ready' for reference data.

If you get the data in the context of a request, and hook the startup of your application to the 'loaded' function of Big Red, then you can just interact with BR and the reference data without relying on 'loaded' throughout your code.

### Interacting with Cached Data and Functions

```
var br = require('br');
br.loaded(function() {
  var muppets = br.get('muppets').data;
  var firstMuppet = muppets.fn.first();
});
```

## Definition Folder

You can also store each of the definitions as a module in a folder, and load all of the definitions in a single action.

In folder ./definitions, create a file called: muppets.js (have as many files as you like):

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
