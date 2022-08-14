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

