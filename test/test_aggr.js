const expect = require ("chai").expect;
const aggr = require('../src/aggr');
const expr = require('../src/expr');

const Aggr = aggr.Aggr;

describe('Aggr', function() {
  describe('CountStar', function() {
		const CountStar = Aggr.countstar;
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
  	const Count = Aggr.count;
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
        const e = new Count();
        const state = e.initialize();
        expect(state.count).to.be.equal(0);
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
  	const Sum = Aggr.sum;
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
  	const Avg = Aggr.avg;
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

  describe('Min', function() {
		const Min = Aggr.min;
    describe('constructor', function() {
      it('should store the arguments and options', function() {
				const arg = "arg";
				const options = {option: 1};
				const e = new Min(arg, options);
				expect(e.args).to.deep.equal([arg]);
				expect(e.options).deep.equal(options);
      });
    });
    describe('initialize', function() {
      it('should create an empty state', function() {
				const e = new Min();
				const state = e.initialize();
				expect(state.value).to.be.null;
      });
    });
    describe('update', function() {
      it('should ignore a null value', function() {
        const e = new Min();
        const state = e.initialize();
        e.update(state, null);
        expect(state.value).to.be.null;
      });
      it('should keep the first value', function() {
        const e = new Min();
        const state = e.initialize();
        e.update(state, 5);
        expect(state.value).to.equal(5);
      });
      it('should ignore subsequent nulls', function() {
        const e = new Min();
        const state = e.initialize();
        e.update(state, 5);
        e.update(state, null);
        expect(state.value).to.equal(5);
      });
      it('should keep new minima', function() {
        const e = new Min();
        const state = e.initialize();
        e.update(state, 5);
        e.update(state, 3);
        expect(state.value).to.equal(3);
      });
      it('should ignore increasing values', function() {
        const e = new Min();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, i));
        expect(state.value).to.equal(0);
      });
      it('should keep decreasing values', function() {
        const e = new Min();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, 9 - i));
        expect(state.value).to.equal(0);
      });
      it('should work for strings', function() {
        const e = new Min();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, String(9 - i)));
        expect(state.value).to.equal("0");
      });
      it('should work for arrays', function() {
        const e = new Min();
        const state = e.initialize();
        e.update(state, [5, 6, 7]);
        e.update(state, [2, 3, 4]);
        expect(state.value).to.deep.equal([2, 3, 4]);
      });
    });
    describe('finalize', function() {
      it('should ignore a null value', function() {
        const e = new Min();
        const state = e.initialize();
        e.update(state, null);
        expect(e.finalize(state)).to.be.null;
      });
      it('should keep the first value', function() {
        const e = new Min();
        const state = e.initialize();
        e.update(state, 5);
        expect(e.finalize(state)).to.equal(5);
      });
      it('should ignore subsequent nulls', function() {
        const e = new Min();
        const state = e.initialize();
        e.update(state, 5);
        e.update(state, null);
        expect(e.finalize(state)).to.equal(5);
      });
      it('should keep new minima', function() {
        const e = new Min();
        const state = e.initialize();
        e.update(state, 5);
        e.update(state, 3);
        expect(e.finalize(state)).to.equal(3);
      });
      it('should ignore increasing values', function() {
        const e = new Min();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, i));
        expect(e.finalize(state)).to.equal(0);
      });
      it('should keep decreasing values', function() {
        const e = new Min();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, 9 - i));
        expect(e.finalize(state)).to.equal(0);
      });
      it('should work for strings', function() {
        const e = new Min();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, String(9 - i)));
        expect(e.finalize(state)).to.equal("0");
      });
      it('should work for arrays', function() {
        const e = new Min();
        const state = e.initialize();
        e.update(state, [5, 6, 7]);
        e.update(state, [2, 3, 4]);
        expect(e.finalize(state)).to.deep.equal([2, 3, 4]);
      });
    });
 	});

  describe('Max', function() {
    const Max = Aggr.max;
    describe('constructor', function() {
      it('should store the arguments and options', function() {
        const arg = "arg";
        const options = {option: 1};
        const e = new Max(arg, options);
        expect(e.args).to.deep.equal([arg]);
        expect(e.options).deep.equal(options);
      });
    });
    describe('initialize', function() {
      it('should create an empty state', function() {
        const e = new Max();
        const state = e.initialize();
        expect(state.value).to.be.null;
      });
    });
    describe('update', function() {
      it('should ignore a null value', function() {
        const e = new Max();
        const state = e.initialize();
        e.update(state, null);
        expect(state.value).to.be.null;
      });
      it('should keep the first value', function() {
        const e = new Max();
        const state = e.initialize();
        e.update(state, 5);
        expect(state.value).to.equal(5);
      });
      it('should ignore subsequent nulls', function() {
        const e = new Max();
        const state = e.initialize();
        e.update(state, 5);
        e.update(state, null);
        expect(state.value).to.equal(5);
      });
      it('should keep new minima', function() {
        const e = new Max();
        const state = e.initialize();
        e.update(state, 5);
        e.update(state, 3);
        expect(state.value).to.equal(5);
      });
      it('should ignore increasing values', function() {
        const e = new Max();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, i));
        expect(state.value).to.equal(9);
      });
      it('should keep decreasing values', function() {
        const e = new Max();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, 9 - i));
        expect(state.value).to.equal(9);
      });
      it('should work for strings', function() {
        const e = new Max();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, String(9 - i)));
        expect(state.value).to.equal("9");
      });
      it('should work for arrays', function() {
        const e = new Max();
        const state = e.initialize();
        e.update(state, [5, 6, 7]);
        e.update(state, [2, 3, 4]);
        expect(state.value).to.deep.equal([5, 6, 7]);
      });
    });
    describe('finalize', function() {
      it('should ignore a null value', function() {
        const e = new Max();
        const state = e.initialize();
        e.update(state, null);
        expect(e.finalize(state)).to.be.null;
      });
      it('should keep the first value', function() {
        const e = new Max();
        const state = e.initialize();
        e.update(state, 5);
        expect(e.finalize(state)).to.equal(5);
      });
      it('should ignore subsequent nulls', function() {
        const e = new Max();
        const state = e.initialize();
        e.update(state, 5);
        e.update(state, null);
        expect(e.finalize(state)).to.equal(5);
      });
      it('should keep new minima', function() {
        const e = new Max();
        const state = e.initialize();
        e.update(state, 5);
        e.update(state, 3);
        expect(e.finalize(state)).to.equal(5);
      });
      it('should keep increasing values', function() {
        const e = new Max();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, i));
        expect(e.finalize(state)).to.equal(9);
      });
      it('should ignore decreasing values', function() {
        const e = new Max();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, 9 - i));
        expect(e.finalize(state)).to.equal(9);
      });
      it('should work for strings', function() {
        const e = new Max();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, String(i)));
        expect(e.finalize(state)).to.equal("9");
      });
      it('should work for arrays', function() {
        const e = new Max();
        const state = e.initialize();
        e.update(state, [5, 6, 7]);
        e.update(state, [2, 3, 4]);
        expect(e.finalize(state)).to.deep.equal([5, 6, 7]);
      });
    });
  });

  describe('First', function() {
    const First = Aggr.first;
    describe('constructor', function() {
      it('should store the arguments and options', function() {
        const arg = "arg";
        const options = {option: 1};
        const e = new First(arg, options);
        expect(e.args).to.deep.equal([arg]);
        expect(e.options).deep.equal(options);
      });
    });
    describe('initialize', function() {
      it('should create an empty state', function() {
        const e = new First();
        const state = e.initialize();
        expect(state.value).to.be.null;
      });
    });
    describe('update', function() {
      it('should ignore a null value', function() {
        const e = new First();
        const state = e.initialize();
        e.update(state, null);
        expect(state.value).to.be.null;
      });
      it('should keep the first value', function() {
        const e = new First();
        const state = e.initialize();
        e.update(state, 5);
        expect(state.value).to.equal(5);
      });
      it('should ignore subsequent nulls', function() {
        const e = new First();
        const state = e.initialize();
        e.update(state, 5);
        e.update(state, null);
        expect(state.value).to.equal(5);
      });
      it('should ignore new minima', function() {
        const e = new First();
        const state = e.initialize();
        e.update(state, 4);
        e.update(state, 5);
        e.update(state, 3);
        expect(state.value).to.equal(4);
      });
      it('should ignore increasing values', function() {
        const e = new First();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, i));
        expect(state.value).to.equal(0);
      });
      it('should ignore decreasing values', function() {
        const e = new First();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, 9 - i));
        expect(state.value).to.equal(9);
      });
      it('should work for strings', function() {
        const e = new First();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, String(9 - i)));
        expect(state.value).to.equal("9");
      });
      it('should work for arrays', function() {
        const e = new First();
        const state = e.initialize();
        e.update(state, [3, 4, 5]);
        e.update(state, [5, 6, 7]);
        e.update(state, [2, 3, 4]);
        expect(state.value).to.deep.equal([3, 4, 5]);
      });
    });
    describe('finalize', function() {
      it('should ignore a null value', function() {
        const e = new First();
        const state = e.initialize();
        e.update(state, null);
        expect(e.finalize(state)).to.be.null;
      });
      it('should keep the first value', function() {
        const e = new First();
        const state = e.initialize();
        e.update(state, 5);
        expect(e.finalize(state)).to.equal(5);
      });
      it('should ignore subsequent nulls', function() {
        const e = new First();
        const state = e.initialize();
        e.update(state, 5);
        e.update(state, null);
        expect(e.finalize(state)).to.equal(5);
      });
      it('should keep new minima', function() {
        const e = new First();
        const state = e.initialize();
        e.update(state, 5);
        e.update(state, 3);
        expect(e.finalize(state)).to.equal(5);
      });
      it('should ignore increasing values', function() {
        const e = new First();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, i));
        expect(e.finalize(state)).to.equal(0);
      });
      it('should ignore decreasing values', function() {
        const e = new First();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, 9 - i));
        expect(e.finalize(state)).to.equal(9);
      });
      it('should work for strings', function() {
        const e = new First();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, String(i)));
        expect(e.finalize(state)).to.equal("0");
      });
      it('should work for arrays', function() {
        const e = new First();
        const state = e.initialize();
        e.update(state, [3, 4, 5]);
        e.update(state, [5, 6, 7]);
        e.update(state, [2, 3, 4]);
        expect(e.finalize(state)).to.deep.equal([3, 4, 5]);
      });
    });
  });

  describe('Last', function() {
    const Last = Aggr.last;
    describe('constructor', function() {
      it('should store the arguments and options', function() {
        const arg = "arg";
        const options = {option: 1};
        const e = new Last(arg, options);
        expect(e.args).to.deep.equal([arg]);
        expect(e.options).deep.equal(options);
      });
    });
    describe('initialize', function() {
      it('should create an empty state', function() {
        const e = new Last();
        const state = e.initialize();
        expect(state.value).to.be.null;
      });
    });
    describe('update', function() {
      it('should ignore a null value', function() {
        const e = new Last();
        const state = e.initialize();
        e.update(state, null);
        expect(state.value).to.be.null;
      });
      it('should keep the first value', function() {
        const e = new Last();
        const state = e.initialize();
        e.update(state, 5);
        expect(state.value).to.equal(5);
      });
      it('should ignore subsequent nulls', function() {
        const e = new Last();
        const state = e.initialize();
        e.update(state, 5);
        e.update(state, null);
        expect(state.value).to.equal(5);
      });
      it('should keep new values', function() {
        const e = new Last();
        const state = e.initialize();
        e.update(state, 5);
        e.update(state, 3);
        e.update(state, 4);
        expect(state.value).to.equal(4);
      });
      it('should ignore increasing values', function() {
        const e = new Last();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, i));
        expect(state.value).to.equal(9);
      });
      it('should keep decreasing values', function() {
        const e = new Last();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, 9 - i));
        expect(state.value).to.equal(0);
      });
      it('should work for strings', function() {
        const e = new Last();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, String(9 - i)));
        expect(state.value).to.equal("0");
      });
      it('should work for arrays', function() {
        const e = new Last();
        const state = e.initialize();
        e.update(state, [5, 6, 7]);
        e.update(state, [2, 3, 4]);
        e.update(state, [3, 4, 5]);
        expect(state.value).to.deep.equal([3, 4, 5]);
      });
    });
    describe('finalize', function() {
      it('should ignore a null value', function() {
        const e = new Last();
        const state = e.initialize();
        e.update(state, null);
        expect(e.finalize(state)).to.be.null;
      });
      it('should keep the first value', function() {
        const e = new Last();
        const state = e.initialize();
        e.update(state, 5);
        expect(e.finalize(state)).to.equal(5);
      });
      it('should ignore subsequent nulls', function() {
        const e = new Last();
        const state = e.initialize();
        e.update(state, 5);
        e.update(state, null);
        expect(e.finalize(state)).to.equal(5);
      });
      it('should keep new values', function() {
        const e = new Last();
        const state = e.initialize();
        e.update(state, 5);
        e.update(state, 3);
        e.update(state, 4);
        expect(e.finalize(state)).to.equal(4);
      });
      it('should keep increasing values', function() {
        const e = new Last();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, i));
        expect(e.finalize(state)).to.equal(9);
      });
      it('should keep decreasing values', function() {
        const e = new Last();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, 9 - i));
        expect(e.finalize(state)).to.equal(0);
      });
      it('should work for strings', function() {
        const e = new Last();
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, String(i)));
        expect(e.finalize(state)).to.equal("9");
      });
      it('should work for arrays', function() {
        const e = new Last();
        const state = e.initialize();
        e.update(state, [5, 6, 7]);
        e.update(state, [2, 3, 4]);
        e.update(state, [3, 4, 5]);
        expect(e.finalize(state)).to.deep.equal([3, 4, 5]);
      });
    });
  });

  describe('ArrayAgg', function() {
    const ArrayAgg = Aggr.arrayagg;
    describe('constructor', function() {
      it('should store the arguments and options', function() {
        const arg = "arg";
        const options = {option: 1};
        const e = new ArrayAgg(arg, options);
        expect(e.args).to.deep.equal([arg]);
        expect(e.options).deep.equal(options);
      });
    });
    describe('initialize', function() {
      it('should create an empty state', function() {
        const e = new ArrayAgg([]);
        const state = e.initialize();
        expect(state.value).to.be.null;
      });
    });
    describe('update', function() {
      it('should ignore a null value', function() {
        const e = new ArrayAgg([]);
        const state = e.initialize();
        e.update(state, null);
        expect(state.value).deep.equal([ null ]);
      });
      it('should keep the first value', function() {
        const e = new ArrayAgg([]);
        const state = e.initialize();
        e.update(state, "a");
        expect(state.value).deep.equal([ 'a' ]);
      });
      it('should ignore subsequent nulls', function() {
        const e = new ArrayAgg([]);
        const state = e.initialize();
        e.update(state, "a");
        e.update(state, null);
        expect(state.value).deep.equal([ 'a', null ]);
      });
      it('should concatenate new values', function() {
        const e = new ArrayAgg([]);
        const state = e.initialize();
        e.update(state, "a");
        e.update(state, null);
        e.update(state, "b");
        expect(state.value).deep.equal([ 'a', null, 'b' ]);
      });
      it('should concatenate increasing values', function() {
        const e = new ArrayAgg([]);
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, String(i)));
        expect(state.value).to.deep.equal([ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' ]);
      });
      it('should concatenate decreasing values', function() {
        const e = new ArrayAgg([]);
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, String(9 - i)));
        expect(state.value).to.deep.equal([ '9', '8', '7', '6', '5', '4', '3', '2', '1', '0' ]);
      });
    });
    describe('finalize', function() {
      it('should ignore a null value', function() {
        const e = new ArrayAgg([]);
        const state = e.initialize();
        e.update(state, null);
        expect(e.finalize(state)).to.deep.equal([null]);
      });
      it('should keep the first value', function() {
        const e = new ArrayAgg([]);
        const state = e.initialize();
        e.update(state, 5);
        expect(e.finalize(state)).to.deep.equal([5]);
      });
      it('should keep subsequent nulls', function() {
        const e = new ArrayAgg([]);
        const state = e.initialize();
        e.update(state, 5);
        e.update(state, null);
        expect(e.finalize(state)).to.deep.equal([5, null]);
      });
      it('should concatenate new values', function() {
        const e = new ArrayAgg([]);
        const state = e.initialize();
        e.update(state, "a");
        e.update(state, null);
        e.update(state, "b");
        expect(state.value).to.deep.equal([ 'a', null, 'b' ]);
      });
      it('should concatenate increasing values', function() {
        const e = new ArrayAgg([]);
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, String(i)));
        expect(e.finalize(state)).to.deep.equal([ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' ]);
      });
      it('should concatenate decreasing values', function() {
        const e = new ArrayAgg([]);
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, String(9 - i)));
        expect(e.finalize(state)).to.deep.equal([ '9', '8', '7', '6', '5', '4', '3', '2', '1', '0' ]);
      });
    });
  });

  describe('StringAgg', function() {
    const StringAgg = Aggr.stringagg;
    describe('constructor', function() {
      it('should store the arguments and options', function() {
        const args = ["arg", new ConstExpr("sep")];
        const options = {option: 1};
        const e = new StringAgg(args, options);
        expect(e.args).to.deep.equal([args[0]]);
        expect(e.options).deep.equal(options);
        expect(e.sep).to.equal("sep");
      });
    });
    describe('initialize', function() {
      it('should create an empty state', function() {
        const e = new StringAgg([]);
        const state = e.initialize();
        expect(state.value).to.be.null;
      });
    });
    describe('update', function() {
      it('should ignore a null value', function() {
        const e = new StringAgg([]);
        const state = e.initialize();
        e.update(state, null);
        expect(state.value).to.be.null;
      });
      it('should keep the first value', function() {
        const e = new StringAgg([]);
        const state = e.initialize();
        e.update(state, "a");
        expect(state.value).to.equal("a");
      });
      it('should ignore subsequent nulls', function() {
        const e = new StringAgg([]);
        const state = e.initialize();
        e.update(state, "a");
        e.update(state, null);
        expect(state.value).to.equal("a");
      });
      it('should concatenate new values', function() {
        const e = new StringAgg([]);
        const state = e.initialize();
        e.update(state, "a");
        e.update(state, "c");
        e.update(state, "b");
        expect(state.value).to.equal("a,c,b");
      });
      it('should concatenate increasing values', function() {
        const e = new StringAgg([]);
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, String(i)));
        expect(state.value).to.equal("0,1,2,3,4,5,6,7,8,9");
      });
      it('should concatenate decreasing values', function() {
        const e = new StringAgg([]);
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, String(9 - i)));
        expect(state.value).to.equal('9,8,7,6,5,4,3,2,1,0');
      });
    });
    describe('finalize', function() {
      it('should ignore a null value', function() {
        const e = new StringAgg([]);
        const state = e.initialize();
        e.update(state, null);
        expect(e.finalize(state)).to.be.null;
      });
      it('should keep the first value', function() {
        const e = new StringAgg([]);
        const state = e.initialize();
        e.update(state, 5);
        expect(e.finalize(state)).to.equal(5);
      });
      it('should ignore subsequent nulls', function() {
        const e = new StringAgg([]);
        const state = e.initialize();
        e.update(state, 5);
        e.update(state, null);
        expect(e.finalize(state)).to.equal(5);
      });
      it('should concatenate new values', function() {
        const e = new StringAgg([]);
        const state = e.initialize();
        e.update(state, "a");
        e.update(state, "c");
        e.update(state, "b");
        expect(state.value).to.equal("a,c,b");
      });
      it('should concatenate increasing values', function() {
        const e = new StringAgg([]);
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, String(i)));
        expect(e.finalize(state)).to.equal("0,1,2,3,4,5,6,7,8,9");
      });
      it('should concatenate decreasing values', function() {
        const e = new StringAgg([]);
        const state = e.initialize();
        Array(10).fill(null).forEach((v, i) => e.update(state, String(9 - i)));
        expect(e.finalize(state)).to.equal('9,8,7,6,5,4,3,2,1,0');
      });
    });
  });
});
