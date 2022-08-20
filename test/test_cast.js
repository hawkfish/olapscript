"use strict";

const expect = require ("chai").expect;
const expr = require('../src/expr');
const Expr = expr.Expr;

describe('Cast functions', function() {
	describe('cast', function() {
		const f = Expr.cast;

		it('should cast to Boolean', function() {
			const target = Boolean;
			expect(f(null, target), 'null').to.be.null;

			expect(f(false, target), 'Boolean').to.be.false;
			expect(f(true, target), 'Boolean').to.be.true;

			expect(f(0, target), 'number').to.be.false;
			expect(f(1, target), 'number').to.be.true;

			expect(f("", target), 'string').to.be.false;
			expect(f("abc", target), 'string').to.be.true;

			expect(f([], target), 'Array').to.be.true;
			expect(f([""], target), 'Array').to.be.true;
			expect(f(["abc"], target), 'Array').to.be.true;
			expect(f(["abc", "def"], target), 'Array').to.be.true;
			expect(f([["abc", "def"], "ghi"], target), 'Array').to.be.true;
		});

		it('should cast to Number', function() {
			const target = Number;
			expect(f(null, target)).to.be.null;

			expect(f(false, target), 'Boolean').to.equal(0);
			expect(f(true, target), 'Boolean').to.equal(1);

			expect(f(0, target), 'number').to.equal(0);
			expect(f(1, target), 'number').to.equal(1);

			expect(f("", target), 'string').to.equal(0);
			expect(f("abc", target), 'string').to.be.NaN;

			expect(f([], target), 'Array').to.equal(0);
			expect(f([""], target), 'Array').to.equal(0);
			expect(f(["abc"], target), 'Array').to.be.NaN;
			expect(f(["abc", "def"], target), 'Array').to.be.NaN;
			expect(f([["abc", "def"], "ghi"], target), 'Array').to.be.NaN;
		});

		it('should cast to String', function() {
			const target = String;
			expect(f(null, target)).to.be.null;

			expect(f(0, target), 'number').to.equal("0");
			expect(f(1, target), 'number').to.equal("1");

			expect(f("", target), 'string').to.equal("");
			expect(f("abc", target), 'string').to.equal("abc");

			expect(f([], target), 'Array').to.equal("");
			expect(f([""], target), 'Array').to.equal("");
			expect(f(["abc"], target), 'Array').to.equal("abc");
			expect(f(["abc", "def"], target), 'Array').to.equal("abc,def");
			expect(f([["abc", "def"], "ghi"], target), 'Array').to.equal("abc,def,ghi");
		});

		it('should cast to Date', function() {
			const target = Date;
			expect(f(null, target)).to.be.null;

			const epoch = new Date(0)
			const recent = new Date(Date.UTC(2022, 7, 20, 15, 16, 38, 98));
			expect(f(0, target), 'number').to.deep.equal(epoch);
			expect(f(1661008598098, target), 'number').to.deep.equal(recent);

			expect(f("", target), 'string').to.throw;
			expect(f("abc", target), 'string').to.throw;
			expect(f("1970-01-01", target), 'string').to.deep.equal(epoch);
			expect(f("2022-08-20T15:16:38.098Z", target), 'string').to.deep.equal(recent);

			expect(f([""], target), 'Array').to.throw;
			expect(f(["abc"], target), 'Array').to.to.throw
			expect(f(["abc", "def"], target), 'Array').to.to.throw
			expect(f([["abc", "def"], "ghi"], target), 'Array').to.to.throw
			expect(f(["1970-01-01"], target), 'Array').to.deep.equal(epoch);
			expect(f(["2022-08-20T15:16:38.098Z"], target), 'Array').to.deep.equal(recent);
		});

		it('should cast to Array', function() {
			const target = Array;
			expect(f(null, target)).to.be.null;

			expect(f(0, target), 'number').to.deep.equal([0]);
			expect(f(1, target), 'number').to.deep.equal([1]);

			expect(f("", target), 'string').to.deep.equal([""]);
			expect(f("abc", target), 'string').to.deep.equal(["abc"]);

			expect(f([], target), 'Array').to.deep.equal([]);
			expect(f([""], target), 'Array').to.deep.equal([""]);
			expect(f(["abc"], target), 'Array').to.deep.equal(["abc"]);
			expect(f(["abc", "def"], target), 'Array').to.deep.equal(["abc", "def"]);
			expect(f([["abc", "def"], "ghi"], target), 'Array').to.deep.equal([["abc", "def"], "ghi"]);
		});
	});
});
