const expect = require ("chai").expect;
const aggr = require('../src/aggr');
const expr = require('../src/expr');

const CountStar = aggr.CountStar;
const Count = aggr.Count;
const Sum = aggr.Sum;
const Avg = aggr.Avg;

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
  describe('Sum', function() {
    describe('constructor', function() {
      it('should store a null and a zero', function() {
          const e = new Sum();
          expect(e.sum).to.be.null;
      });
    });
    describe('update', function() {
      it('should ignore a null value', function() {
          const e = new Sum();
          e.update(null);
          expect(e.sum).to.be.null;
      });
      it('should add the first value', function() {
          const e = new Sum();
          e.update(5);
          expect(e.sum).to.equal(5);
      });
      it('should ignore subsequent nulls', function() {
          const e = new Sum();
          e.update(5);
          e.update(null);
          expect(e.sum).to.equal(5);
      });
      it('should add multiple values', function() {
          const e = new Sum();
          Array(10).fill(null).forEach((v, i) => e.update(i));
          expect(e.sum).to.equal(45);
      });
    });
    describe('finalize', function() {
      it('should ignore a null value', function() {
          const e = new Sum();
          e.update(null);
          expect(e.finalize()).to.be.null;
      });
      it('should add the first value', function() {
          const e = new Sum();
          e.update(5);
          expect(e.finalize()).to.equal(5);
      });
      it('should ignore subsequent nulls', function() {
          const e = new Sum();
          e.update(5);
          e.update(null);
          expect(e.finalize()).to.equal(5);
      });
      it('should add multiple values', function() {
          const e = new Sum();
          Array(10).fill(null).forEach((v, i) => e.update(i));
          expect(e.finalize()).to.equal(45);
      });
    });
  });
  describe('Avg', function() {
    describe('constructor', function() {
      it('should store a null and a zero', function() {
          const e = new Avg();
          expect(e.sum).to.be.null;
          expect(e.count).to.equal(0);
      });
    });
    describe('update', function() {
      it('should ignore a null value', function() {
          const e = new Avg();
          e.update(null);
          expect(e.sum).to.be.null;
          expect(e.count).to.equal(0);
      });
      it('should add the first value', function() {
          const e = new Avg();
          e.update(5);
          expect(e.sum).to.equal(5);
          expect(e.count).to.equal(1);
      });
      it('should ignore subsequent nulls', function() {
          const e = new Avg();
          e.update(5);
          e.update(null);
          expect(e.sum).to.equal(5);
          expect(e.count).to.equal(1);
      });
      it('should accumulate multiple values', function() {
          const e = new Avg();
          Array(10).fill(null).forEach((v, i) => e.update(i));
          expect(e.sum).to.equal(45);
          expect(e.count).to.equal(10);
      });
    });
    describe('finalize', function() {
      it('should ignore a null value', function() {
          const e = new Avg();
          e.update(null);
          expect(e.finalize()).to.be.null;
      });
      it('should add the first value', function() {
          const e = new Avg();
          e.update(5);
          expect(e.finalize()).to.equal(5);
      });
      it('should ignore subsequent nulls', function() {
          const e = new Avg();
          e.update(5);
          e.update(null);
          expect(e.finalize()).to.equal(5);
      });
      it('should average multiple values', function() {
          const e = new Avg();
          Array(10).fill(null).forEach((v, i) => e.update(i));
          expect(e.finalize()).to.equal(4.5);
      });
    });
  });
});
