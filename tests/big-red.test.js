'use strict';

var expect = require('expect.js');
var br = require('..');

describe('Big Red', function() {

    this.timeout(10000);

    beforeEach(function() {
      br.reset();
    });

    it("Won't allow an invalid reference configuration", function(done) {

       br.attach({
          name:'muppets'
       });

       br.load(['muppets'], function() {
          expect(br.get('muppets')).to.be(undefined);
          done();
       });

    });

    it("Can attach a reference configuration and immediately retrieve data", function(done) {

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
          poller:function(next) {
            next();
          }
        });

        br.load(['muppets'], function() {
          expect(br.get('muppets').array).to.eql(data);
          expect(br.get('muppets').map['1']).to.eql(data[0]);
          expect(br.get('muppets').map['2']).to.eql(data[1]);
          expect(br.get('muppets').map['3']).to.eql(data[2]);
          done();
        });

    });

     it("Can attach a reference configuration and immediately retrieve data that is a map and not an array", function(done) {

        var data = {
          '1': {id:'1', name:'Kermit', type:'frog'},
          '2': {id:'2', name:'Miss Piggy', type: 'pig'},
          '3': {id:'3', name:'Fozzie Bear', type: 'bear'}
        };

        br.attach({
          name:'muppets',
          retriever: function(next) {
            next(null, data);
          },
          poller:function(next) {
            next();
          }
        });

        br.load(['muppets'], function() {
          expect(br.get('muppets').map).to.eql(data);
          done();
        });

    });

    it("Refreshes data if the poller returns true", function(done) {

        var data1 = [
          {id:'1', name:'Kermit', type:'frog'}
        ];

        var data2 = [
          {id:'1', name:'Kermit The Frog', type:'frog'},
          {id:'2', name:'Miss Piggy', type: 'pig'},
          {id:'3', name:'Fozzie Bear', type: 'bear'}
        ];

        var alternate = 0;

        br.attach({
          name:'muppets',
          retriever: function(next) {
            alternate++;
            setTimeout(function() {
              next(null, alternate > 1 ? data2 : data1 );
            }, 50);
          },
          poller:function(next) {
            next(null, true);
          },
          interval: 100
        });

        br.load(['muppets'], function() {
          expect(br.get('muppets').array).to.eql(data1);
          setTimeout(function() {
            expect(br.get('muppets').array).to.eql(data2);
            done();
          }, 250)
        });

    });

    it("Can access data in the shared module cache once loaded", function(done) {

        var a = require('./fixtures/a');

        expect(a.get('sesame-street')).to.be(undefined);

        var data = [
          {id:'1', name:'Big Bird', type:'bird'},
          {id:'2', name:'Snuffleupagus', type: 'elephant'}
        ];

        br.attach({
          name:'sesame-street',
          retriever: function(next) {
            next(null, data);
          },
          poller:function(next) {
            next();
          }
        });

        br.load(['sesame-street'], function() {
          // Do nothing
        });

        setTimeout(function() {
          br.loaded(function() {
            expect(a.get('sesame-street').array).to.eql(data);
            done();
          });
        }, 200);

    });

    it("Can attach references later on and still call loaded", function(done) {

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
          poller:function(next) {
            next();
          }
        });

        br.load(['muppets'], function() {

          expect(br.get('muppets').array).to.eql(data);

          setTimeout(function() {

            br.attach({
              name:'more-muppets',
              retriever: function(next) {
                next(null, data);
              },
              poller:function(next) {
                next();
              },
              interval: 1000
            });

            br.load(['more-muppets'], function() {
              expect(br.get('muppets').array).to.eql(data);
              expect(br.get('more-muppets').array).to.eql(data);
              done();
            });

          }, 500);

        });

    });

    it("Will fail silently but set status error if the poller has an error", function(done) {

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
          poller:function(next) {
            next(new Error('Frankly, Miss Piggy, I don\'t give a hoot!'));
          }
        });

        br.load(['muppets'], function() {
          expect(br.get('muppets').err.message).to.be('Frankly, Miss Piggy, I don\'t give a hoot!');
          done();
        });

    });

    it("Will fail silently but set status error if the retriever has an error", function(done) {

        var data = [
          {id:'1', name:'Kermit', type:'frog'},
          {id:'2', name:'Miss Piggy', type: 'pig'},
          {id:'3', name:'Fozzie Bear', type: 'bear'}
        ];

        br.attach({
          name:'muppets',
          retriever: function(next) {
            next(new Error('Frankly, Miss Piggy, I don\'t give a hoot!'), data);
          },
          poller:function(next) {
            next(null, true);
          }
        });

        br.load(['muppets'], function() {
          expect(br.get('muppets').err.message).to.be('Frankly, Miss Piggy, I don\'t give a hoot!');
          done();
        });

    });

    it("Can load all references from modules in a given path", function(done) {

      br.attachPath(__dirname + '/fixtures/references');
      br.load(null, function() {
        expect(br.get('muppets').array[0].name).to.be('Kermit');
        expect(br.get('sesame-street').array[0].name).to.be('Big Bird');
        done();
      });

    });

    it("Can call helpers bound to the data managed by the reference", function(done) {

      br.attachPath(__dirname + '/fixtures/references');
      br.load([], function() {
        var ss = br.get('sesame-street');
        expect(ss.fn.first().name).to.be('Big Bird');
        done();
      });

    });

    it("Mapify works on definitions with a different id", function(done) {

      br.attachPath(__dirname + '/fixtures/references');
      br.load([], function() {
        var ss = br.get('sesame-street').map;
        expect(Object.keys(ss)).to.eql(['1','2']);
        done();
      });

    });


    it("Can see the status", function(done) {

      br.attachPath(__dirname + '/fixtures/references');
      br.load([], function() {
        var status = br.status();
        expect(status.length).to.be(3);
        expect(status[0].name).to.be('complex');
        expect(status[0].count).to.be(2);
        expect(status[1].name).to.be('muppets');
        expect(status[1].count).to.be(3);
        expect(status[2].name).to.be('sesame-street');
        expect(status[2].count).to.be(2);
        done();
      });

    });

    it("Can call load multiple times without pollers being re-created", function(done) {

        var data = {
          '1': {id:'1', name:'Kermit', type:'frog'},
          '2': {id:'2', name:'Miss Piggy', type: 'pig'},
          '3': {id:'3', name:'Fozzie Bear', type: 'bear'}
        };

        br.attach({
          name:'muppets',
          retriever: function(next) {
            next(null, data);
          },
          poller:function(next) {
            next();
          }
        });

        br.load(['muppets'], function() {
          var t1 = br.get('muppets').ticker;
          br.load(['muppets'], function() {
              var t2 = br.get('muppets').ticker;
              expect(t1).to.eql(t2);
              done();
          });
        });

    });

    it("Callback doesn't fire before reference is loaded when load is called multiple times", function(done) {

        var data = [
          {id:'1', name:'Kermit', type:'frog'},
          {id:'2', name:'Miss Piggy', type: 'pig'},
          {id:'3', name:'Fozzie Bear', type: 'bear'}
        ];

        br.attach({
          name:'muppets',
          retriever: function(next) {
            setTimeout(function () {
              next(null, data);
            }, 0);
          },
          poller:function(next) {
            next();
          }
        });

        var count = 0;

        function calledBack () {
          if (++count == 2) done();
        }

        br.load(['muppets'], function() {
          expect(br.get('muppets').array).to.eql(data);
          calledBack();
        });

        br.load(['muppets'], function() {
          expect(br.get('muppets').array).to.eql(data);
          calledBack();
        });
    });

});
