const expect = require ("chai").expect;
const Table = require('../src/table').Table;
const expr = require('../src/expr');
const Aggr = require('../src/aggr').Aggr;


describe('Table', function() {
	const CountStar = Aggr.countstar;
	const Avg = Aggr.avg;
  describe('Group By', function() {
		const bedrock = [
			{first: "Fred", last: "Flintstone", age: 38},
			{first: "Barney", last: "Rubble", age: 36},
			{first: "Wilma", last: "Flintstone", age: 35},
			{first: "Pebbles", last: "Flintstone", age: 2},
			{first: "Betty", last: "Rubble", age: 34},
			{first: "Bam-Bam", last: "Rubble", age: 2}
		];
    it('should remove duplicates from one column', function() {
    	const actual = Table.fromRows(bedrock).groupBy([{expr: new RefExpr("last"), as: "family"}]);
    	expect(actual.ordinals).to.deep.equal(["family"]);
    	expect(actual.namespace).to.have.keys(actual.ordinals);
    	expect(actual.namespace.family.data).to.deep.equal(["Flintstone", "Rubble"]);
  	});
    it('should normalise single groups', function() {
    	const actual = Table.fromRows(bedrock).groupBy({expr: new RefExpr("last"), as: "family"});
    	expect(actual.ordinals).to.deep.equal(["family"]);
    	expect(actual.namespace).to.have.keys(actual.ordinals);
    	expect(actual.namespace.family.data).to.deep.equal(["Flintstone", "Rubble"]);
  	});
    it('should normalise anonymous expressions', function() {
    	const actual = Table.fromRows(bedrock).groupBy(new RefExpr("last"));
    	expect(actual.ordinals).to.deep.equal(["last"]);
    	expect(actual.namespace).to.have.keys(actual.ordinals);
    	expect(actual.namespace.last.data).to.deep.equal(["Flintstone", "Rubble"]);
  	});
    it('should count duplicates from one column', function() {
    	const actual = Table
    		.fromRows(bedrock)
    		.groupBy([{expr: new RefExpr("last"), as: "family"}], [{func: new CountStar, as: "count"}]);
    	expect(actual.ordinals).to.deep.equal(["family", "count"]);
    	expect(actual.namespace).to.have.keys(actual.ordinals);
    	expect(actual.namespace.family.data).to.deep.equal(["Flintstone", "Rubble"]);
    	expect(actual.namespace.count.data).to.deep.equal([3, 3]);
  	});
    it('should normalise single aggregates', function() {
    	const actual = Table
    		.fromRows(bedrock)
    		.groupBy([{expr: new RefExpr("last"), as: "family"}], {func: new CountStar, as: "count"});
    	expect(actual.ordinals).to.deep.equal(["family", "count"]);
    	expect(actual.namespace).to.have.keys(actual.ordinals);
    	expect(actual.namespace.family.data).to.deep.equal(["Flintstone", "Rubble"]);
    	expect(actual.namespace.count.data).to.deep.equal([3, 3]);
  	});
    it('should normalise anonymous aggregates', function() {
    	const actual = Table
    		.fromRows(bedrock)
    		.groupBy([{expr: new RefExpr("last"), as: "family"}], new CountStar);
    	expect(actual.ordinals).to.deep.equal(["family", "CountStar"]);
    	expect(actual.namespace).to.have.keys(actual.ordinals);
    	expect(actual.namespace.family.data).to.deep.equal(["Flintstone", "Rubble"]);
    	expect(actual.namespace.CountStar.data).to.deep.equal([3, 3]);
  	});
    it('should normalise anonymous aggregate classes', function() {
    	const actual = Table
    		.fromRows(bedrock)
    		.groupBy([{expr: new RefExpr("last"), as: "family"}], CountStar);
    	expect(actual.ordinals).to.deep.equal(["family", "CountStar"]);
    	expect(actual.namespace).to.have.keys(actual.ordinals);
    	expect(actual.namespace.family.data).to.deep.equal(["Flintstone", "Rubble"]);
    	expect(actual.namespace.CountStar.data).to.deep.equal([3, 3]);
  	});
    it('should compute aggregates with inputs', function() {
    	const actual = Table
    		.fromRows(bedrock)
    		.groupBy([{expr: new RefExpr("last"), as: "family"}], {func: new Avg(new RefExpr("age"))});
    	expect(actual.ordinals).to.deep.equal(["family", "Avg"]);
    	expect(actual.namespace).to.have.keys(actual.ordinals);
    	expect(actual.namespace.family.data).to.deep.equal(["Flintstone", "Rubble"]);
    	expect(actual.namespace.Avg.data).to.deep.equal([25, 24]);
  	});

    it('should remove duplicates from a group by clause', function() {
    	const actual = Table.fromRows(bedrock).groupBy('"last" AS "family"');
    	expect(actual.ordinals).to.deep.equal(["family"]);
    	expect(actual.namespace).to.have.keys(actual.ordinals);
    	expect(actual.namespace.family.data).to.deep.equal(["Flintstone", "Rubble"]);
  	});

    it('should compute aggregates from an agregate clause', function() {
    	const actual = Table
    		.fromRows(bedrock)
    		.groupBy('"last" AS "family"', 'AVG("age") AS "Avg"');
    	expect(actual.ordinals).to.deep.equal(["family", "Avg"]);
    	expect(actual.namespace).to.have.keys(actual.ordinals);
    	expect(actual.namespace.family.data).to.deep.equal(["Flintstone", "Rubble"]);
    	expect(actual.namespace.Avg.data).to.deep.equal([25, 24]);
  	});
  });
});
