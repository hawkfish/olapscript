const expect = require ("chai").expect;
const Table = require('../src/table').Table;
const expr = require('../src/expr');
const RefExpr = expr.RefExpr;

describe('Table', function() {
  const dim_rows = [
    {pk: 1, email: 'customer1@example.com'},
    {pk: 2, email: 'customer2@example.com'},
    {pk: 3, email: 'customer3@example.com'},
    {pk: null, email: 'customernull@example.com'}
  ];
  const fact_rows = [
    {fk: 1, amt: 30.50},
    {fk: 1, amt: -10.25},
    {fk: 1, amt: 5.95},
    {fk: 3, amt: 19.95},
    {fk: 3, amt: -4.50},
    {fk: 4, amt: 3.25},
    {fk: null, amt: 0}
  ];

	const lobster_rows = [
		{ID: 1, payload: "Tis"},
		{ID: 4, payload: "the"},
		{ID: 7, payload: "voice"}
	];
	const slithy_rows = [
		{ID: 1, payload: "Twas"},
		{ID: 2, payload: "brillig"},
		{ID: 3, payload: "and"},
		{ID: 4, payload: "the"},
		{ID: 5, payload: "slithy"},
		{ID: 6, payload: "toves"}
	];

	describe('equiJoinKeys', function() {
    it('should convert single equality conditions', function() {
    	const setup = new Parser('"fk" = "pk"').parse();
    	const expected = {
    		left: new RefExpr('fk'),
    		right: new RefExpr('pk'),
    		distinct: false
    	};
    	const actual = Table.equiJoinKeys(setup);
    	expect(actual).to.be.an('array').lengthOf(1);
    	expect(actual[0]).to.deep.equal(expected);
    });

    it('should convert single not distinct conditions', function() {
    	const setup = new Parser('"fk" is not distinct from "pk"').parse();
    	const expected = {
    		left: new RefExpr('fk'),
    		right: new RefExpr('pk'),
    		distinct: true
    	};
    	const actual = Table.equiJoinKeys(setup);
    	expect(actual).to.be.an('array').lengthOf(1);
    	expect(actual[0]).to.deep.equal(expected);
    });

    it('should convert AND-ed conditions', function() {
    	const setup = new Parser('"fk" = "pk" AND "filter" is not distinct from "test"').parse();
    	const expected = [
    		{left: new RefExpr('fk'), right: new RefExpr('pk'), distinct: false},
    		{left: new RefExpr('filter'), right: new RefExpr('test'), distinct: true}
    	];
    	const actual = Table.equiJoinKeys(setup);
    	expect(actual).to.be.an('array').lengthOf(2);
    	expect(actual).to.deep.equal(expected);
    });
	});

  describe('equiJoin', function() {
    it('should inner join foreign keys', function() {
      const condition = {build: new RefExpr("pk"), probe: new RefExpr("fk")};
      const build = Table.fromRows(dim_rows);
      const probe = Table.fromRows(fact_rows);
      const joined = probe.equiJoin(build, condition);
      expect(joined.getRowCount()).to.equal(5);
      probe.ordinals.forEach(name =>
        (joined.selection.forEach((selid) =>
          expect(joined.namespace[name].data[selid], name).to.equal(fact_rows[selid][name]))));
      build.ordinals.forEach(name =>
        (joined.selection.forEach(function (selid) {
          const pk = joined.namespace.pk.data[selid];
          expect(joined.namespace[name].data[selid], name).to.equal(dim_rows[pk-1][name]);
        })));
    });
    it('should left join foreign keys', function() {
      const condition = {build: new RefExpr("pk"), probe: new RefExpr("fk")};
      const options = {type: "left"};
      const build = Table.fromRows(dim_rows);
      const probe = Table.fromRows(fact_rows);
      const joined = probe.equiJoin(build, condition, options);
      expect(joined.getRowCount()).to.equal(7);
      probe.ordinals.forEach(name =>
        (joined.selection.forEach((selid) =>
          expect(joined.namespace[name].data[selid], name).to.equal(fact_rows[selid][name]))));
      build.ordinals.forEach(name =>
        (joined.selection.forEach(function (selid) {
          if (selid < 5) {
            const pk = joined.namespace.pk.data[selid];
            expect(joined.namespace[name].data[selid], name).to.equal(dim_rows[pk-1][name]);
          } else {
            expect(joined.namespace[name].data[selid], name).to.be.null;
          }
        }))
      );
    });
    it('should right join foreign keys', function() {
      const condition = {build: new RefExpr("pk"), probe: new RefExpr("fk")};
      const options = {type: "right"};
      const build = Table.fromRows(dim_rows);
      const probe = Table.fromRows(fact_rows);
      const joined = probe.equiJoin(build, condition, options);
      expect(joined.getRowCount()).to.equal(7);
      probe.ordinals.forEach(name =>
        (joined.selection.forEach(function (selid) {
          if (selid < 5) {
            expect(joined.namespace[name].data[selid], name).to.equal(fact_rows[selid][name]);
          } else {
            expect(joined.namespace[name].data[selid], name).to.be.null;
          }
        })
      ));
      build.ordinals.forEach(name =>
        (joined.selection.forEach(function(selid, rowid) {
          const pk = joined.namespace.pk.data[selid] || 4;
          expect(joined.namespace[name].data[selid], name).to.equal(dim_rows[pk-1][name]);
        })
      ));
    });
    it('should full outer join foreign keys', function() {
      const condition = {build: new RefExpr("pk"), probe: new RefExpr("fk")};
      const options = {type: "full"};
      const build = Table.fromRows(dim_rows);
      const probe = Table.fromRows(fact_rows);
      const joined = probe.equiJoin(build, condition, options);
      expect(joined.getRowCount()).to.equal(9);
      probe.ordinals.forEach(name =>
        (joined.selection.forEach(function (selid) {
          if (selid < fact_rows.length) {
            expect(joined.namespace[name].data[selid], name).to.equal(fact_rows[selid][name]);
          } else {
            expect(joined.namespace[name].data[selid], name).to.be.null;
          }
        })
      ));
      build.ordinals.forEach(name =>
        (joined.selection.forEach(function(selid) {
          if (selid < 5 || selid >= fact_rows.length ) {
            const pk = joined.namespace.pk.data[selid] || 4;
            expect(joined.namespace[name].data[selid], name).to.equal(dim_rows[pk-1][name]);
          } else {
            expect(joined.namespace[name].data[selid], name).to.be.null;
          }
        })
      ));
    });
    it('should allow left and right as aliases for probe and build', function() {
      const condition = {right: new RefExpr("pk"), left: new RefExpr("fk")};
      const build = Table.fromRows(dim_rows);
      const probe = Table.fromRows(fact_rows);
      const joined = probe.equiJoin(build, condition);
      expect(joined.getRowCount()).to.equal(5);
      probe.ordinals.forEach(name =>
        (joined.selection.forEach((selid) =>
          expect(joined.namespace[name].data[selid], name).to.equal(fact_rows[selid][name]))));
      build.ordinals.forEach(name =>
        (joined.selection.forEach(function (selid) {
          const pk = joined.namespace.pk.data[selid];
          expect(joined.namespace[name].data[selid], name).to.equal(dim_rows[pk-1][name]);
        })));
    });
    it('should parse string equality predicates into conditions', function() {
      const condition = '"fk" = "pk"';
      const build = Table.fromRows(dim_rows);
      const probe = Table.fromRows(fact_rows);
      const joined = probe.equiJoin(build, condition);
      expect(joined.getRowCount()).to.equal(5);
      probe.ordinals.forEach(name =>
        (joined.selection.forEach((selid) =>
          expect(joined.namespace[name].data[selid], name).to.equal(fact_rows[selid][name]))));
      build.ordinals.forEach(name =>
        (joined.selection.forEach(function (selid) {
          const pk = joined.namespace.pk.data[selid];
          expect(joined.namespace[name].data[selid], name).to.equal(dim_rows[pk-1][name]);
        })));
    });
    it('should parse string not distinct predicates into conditions', function() {
      const condition = '"fk" is not distinct from "pk"';
      const build = Table.fromRows(dim_rows);
      const probe = Table.fromRows(fact_rows);
      const joined = probe.equiJoin(build, condition);
      expect(joined.getRowCount()).to.equal(6);
      probe.ordinals.forEach(name =>
        (joined.selection.forEach(function(selid) {
        	if (selid < 5) {
          	expect(joined.namespace[name].data[selid], name).to.equal(fact_rows[selid][name]);
          } else {
          	expect(joined.namespace[name].data[selid], name).to.equal(fact_rows[selid + 1][name]);
          }
        })));
      build.ordinals.forEach(name =>
        (joined.selection.forEach(function (selid) {
          const pk = joined.namespace.pk.data[selid] || 4;
          expect(joined.namespace[name].data[selid], name).to.equal(dim_rows[pk-1][name]);
        })));
    });
    it('should handle selections on both sides', function() {
    	const predicate = `"First" = '' OR "Last" = ''`;
    	const ifl_rows = [
				{ID: 'xyzzy',	First: 'Ellen',	Last: 'R'},
				{ID: 'xyzzz',	First: '',	Last: 'R'},
				{ID: 'xyyyy',	First: '',	Last: 'R'}
				];
			const ifl = Table.fromRows(ifl_rows).where(predicate);

			const fle_rows = [
				{First: 'Ellen',	Last: 'R',	Email: 'er@er.er'},
				{First: '',	Last: 'R',	Email: 'ab@cd.ef'},
				{First: '',	Last: 'R',	Email: 'gh@ij.kl'}
			];
			const fle = Table.fromRows(fle_rows).where(predicate);

			const actual = ifl.equiJoin(fle, '"First" = "First" AND "Last" = "Last"');
			expect(actual.getRowCount()).to.equal(4);
			expect(actual.ordinals).to.deep.equal(['ID', 'First', 'Last', 'Email']);
			expect(actual.namespace['ID'].data).to.deep.equal([ 'xyzzz', 'xyzzz', 'xyyyy', 'xyyyy' ]);
			expect(actual.namespace['First'].data).to.deep.equal(['', '', '', '']);
			expect(actual.namespace['Last'].data).to.deep.equal(['R', 'R', 'R', 'R']);
			expect(actual.namespace['Email'].data).to.deep.equal([ 'ab@cd.ef', 'gh@ij.kl', 'ab@cd.ef', 'gh@ij.kl' ]);
    });

    it('should rename imported columns for inner joins', function() {
      const options = {imports: {payload: "build_payload"}};
      const build = Table.fromRows(lobster_rows);
      const probe = Table.fromRows(slithy_rows);
      const actual = probe.equiJoin(build, '"ID" = "ID"', options);
      expect(actual.getRowCount()).to.equal(2);
			expect(actual.ordinals).to.deep.equal(['ID', 'payload', 'build_payload']);
			expect(actual.namespace['ID'].data).to.deep.equal([ 1, 4] );
			expect(actual.namespace['payload'].data).to.deep.equal([ "Twas", "the"] );
			expect(actual.namespace['build_payload'].data).to.deep.equal([ "Tis", "the"] );
    });

    it('should rename imported columns for left joins', function() {
      const options = {type: 'left', imports: {payload: "build_payload"}};
      const build = Table.fromRows(lobster_rows);
      const probe = Table.fromRows(slithy_rows);
      const actual = probe.equiJoin(build, '"ID" = "ID"', options);
      expect(actual.getRowCount()).to.equal(6);
			expect(actual.ordinals).to.deep.equal(['ID', 'payload', 'build_payload']);
			expect(actual.namespace['ID'].data).to.deep.equal([ 1, 4, 2, 3, 5, 6] );
			expect(actual.namespace['payload'].data).to.deep.equal([ "Twas", "the", "brillig", "and", "slithy", "toves"] );
			expect(actual.namespace['build_payload'].data).to.deep.equal([ "Tis", "the", null, null, null, null] );
    });

    it('should rename imported columns for right joins', function() {
      const options = {type: 'right', imports: {payload: "build_payload", ID: "build_ID"}};
      const build = Table.fromRows(lobster_rows);
      const probe = Table.fromRows(slithy_rows);
      const actual = probe.equiJoin(build, '"ID" = "ID"', options);
      expect(actual.getRowCount()).to.equal(3);
			expect(actual.ordinals).to.deep.equal(['ID', 'payload', 'build_payload', 'build_ID']);
			expect(actual.namespace['ID'].data).to.deep.equal([ 1, 4, null] );
			expect(actual.namespace['build_ID'].data).to.deep.equal([ 1, 4, 7]);
			expect(actual.namespace['payload'].data).to.deep.equal([ "Twas", "the", null] );
			expect(actual.namespace['build_payload'].data).to.deep.equal([ "Tis", "the", "voice"] );
    });

    it('should rename imported columns for full outer joins', function() {
      const options = {type: 'full', imports: {payload: "build_payload", ID: "build_ID"}};
      const build = Table.fromRows(lobster_rows);
      const probe = Table.fromRows(slithy_rows);
      const actual = probe.equiJoin(build, '"ID" = "ID"', options);
      expect(actual.getRowCount()).to.equal(7);
			expect(actual.ordinals).to.deep.equal(['ID', 'payload', 'build_payload', 'build_ID']);
			expect(actual.namespace['ID'].data).to.deep.equal([ 1, 4, 2, 3, 5, 6, null]);
			expect(actual.namespace['build_ID'].data).to.deep.equal([ 1, 4, null, null, null, null, 7]);
			expect(actual.namespace['payload'].data).to.deep.equal(
				["Twas", "the", "brillig", "and", "slithy", "toves", null] );
			expect(actual.namespace['build_payload'].data).to.deep.equal(["Tis", "the", null, null, null, null, "voice"]);
    });
  });
});
