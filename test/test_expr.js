const expect = require ("chai").expect;
const expr = require('../src/expr');
const Column = require('../src/column').Column;

describe('Expression nodes', function() {
	describe('Expr', function() {
		const Expr = expr.Expr;
    describe('Constructor', function() {
			it('should store the type', function() {
				const setup = 'Expression Type';
				const e = new Expr(setup);
				expect(e.type).to.equal(setup);
			});
    });
	});

	describe('ConstExpr', function() {
		const ConstExpr = expr.ConstExpr;
    const count = 5;
    const data = Array(count).fill(null);
    const namespace = {name: new Column(undefined, data)};
    const selection = namespace.name.data.map((v, rowid) => rowid);

    const expectConstructor = function(setup, datatype) {
			const e = new ConstExpr(setup);
			expect(e.type).to.equal('constant');
			expect(e.constant).to.equal(setup);
			expect(e.datatype).to.equal(datatype);
    };
    const expectAlias = function(setup, expected) {
			expect(new ConstExpr(setup).alias()).to.equal(expected);
    };
    const expectEvaluate = function(setup) {
			const e = new ConstExpr(setup);
			const col = e.evaluate(namespace, selection, count);
			expect(col.type).to.equal(e.datatype);
			expect(col.data).to.be.an('array').lengthOf(count);
			col.data.forEach(v => expect(v).to.equal(setup));
    };

    describe('Constructor', function() {
			it('should store a NULL constant', function() {
				const setup = null;
				const e = new ConstExpr(setup);
				expect(e.type).to.equal('constant');
				expect(e.constant).to.be.null;

				const col = e.evaluate(namespace, selection, count);
				expect(col.type).to.equal(e.datatype);
				expect(col.data).to.be.an('array').lengthOf(count);
				col.data.forEach(v => expect(v).to.be.null);
			});
			it('should store a string constant', function() {
				expectConstructor('String', 'string');
			});
			it('should store a numeric constant', function() {
				expectConstructor(3.15149, 'number');
			});
			it('should store an Array constant', function() {
				expectConstructor([0, 1, 2, 3], 'object');
			});
			it('should store an Object constant', function() {
				expectConstructor({key: "Value"}, 'object');
			});
    });
		describe('alias', function() {
			it('should return a string for nulls', function() {
				expectAlias(null, 'null');
			});
			it('should return a string for numbers', function() {
				expectAlias(3.25, '3.25');
			});
			it('should return a string for strings', function() {
				expectAlias('String', 'String');
			});
			it('should return a string for arrays', function() {
				expectAlias([0, 1, 2, 3], '0,1,2,3');
			});
			it('should return a string for objects', function() {
				expectAlias({key: "Value"}, '[object Object]');
			});
		});
		describe('evaluate', function() {
			it('should return a null column for nulls', function() {
				expectEvaluate(null, 'null');
			});
			it('should return a number column for numbers', function() {
				expectEvaluate(3.25);
			});
			it('should return a string column for strings', function() {
				expectEvaluate('String');
			});
			it('should return an Array column for arrays', function() {
				expectEvaluate([0, 1, 2, 3]);
			});
			it('should return an Object column for objects', function() {
				expectEvaluate({key: "Value"});
			});
		});
	});

	describe('RefExpr', function() {
		const RefExpr = expr.RefExpr;
    const count = 5;
    const namespace = {column: {type: undefined, data: Array(count)}};
    const selection = namespace.column.data.map((v, rowid) => rowid);

		describe('constructor', function() {
			it('should store a column name', function() {
				const setup = 'ColName';
				const e = new RefExpr(setup);
				expect(e.type).to.equal('reference');
				expect(e.reference).to.equal(setup);
			});
		});
		describe('alias', function() {
			it('should be the reference', function() {
				const setup = 'Referenced';
				const e = new RefExpr(setup);
				expect(e.alias()).to.equal(setup);
			});
			it('should be the SQL-quoted reference when it contains spaces', function() {
				const setup = 'Referenced Column';
				const e = new RefExpr(setup);
				expect(e.alias()).to.equal('"' + setup + '"');
			});
		});
		describe('evaluate', function() {
			it('should return the referenced column', function() {
				const e = new RefExpr('column');
				const actual = e.evaluate(namespace, selection);
				expect(actual).to.equal(namespace.column);
			});
			it('should throw for unknown columns', function() {
				const e = new RefExpr('fnord');
				expect(e.evaluate.bind(e, namespace, selection)).to.throw(ReferenceError);
			});
			it('should suggest possible misspellings', function() {
				const ns = {
					fjord: null,
					ford: null,
					bored: null,
					cord: null,
					name: null,
					address: null,
					email: null
				}
				const e = new RefExpr('fnord');
				expect(e.evaluate.bind(e, ns, selection)).to.throw("fjord");
			});
		});
	});

	describe('FuncExpr', function() {
		const FuncExpr = expr.FuncExpr;
		const count = 5;
		const namespace = {column: {type: undefined, data: Array(count).fill(null)}};
		const selection = namespace.column.data.map((v, rowid) => rowid);

		const nullary = function () {return 27;};
		const unary = function (x) {return x * 5;};
		const binary = (x, y) => x - y;

		const expectEvaluate = function(expr, expected) {
			const actual = expr.evaluate(namespace, selection, count);
			expect(actual.data).to.be.an('array').lengthOf(expected.length);
			expected.forEach((e, i) => expect(e).to.equal(actual.data[i]));
		};

		describe('constructor', function() {
			it('should store a nullary function', function() {
				const e = new FuncExpr(nullary, []);
				expect(e.func).to.equal(nullary);
				expect(e.args).to.be.an('array').lengthOf(0);
			});
			it('should store a unary function', function() {
				const e = new FuncExpr(unary, [new ConstExpr(1)]);
				expect(e.func).to.equal(unary);
				expect(e.args).to.be.an('array').lengthOf(1);
			});
			it('should store a binary function', function() {
				const e = new FuncExpr(binary, [new ConstExpr(7), new ConstExpr(4)]);
				expect(e.func).to.equal(binary);
				expect(e.args).to.be.an('array').lengthOf(2);
			});
		});
		describe('alias', function() {
			it('should alias a nullary function', function() {
				const e = new FuncExpr(nullary, []);
				expect(e.alias()).to.equal('nullary()');
			});
			it('should alias a unary function', function() {
				const e = new FuncExpr(unary, [new ConstExpr(1)]);
				expect(e.alias()).to.equal('unary(1)');
			});
			it('should alias a binary function', function() {
				const e = new FuncExpr(binary, [new ConstExpr(7), new ConstExpr(4)]);
				expect(e.alias()).to.equal('binary(7, 4)');
			});
		});
		describe('evaluate', function() {
			it('should evaluate a nullary function', function() {
				const e = new FuncExpr(nullary, []);
				expectEvaluate(e, Array(count).fill(nullary()));
			});
			it('should evaluate a unary function', function() {
				const e = new FuncExpr(unary, [new ConstExpr(1)]);
				expectEvaluate(e, Array(count).fill(unary(1)));
			});
			it('should evaluate a binary function', function() {
				const e = new FuncExpr(binary, [new ConstExpr(7), new ConstExpr(4)]);
				expectEvaluate(e, Array(count).fill(binary(7, 4)));
			});
		});
	});

	describe('CaseExpr', function() {
		const CaseExpr = expr.CaseExpr;
		const FuncExpr = expr.FuncExpr;
		const RefExpr = expr.RefExpr;
		describe('with no expression', function() {
			it('should compute single cases', function() {
				const length = 3;
				const namespace = {
					whens:  new Column(undefined, [true, false, null]),
					thens:  new Column(undefined, Array(length).fill("Pravda")),
					elses:  new Column(undefined, Array(length).fill("Izvestia"))
				};

				const setup = new CaseExpr([new RefExpr("whens"), new RefExpr("thens"), new RefExpr("elses")]);
				expect(setup.args).to.be.an('array').lengthOf(length);
				expect(setup.expr).to.be.undefined;
				expect(setup.alias()).to.equal('case when whens then thens else elses end');
				const selection = Array(length).fill(null).map((v, i) => i);
				const actual = setup.evaluate(namespace, selection, length);
				expect(actual.data).to.be.an('array').lengthOf(length);
				expect(actual.data).to.deep.equal(["Pravda", "Izvestia", "Izvestia"]);
			});
			it('should compute single cases with no else clause', function() {
				const length = 3;
				const namespace = {
					whens:  new Column(undefined, [true, false, null]),
					thens:  new Column(undefined, Array(length).fill("Pravda")),
				};

				const setup = new CaseExpr([new RefExpr("whens"), new RefExpr("thens")]);
				expect(setup.args).to.be.an('array').lengthOf(length);
				expect(setup.expr).to.be.undefined;
				expect(setup.alias()).to.equal('case when whens then thens else null end');
				const selection = Array(length).fill(null).map((v, i) => i);
				const actual = setup.evaluate(namespace, selection, length);
				expect(actual.data).to.be.an('array').lengthOf(length);
				expect(actual.data).to.deep.equal(["Pravda", null, null]);
			});
			it('should compute double cases', function() {
				const length = 3;
				const namespace = {
					whens1:  new Column(undefined, [true, false, null]),
					thens1:  new Column(undefined, Array(length).fill("Pravda")),
					whens2:  new Column(undefined, [false, true, null]),
					thens2:  new Column(undefined, Array(length).fill("Izvestia")),
					elses:   new Column(undefined, Array(length).fill("Nyet"))
				};

				const setup = new CaseExpr([
					new RefExpr("whens1"), new RefExpr("thens1"),
					new RefExpr("whens2"), new RefExpr("thens2"),
					new RefExpr("elses")
				]);
				expect(setup.args).to.be.an('array').lengthOf(5);
				expect(setup.expr).to.be.undefined;
				expect(setup.alias()).to.equal('case when whens1 then thens1 when whens2 then thens2 else elses end');
				const selection = Array(length).fill(null).map((v, i) => i);
				const actual = setup.evaluate(namespace, selection, length);
				expect(actual.data).to.be.an('array').lengthOf(length);
				expect(actual.data).to.deep.equal(["Pravda", "Izvestia", "Nyet"]);
			});
			it('should compute double cases with no else', function() {
				const length = 3;
				const namespace = {
					whens1:  new Column(undefined, [true, false, null]),
					thens1:  new Column(undefined, Array(length).fill("Pravda")),
					whens2:  new Column(undefined, [false, true, null]),
					thens2:  new Column(undefined, Array(length).fill("Izvestia")),
				};

				const setup = new CaseExpr([
					new RefExpr("whens1"), new RefExpr("thens1"),
					new RefExpr("whens2"), new RefExpr("thens2")
				]);
				expect(setup.args).to.be.an('array').lengthOf(5);
				expect(setup.expr).to.be.undefined;
				expect(setup.alias()).to.equal('case when whens1 then thens1 when whens2 then thens2 else null end');
				const selection = Array(length).fill(null).map((v, i) => i);
				const actual = setup.evaluate(namespace, selection, length);
				expect(actual.data).to.be.an('array').lengthOf(length);
				expect(actual.data).to.deep.equal(["Pravda", "Izvestia", null]);
			});
			it('should short circuit', function() {
				const length = 3;
				const namespace = {
					rowid: new Column(undefined, [1, 2, 3]),
					whens: new Column(undefined, [true, false, null]),
					elses: new Column(undefined, Array(length).fill("Izvestia"))
				};

				// Make sure we don't evaluate rowid 2.
				const thens = new FuncExpr(function(r) {
						if (r % 1) {
							throw "Unreachable";
						} else {
							return "Pravda";
						}
					}, [new RefExpr("rowid")]);
				const setup = new CaseExpr([new RefExpr("whens"), thens, new RefExpr("elses")]);
				expect(setup.args).to.be.an('array').lengthOf(length);
				expect(setup.expr).to.be.undefined;
				expect(setup.alias()).to.equal('case when whens then (rowid) else elses end');
				const selection = Array(length).fill(null).map((v, i) => i);
				const actual = setup.evaluate(namespace, selection, length);
				expect(actual.data).to.be.an('array').lengthOf(length);
				expect(actual.data).to.deep.equal(["Pravda", "Izvestia", "Izvestia"]);
			});
		});
	});
});
