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
      it('should store the arguments and options', function() {
      		const options = {option: 1};
          const e = new CountStar(options);
          expect(e.args).to.deep.equal([]);
          expect(e.options).deep.equal(options);
      });
    });
    describe('initialize', function() {
      it('should create an empty state', function() {
          const e = new CountStar();
          const state = e.initialize();
          expect(state.count).to.equal(0);
      });
    });
    describe('update', function() {
      it('should add one', function() {
          const e = new CountStar();
          const state = e.initialize();
          e.update(state);
          expect(state.count).to.equal(1);
      });
    });
    describe('finalize', function() {
      it('should add one', function() {
          const e = new CountStar();
          const state = e.initialize();
          e.update(state);
          expect(e.finalize(state)).to.equal(1);
      });
    });
  });
  describe('Count', function() {
    describe('constructor', function() {
      it('should store the arguments and options', function() {
      		const arg = "arg";
      		const options = {option: 1};
          const e = new Count(arg, options);
          expect(e.args).to.deep.equal([arg]);
          expect(e.options).deep.equal(options);
      });
    });
    describe('initialize', function() {
      it('should create an empty state', function() {
          const e = new Sum();
          const state = e.initialize();
          expect(state.sum).to.be.null;
      });
    });
    describe('update', function() {
      it('should change to one for a non-null value', function() {
          const e = new Count();
          const state = e.initialize();
          e.update(state, 1);
          expect(state.count).to.equal(1);
      });
      it('should stay zero for a null value', function() {
          const e = new Count();
          const state = e.initialize();
          e.update(state, null);
          expect(state.count).to.equal(0);
      });
      it('should stay the same for a null value', function() {
          const e = new Count();
          const state = e.initialize();
          e.update(state, 1);
          expect(state.count).to.equal(1);
          e.update(state, null);
          expect(state.count).to.equal(1);
      });
    });
    describe('finalize', function() {
      it('should be zero for no values', function() {
          const e = new Count();
          const state = e.initialize();
          expect(e.finalize(state)).to.equal(0);
      });
      it('should be zero for no non-null values', function() {
          const e = new Count();
          const state = e.initialize();
          e.update(state, null);
          expect(e.finalize(state)).to.equal(0);
      });
      it('should stay the same for a null value', function() {
          const e = new Count();
          const state = e.initialize();
          e.update(state, 1);
          e.update(state, null);
          expect(e.finalize(state)).to.equal(1);
      });
    });
  });
  describe('Sum', function() {
    describe('constructor', function() {
      it('should store the arguments and options', function() {
      		const arg = "arg";
      		const options = {option: 1};
          const e = new Sum(arg, options);
          expect(e.args).to.deep.equal([arg]);
          expect(e.options).deep.equal(options);
      });
    });
    describe('initialize', function() {
      it('should create an empty state', function() {
          const e = new Sum();
          const state = e.initialize();
          expect(state.sum).to.be.null;
      });
    });
    describe('update', function() {
      it('should ignore a null value', function() {
          const e = new Sum();
          const state = e.initialize();
          e.update(state, null);
          expect(state.sum).to.be.null;
      });
      it('should add the first value', function() {
          const e = new Sum();
          const state = e.initialize();
          e.update(state, 5);
          expect(state.sum).to.equal(5);
      });
      it('should ignore subsequent nulls', function() {
          const e = new Sum();
          const state = e.initialize();
          e.update(state, 5);
          e.update(state, null);
          expect(state.sum).to.equal(5);
      });
      it('should add multiple values', function() {
          const e = new Sum();
          const state = e.initialize();
          Array(10).fill(null).forEach((v, i) => e.update(state, i));
          expect(state.sum).to.equal(45);
      });
    });
    describe('finalize', function() {
      it('should ignore a null value', function() {
          const e = new Sum();
          const state = e.initialize();
          e.update(state, null);
          expect(e.finalize(state)).to.be.null;
      });
      it('should add the first value', function() {
          const e = new Sum();
          const state = e.initialize();
          e.update(state, 5);
          expect(e.finalize(state)).to.equal(5);
      });
      it('should ignore subsequent nulls', function() {
          const e = new Sum();
          const state = e.initialize();
          e.update(state, 5);
          e.update(state, null);
          expect(e.finalize(state)).to.equal(5);
      });
      it('should add multiple values', function() {
          const e = new Sum();
          const state = e.initialize();
          Array(10).fill(null).forEach((v, i) => e.update(state, i));
          expect(e.finalize(state)).to.equal(45);
      });
    });
  });
  describe('Avg', function() {
    describe('constructor', function() {
      it('should store the arguments and options', function() {
      		const arg = "arg";
      		const options = {option: 1};
          const e = new Avg(arg, options);
          expect(e.args).to.deep.equal([arg]);
          expect(e.options).deep.equal(options);
      });
    });
    describe('initialize', function() {
      it('should create an empty state', function() {
          const e = new Avg();
          const state = e.initialize();
          expect(state.sum).to.be.null;
          expect(state.count).to.equal(0);
      });
    });
    describe('update', function() {
      it('should ignore a null value', function() {
          const e = new Avg();
          const state = e.initialize();
          e.update(state, null);
          expect(state.sum).to.be.null;
          expect(state.count).to.equal(0);
      });
      it('should add the first value', function() {
          const e = new Avg();
          const state = e.initialize();
          e.update(state, 5);
          expect(state.sum).to.equal(5);
          expect(state.count).to.equal(1);
      });
      it('should ignore subsequent nulls', function() {
          const e = new Avg();
          const state = e.initialize();
          e.update(state, 5);
          e.update(state, null);
          expect(state.sum).to.equal(5);
          expect(state.count).to.equal(1);
      });
      it('should accumulate multiple values', function() {
          const e = new Avg();
          const state = e.initialize();
          Array(10).fill(null).forEach((v, i) => e.update(state, i));
          expect(state.sum).to.equal(45);
          expect(state.count).to.equal(10);
      });
    });
    describe('finalize', function() {
      it('should ignore a null value', function() {
          const e = new Avg();
          const state = e.initialize();
          e.update(state, null);
          expect(e.finalize(state)).to.be.null;
      });
      it('should add the first value', function() {
          const e = new Avg();
          const state = e.initialize();
          e.update(state, 5);
          expect(e.finalize(state)).to.equal(5);
      });
      it('should ignore subsequent nulls', function() {
          const e = new Avg();
          const state = e.initialize();
          e.update(state, 5);
          e.update(state, null);
          expect(e.finalize(state)).to.equal(5);
      });
      it('should average multiple values', function() {
          const e = new Avg();
          const state = e.initialize();
          Array(10).fill(null).forEach((v, i) => e.update(state, i));
          expect(e.finalize(state)).to.equal(4.5);
      });
    });
  });
});
