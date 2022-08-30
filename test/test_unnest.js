const expect = require ("chai").expect;
const Table = require('../src/table').Table;

describe('Unnest', function() {
	const bedrock = [
		{first: ["Fred", "Wilma", "Pebbles", "Dino"], last: "Flintstone"},
		{first: ["Barney", "Betty", "Bam-Bam"], last: "Rubble"},
	];
	it('should unnest arrays', function() {
		const actual = Table.fromRows(bedrock);
		expect(actual.ordinals).to.deep.equal(["first", "last"]);
		expect(actual.namespace).to.have.keys(actual.ordinals);
		const end0 = bedrock[0].first.length;
		actual.selection.slice(end0).forEach(function(selidx) {
			expect(actual.namespace.first.data[selidx]).to.equal(bedrock[0].first[selidx]);
			expect(actual.namespace.last.data[selidx]).to.equal(bedrock[0].last);
		});
		const end1 = end0 + bedrock[1].first.length
		actual.selection.slice(end0, end1).forEach(function(selidx) {
			expect(actual.namespace.first.data[selidx]).to.equal(bedrock[1].first[selidx - end0]);
			expect(actual.namespace.last.data[selidx]).to.equal(bedrock[1].last);
		});
	});
});
