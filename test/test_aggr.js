const expect = require ("chai").expect;
const aggr = require('../src/aggr');
const expr = require('../src/expr');

const CountStar = aggr.CountStar;
const Count = aggr.Count;
describe('Aggr', function() {
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
  describe('Count', function() {
    describe('constructor', function() {
      it('should store a zero', function() {
          const e = new Count();
          expect(e.count).to.equal(0);
      });
    });
    describe('update', function() {
      it('should change to one for a non-null value', function() {
          const e = new Count();
          e.update(1);
          expect(e.count).to.equal(1);
      });
      it('should stay zero for a null value', function() {
          const e = new Count();
          e.update(null);
          expect(e.count).to.equal(0);
      });
      it('should stay the same for a null value', function() {
          const e = new Count();
          e.update(1);
          expect(e.count).to.equal(1);
          e.update(null);
          expect(e.count).to.equal(1);
      });
    });
    describe('finalize', function() {
      it('should be zero for no values', function() {
          const e = new Count();
          expect(e.finalize()).to.equal(0);
      });
      it('should be zero for no non-null values', function() {
          const e = new Count();
          e.update(null);
          expect(e.finalize()).to.equal(0);
      });
      it('should stay the same for a null value', function() {
          const e = new Count();
          e.update(1);
          e.update(null);
          expect(e.finalize()).to.equal(1);
      });
    });
  });
});
