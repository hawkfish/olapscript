const expect = require ("chai").expect;
const olapscript = require('../olap-script');

const Expr = olapscript.Expr;
describe('Expr', function() {
    describe('Constructor', function() {
        it('should store the type', function() {
            const setup = 'Expression Type';
            const e = new Expr(setup);
            expect(e.type).to.equal(setup);
        });
    });
});

const ConstExpr = olapscript.ConstExpr;
describe('ConstExpr', function() {
    const count = 5;
    const namespace = {name: {type: undefined, data: Array(count)}};
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


const RefExpr = olapscript.RefExpr;
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
