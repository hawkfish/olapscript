const expect = require ("chai").expect;
const Table = require('../src/table').Table;

const expr = require('../src/expr');
const Expr = expr.Expr;
const RefExpr = expr.RefExpr;
const FuncExpr = expr.FuncExpr;

const Sheet = require('./mocks/mock-sheet.js').MockSheet

describe('Table', function() {
	describe('select', function() {
		const customers = [
			['Customer Name', 'Address Line 1', 'Address Line 2', 'City', 'State', 'ZIP'],
			['Joe Blow', '123 Elm Street', 'Apt 3B', 'Anywhere', 'NY', 10036],
			['Mary Smith', '1274 Broadway', '', 'Seattle', 'WA', 98105],
			['Dupe Earl', '4810 Blackstone Blvd', '', 'Providence', 'RI', 02318],
		];

    it('should rename columns', function() {
			const target = Table.fromSheet(new Sheet('Customers', customers))
				.select([
					{expr: new RefExpr("Customer Name"), as: "Name"},
					{expr: new RefExpr('Address Line 1'), as: 'addressLine1'},
					{expr: new RefExpr('Address Line 2'), as: 'addressLine2'},
					{expr: new RefExpr('City'), as: 'city'},
					{expr: new RefExpr('ZIP'), as: 'ZIP'},
		 		])
			;
			expect(target.ordinals).to.be.an('array').lengthOf(5);
			expect(target.ordinals).to.deep.equal([ "Name", 'addressLine1', 'addressLine2', 'city', 'ZIP']);
			expect(target.getDataLength(), "Data Length").to.equal(3);
			expect(target.getRowCount(), "Row Count").to.equal(3);
		});

    it('should parse clauses', function() {
			const target = Table.fromSheet(new Sheet('Customers', customers))
				.select(`"Customer Name" AS "Name",
    						 "Address Line 1" AS "addressLine1",
    						 "Address Line 2" AS "addressLine2",
    						 "City" AS city,
    						 "ZIP"`)
		 		.where('"ZIP" = 10036')
			;
			expect(target.ordinals).to.be.an('array').lengthOf(5);
			expect(target.ordinals).to.deep.equal([ "Name", 'addressLine1', 'addressLine2', 'city', 'ZIP']);
			expect(target.getDataLength(), "Data Length").to.equal(3);
			expect(target.getRowCount(), "Row Count").to.equal(1);
		});
	});
});
