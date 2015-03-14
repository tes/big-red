'use strict';

var expect = require('expect.js');
var br = require('..');

describe('Big Red', function() {

    this.timeout(10000);

    beforeEach(function() {
      br.reset();
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
          trigger:function(next) {
            next();
          }
        });

        br.loaded(function() {
          expect(br.get('muppets')).to.be(data);
          done();
        });

    });

    it("Refreshes data if the trigger returns true", function(done) {

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
            next(null, alternate > 1 ? data2 : data1 );
          },
          trigger:function(next) {
            next(null, true);
          },
          interval: 200
        });

        br.loaded(function() {
          expect(br.get('muppets')).to.be(data1);
          setTimeout(function() {
            expect(br.get('muppets')).to.be(data2);
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
          trigger:function(next) {
            next();
          }
        });

        br.loaded(function() {
          expect(a.get('sesame-street')).to.be(data);
          done();
        });

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
          trigger:function(next) {
            next();
          }
        });

        br.loaded(function() {

          expect(br.get('muppets')).to.be(data);

          setTimeout(function() {

            br.attach({
              name:'more-muppets',
              retriever: function(next) {
                next(null, data);
              },
              trigger:function(next) {
                next();
              },
              interval: 1000
            });

            br.loaded(function() {
              expect(br.get('muppets')).to.be(data);
              expect(br.get('more-muppets')).to.be(data);
              done();
            });

          }, 500);

        });

    });

});
