const expect = require ("chai").expect;
const Table = require('../src/table').Table;
const fs = require('fs');

const jsonFixture = function(done, name) {
  return JSON.parse(fs.readFileSync(`test/fixtures/${name}.json`, 'utf8'));
};

describe('Table', function() {
  describe('Union All', function() {
    var alice1;
    var alice2;

    before('Union All', function(done) {
      alice1 = jsonFixture(done, 'alice1');
      alice2 = jsonFixture(done, 'alice2');
      done();
    });

    describe('by name', function() {
      it('should union two tables', function() {
        const actual = Table.fromRows(alice1)
                            .unionAll(Table.fromRows(alice2), {by: 'name'});
        expect(actual.ordinals).to.be.an('array').lengthOf(3);
        expect(actual.namespace).to.have.all.keys(actual.ordinals);
        expect(actual.selection).to.be.an('array').lengthOf(13);
        actual.selection.forEach((selidx, rowidx) => expect(selidx).to.equal(rowidx));
        actual.selection.forEach(function(rowid) {
          const row = actual.getRow(rowid);
          if (rowid < alice1.length) {
            expect(row).to.deep.equal(alice1[rowid]);
          } else {
            expect(row).to.deep.equal(alice2[rowid - alice1.length]);
          }
        });
      });
    });

    describe('by position', function() {
      it('should union two tables', function() {
        const ordinals = ['number', 'string', 'date'];
        const actual = Table.fromRows(alice1, ordinals)
                            .unionAll(Table.fromRows(alice2, ordinals));
        expect(actual.ordinals).to.be.an('array').lengthOf(3);
        expect(actual.ordinals).to.deep.equal(ordinals);
        expect(actual.namespace).to.have.all.keys(actual.ordinals);
        expect(actual.selection).to.be.an('array').lengthOf(13);
        actual.selection.forEach((selidx, rowidx) => expect(selidx).to.equal(rowidx));
        actual.selection.forEach(function(rowid) {
          const row = actual.getRow(rowid);
          if (rowid < alice1.length) {
            expect(row).to.deep.equal(alice1[rowid]);
          } else {
            expect(row).to.deep.equal(alice2[rowid - alice1.length]);
          }
        });
      });
    });
  });
});
