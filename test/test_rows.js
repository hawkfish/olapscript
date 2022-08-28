const expect = require ("chai").expect;
const Table = require('../src/table').Table;

describe('Rows', function() {
	const bedrock = [
		{first: "Fred", last: "Flintstone", age: 38},
		{first: "Barney", last: "Rubble", age: 36},
		{first: "Wilma", last: "Flintstone", age: 35},
		{first: "Pebbles", last: "Flintstone", age: 2},
		{first: "Betty", last: "Rubble", age: 34},
		{first: "Bam-Bam", last: "Rubble", age: 2}
	];
  describe('fromRows', function() {
    it('should build a table', function() {
    	const actual = Table.fromRows(bedrock);
    	expect(actual.ordinals).to.deep.equal(["first", "last", "age"]);
    	expect(actual.namespace).to.have.keys(actual.ordinals);
  	});
  });
  describe('toRows', function() {
    it('should extract an array of records', function() {
    	const actual = Table.fromRows(bedrock).toRows();
    	expect(actual).to.be.an('array').lengthOf(bedrock.length);
    	actual.forEach(row => expect(row).to.have.keys(["first", "last", "age"]));
  	});
  });
  describe('getColumn', function() {
    it('should extract an array of data', function() {
    	const actual = Table.fromRows(bedrock).getColumn("first");
    	expect(actual).to.be.an('array').lengthOf(bedrock.length);
    	actual.forEach((val, rowid) => expect(val).to.equal(bedrock[rowid].first));
  	});
  });
});
