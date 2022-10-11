const expect = require ("chai").expect;
const Table = require('../src/table').Table;
const Sheet = require('./mocks/mock-sheet.js').MockSheet;

describe('Table', function() {
	describe('toSheet', function() {
		const bedrock = [
			{first: "Fred", last: "Flintstone", age: 38},
			{first: "Barney", last: "Rubble", age: 36},
			{first: "Wilma", last: "Flintstone", age: 35},
			{first: "Pebbles", last: "Flintstone", age: 2},
			{first: "Betty", last: "Rubble", age: 34},
			{first: "Bam-Bam", last: "Rubble", age: 2}
		];

		const header = [ ['first', 'last', 'age'] ];
		const rows = [
			['Fred', 'Flintstone', 38],
			['Barney', 'Rubble', 36],
			['Wilma', 'Flintstone', 35],
			['Pebbles', 'Flintstone', 2],
			['Betty', 'Rubble', 34],
			['Bam-Bam', 'Rubble', 2]
		];

		const filler = "rutabaga";

		it('should insert into an empty sheet', function() {
			const target = new Sheet('Target', []);
			const actual = Table.fromRows(bedrock).toSheet(target);
			expect(target.getMaxRows()).to.equal(7);
			expect(target.getLastRow()).to.equal(7);
			expect(target.getMaxColumns()).to.equal(3);
			expect(target.getLastColumn()).to.equal(3);
			expect(target.getRange(1, 1, 1, target.getLastColumn()).getValues()).to.deep.equal(header);
			expect(target.getRange(2, 1, 6, target.getLastColumn()).getValues()).to.deep.equal(rows);
		});

		it('should not clear a sheet', function() {
			const values = new Array(10).fill(null).map(() => new Array(10).fill(filler));
			const target = new Sheet('Target', values);
			const actual = Table.fromRows(bedrock).toSheet(target);
			expect(target.getMaxRows()).to.equal(10);
			expect(target.getLastRow()).to.equal(10);
			expect(target.getMaxColumns()).to.equal(10);
			expect(target.getLastColumn()).to.equal(10);
			expect(target.getRange(1, 1, 1, 3).getValues()).to.deep.equal(header);
			expect(target.getRange(2, 1, 6, 3).getValues()).to.deep.equal(rows);

			const tail = target.getRange(8, 1, 3, 10).getValues();
			tail.forEach(row => row.forEach(cell => expect(cell).to.equal(filler)));

			const side = target.getRange(1, 4, 10, 6).getValues();
			side.forEach(row => row.forEach(cell => expect(cell).to.equal(filler)));
		});

		it('should clear a sheet when asked', function() {
			const values = new Array(10).fill(null).map(() => new Array(10).fill(filler));
			const target = new Sheet('Target', values);
			const actual = Table.fromRows(bedrock).toSheet(target, {clear: true});
			expect(target.getMaxRows()).to.equal(10);
			expect(target.getLastRow()).to.equal(10);
			expect(target.getMaxColumns()).to.equal(10);
			expect(target.getLastColumn()).to.equal(10);
			expect(target.getRange(1, 1, 1, 3).getValues()).to.deep.equal(header);
			expect(target.getRange(2, 1, 6, 3).getValues()).to.deep.equal(rows);

			const tail = target.getRange(8, 1, 3, 10).getValues();
			tail.forEach(row => row.forEach(cell => expect(cell).to.equal("")));

			const side = target.getRange(1, 4, 10, 6).getValues();
			side.forEach(row => row.forEach(cell => expect(cell).to.equal("")));
		});

		it('should insert into an arbitrary location', function() {
			const values = new Array(10).fill(null).map(() => new Array(10).fill(filler));
			const target = new Sheet('Target', values);
			const actual = Table.fromRows(bedrock).toSheet(target, {top: 3, left: 3});
			expect(target.getMaxRows()).to.equal(10);
			expect(target.getLastRow()).to.equal(10);
			expect(target.getMaxColumns()).to.equal(10);
			expect(target.getLastColumn()).to.equal(10);
			expect(target.getRange(3, 3, 1, 3).getValues()).to.deep.equal(header);
			expect(target.getRange(4, 3, 6, 3).getValues()).to.deep.equal(rows);

			const head = target.getRange(1, 1, 2, 10).getValues();
			head.forEach(row => row.forEach(cell => expect(cell).to.equal(filler)));

			const left = target.getRange(1, 1, 10, 2).getValues();
			left.forEach(row => row.forEach(cell => expect(cell).to.equal(filler)));

			const right = target.getRange(1, 6, 10, 4).getValues();
			left.forEach(row => row.forEach(cell => expect(cell).to.equal(filler)));
		});
	});
});
