const expect = require ("chai").expect;
const aggr = require('../src/aggr');
const expr = require('../src/expr');

const CountStar = aggr.CountStar;
  describe('CountStar', function() {
    describe('constructor', function() {
      it('should store a zero', function() {
          const e = new CountStar();
          expect(e.count).to.equal(0);
      });
    });
    describe('update', function() {
      it('should add one', function() {
          const e = new CountStar();
          expect(e.count).to.equal(0);
          e.update();
          expect(e.count).to.equal(1);
      });
    });
    describe('finalize', function() {
      it('should add one', function() {
          const e = new CountStar();
          expect(e.count).to.equal(0);
          e.update();
          expect(e.finalize()).to.equal(1);
      });
    });
  });
