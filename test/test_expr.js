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
    
    const expectScalar = function(setup, datatype) {
        const e = new ConstExpr(setup);
        expect(e.type).to.equal('constant');
        expect(e.constant).to.equal(setup);
        expect(e.datatype).to.equal(datatype);

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
            expect(e.datatype).to.equal('object');
            expect(e.alias()).to.equal('null');
            
            const col = e.evaluate(namespace, selection);
            expect(col.type).to.equal(e.datatype);
            expect(col.data).to.be.an('array').lengthOf(count);
            col.data.forEach(v => expect(v).to.be.null);
            
        });
        it('should store a string constant', function() {
            expectScalar('String', 'string');
        });
        it('should store a numeric constant', function() {
            expectScalar(3.15149, 'number');
        });
        it('should store an Array constant', function() {
            expectScalar([0, 1, 2, 3], 'object');
        });
        it('should store an Object constant', function() {
            expectScalar({key: "Value"}, 'object');
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
