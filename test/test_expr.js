const expect = require ("chai").expect;
const expr = require('../src/expr');
const Column = require('../src/column').Column;

const Expr = expr.Expr;
describe('Expr', function() {
    describe('Constructor', function() {
        it('should store the type', function() {
            const setup = 'Expression Type';
            const e = new Expr(setup);
            expect(e.type).to.equal(setup);
        });
    });
});

const ConstExpr = expr.ConstExpr;
describe('ConstExpr', function() {
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
        const col = e.evaluate(namespace, selection);
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

            const col = e.evaluate(namespace, selection);
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


const RefExpr = expr.RefExpr;
describe('RefExpr', function() {
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
    });
    describe('evaluate', function() {
        it('should return the referenced column', function() {
            const e = new RefExpr('column');
            const actual = e.evaluate(namespace, selection);
            expect(actual).to.equal(namespace.column);
        });
    });
    describe('evaluate', function() {
        it('should throw for unknown columns', function() {
            const e = new RefExpr('fnord');
            expect(e.evaluate.bind(e, namespace, selection)).to.throw(ReferenceError);
        });
    });
});

const FuncExpr = expr.FuncExpr;
describe('FuncExpr', function() {
    const count = 5;
    const namespace = {column: {type: undefined, data: Array(count).fill(null)}};
    const selection = namespace.column.data.map((v, rowid) => rowid);

    const nullary = function () {return 27;};
    const unary = function (x) {return x * 5;};
    const binary = (x, y) => x - y;

    const expectEvaluate = function(expr, expected) {
        const actual = expr.evaluate(namespace, selection);
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
