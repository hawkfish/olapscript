const expect = require ("chai").expect;
const Table = require('../src/table').Table;

const expr = require('../src/expr');
const Expr = expr.Expr;
const RefExpr = expr.RefExpr;
const FuncExpr = expr.FuncExpr;

const Sheet = require('./mocks/mock-sheet.js').MockSheet

describe('Examples', function() {
    it('should extract a subset of a sheet', function() {
    	const values = [
        ['Customer Name', 'Address Line 1', 'Address Line 2', 'City', 'State', 'ZIP'],
        ['Joe Blow', '123 Elm Street', 'Apt 3B', 'Anywhere', 'NY', 10036],
        ['Mary Smith', '1274 Broadway', '', 'WA', 98105],
        ['Dupe Earl', '4810 Blackstone Blvd', '', 'Providence', 'RI', 02318],
      ];

			const target = Table.fromSheet(new Sheet('Customers', values))
				.select([
					{expr: new RefExpr("Customer Name"), as: "Name"},
					{expr: new RefExpr('Address Line 1'), as: 'addressLine1'},
					{expr: new RefExpr('Address Line 2'), as: 'addressLine2'},
					{expr: new RefExpr('City'), as: 'city'},
					{expr: new RefExpr('ZIP'), as: 'ZIP'},
		 		])
				.where(new FuncExpr(Expr.eq, [new RefExpr('ZIP'), 10036]))
			;
			expect(target.ordinals).to.be.an('array').lengthOf(5);
			expect(target.ordinals).to.deep.equal([ "Name", 'addressLine1', 'addressLine2', 'city', 'ZIP']);
			expect(target.getDataLength(), "Data Length").to.equal(3);
			expect(target.getRowCount(), "Row Count").to.equal(1);
	});

  it('should find missing values in a table', function() {
		// Make the mock sheets
		const salesData = [
			["name", 'date'],
			["Fred", new Date(1997, 8, 5)],
			["Wilma", new Date(1997, 9, 13)],
			["Barney", new Date(1998, 4, 1)],
			["Betty", new Date(1998, 4, 2)],
			["Betty", new Date(1998, 5, 7)],
			["Wilma", new Date(1998, 6, 14)],
		];

		const customerData = [
			["name", 'email'],
			["Fred", 'fred@example.com'],
			["Barney", 'barney@example.com']
		];

		const customerSheet = new Sheet('Customers', customerData);
		const salesSheet = new Sheet('Sales', salesData);

		// Make expressions to refer to the columns
		const name = new RefExpr("name");
		const name2 = new RefExpr("name2");

		// Read the data for sheet1
		const sales = Table.fromSheet(salesSheet)
			// Keep only the name column
			.select([{expr: name}]);

		// Read the data from sheet2
		const customers = Table.fromSheet(customerSheet)
			// keep only the name column renamed to "name2"
			.select([{expr: name, as: "name2"}]);

		// Build the list of unique missing names from sales
		const missing = sales
			// A left join keeps any unmatched rows from the left (probe, sales) side
			// by filling in nulls for the right (build, customers) side columns
			.equiJoin(customers, {probe: name, build: name2}, {type: 'left'})
			// We can then filter it down to the name2 values that are null
			.where(new FuncExpr(Expr.isnull, [name2]))
			// And remove the duplicates
			.groupBy(name);
	});
});
