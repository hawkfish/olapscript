const expect = require ("chai").expect;
const Table = require('../src/table').Table;

describe('Table', function() {
	const bedrock = [
		{first: "Fred", last: "Flintstone", age: 38},
		{first: "Barney", last: "Rubble", age: 36},
		{first: "Wilma", last: "Flintstone", age: 35},
		{first: "Pebbles", last: "Flintstone", age: 2},
		{first: "Betty", last: "Rubble", age: 34},
		{first: "Bam-Bam", last: "Rubble", age: 2}
	];
  describe('orderby', function() {
    it('should sort major and minor fields', function() {
    	const actual = Table
    		.fromRows(bedrock)
    		.orderby([{expr: new RefExpr("age")}, {expr: new RefExpr("first"), asc: false}])
    		.toRows()
    	;
    	[5, 3, 4, 2, 1, 0].forEach((unsorted, sorted) => expect(actual[sorted]).to.deep.equal(bedrock[unsorted]));
  	});
    it('should sort using an ordering clause', function() {
    	const actual = Table
    		.fromRows(bedrock)
    		.orderby(`"age", "first" DESC`)
    		.toRows()
    	;
    	[5, 3, 4, 2, 1, 0].forEach((unsorted, sorted) => expect(actual[sorted]).to.deep.equal(bedrock[unsorted]));
  	});
  });
});
