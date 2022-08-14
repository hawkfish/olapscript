const expect = require ("chai").expect;
const olapscript = require('../olap-script');
const Expr = olapscript.Expr;

describe('Expr', function() {
    describe('Constructor', function() {
        it('should store the type', function() {
            const setup = 'Expression Type';
            const e = new olapscript.Expr(setup);
            expect(e.type).to.equal(setup);
        });
    });
});
