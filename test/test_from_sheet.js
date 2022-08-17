const expect = require ("chai").expect;
const Table = require('../src/table').Table;

const Sheet = require('./mocks/mock-sheet.js').MockSheet;

describe('Table', function() {
  describe('fromSheet', function() {
    const values = [
        ['First', 'Last', 'Email', 'Phone', 'County'],
        ['Joe', 'Blow', 'Joe.Blow@example.com', '123.345.2345', ''],
        ['Mary', 'Smith', 'Mary.Smith@example.com', '123.345.2345', 'Washoe'],
        ['Dupe', 'Earl', 'Dupe.Earl@example.com', '987.654.321', 'Washoe'],
        ['John', 'del Rio', 'John.delRio@example.com', '123.345.2345', ''],
        ['Jean', 'Harlow', 'Jean.Harlow@example.com', '123.345.2345', 'Clark'],
        ['W. Kamau', 'Bell', 'W.Kamau.Bell@example.com', '123.345.2345', ''],
        ['Harry', 'Worthington-Wright', 'Harry.WorthingtonWright@example.com', '123.345.2345', 'Clark'],
        ['Queen', 'Elizabeth', 'Queen.Elizabeth@example.com', '123.345.2345', ''],
        ['Jordan', 'Peele', 'Jordan.Peele@example.com', '123.345.2345', 'Clark'],
        ['Thurston', 'Howell III', 'Thurston.Howell III@example.com', '123.345.2345', 'Washoe'],
        ['Ima', 'Volunteer', 'Ima.Volunteer@example.com', '123.345.2345', 'Other'],
        ['Honey', 'Badger', 'Honey.Badger@example.com', '123.345.2345', 'Other'],
        ['Edward', 'Snowden', 'Edward.Snowden@example.com', '123.345.2345', ''],
        ['Dupe', 'Earl', 'Dupe.Earl@example.com', '987.654.321', 'Washoe']
      ];
    it('should read a simple table', function() {
      const actual = Table.fromSheet(new Sheet('Helpers', values));
      expect(actual.ordinals).to.deep.equal(values[0]);
      expect(actual.getRowCount()).to.equal(values.length - 1);
      expect(actual.selection.length).to.equal(values.length - 1);
      actual.selection.forEach((selid, rowid) => expect(selid).to.equal(rowid));
      actual.ordinals.forEach(function(name, colid) {
        const data = actual.namespace[name].data;
        expect(data.length).to.equal(values.length-1);
        actual.selection.forEach(function(selid) {
          expect(data[selid]).to.equal(values[selid+1][colid]);
        });
      });
    });
    it('should read a limited table', function() {
      const limit = 5;
      const actual = Table.fromSheet(new Sheet('Helpers', values), {limit: limit});
      expect(actual.ordinals).to.deep.equal(values[0]);
      expect(actual.getRowCount()).to.equal(limit);
      expect(actual.selection.length).to.equal(limit);
      actual.selection.forEach((selid, rowid) => expect(selid).to.equal(rowid));
      actual.ordinals.forEach(function(name, colid) {
        const data = actual.namespace[name].data;
        expect(data.length).to.equal(limit);
        actual.selection.forEach(function(selid) {
          expect(data[selid]).to.equal(values[selid+1][colid]);
        });
      });
    });
    it('should read a table with duplicate column names', function() {
      const dupes = [
        ['Name', 'Last', 'Age', 'Name'],
        ['Joseph', 'Blow', 27, 'Joe'],
        ['Mary', 'Smith', 32, 'Mary'],
        ['Duplicate', 'Earl', 61, 'Dupe']
      ];
      const actual = Table.fromSheet(new Sheet('Duplicates', dupes));
      expect(actual.ordinals).to.deep.equal(['Name', 'Last', 'Age', 'Name 2']);
      expect(actual.getRowCount()).to.equal(dupes.length - 1);
      expect(actual.selection.length).to.equal(dupes.length - 1);
      actual.selection.forEach((selid, rowid) => expect(selid).to.equal(rowid));
      actual.ordinals.forEach(function(name, colid) {
        const data = actual.namespace[name].data;
        expect(data.length).to.equal(dupes.length - 1);
        actual.selection.forEach(function(selid) {
          expect(data[selid]).to.equal(dupes[selid+1][colid]);
        });
      });
    });
    it('should read a table with conflicting duplicate column names', function() {
      const dupes = [
        ['Name', 'Name 2', 'Age', 'Name'],
        ['Joseph', 'Blow', 27, 'Joe'],
        ['Mary', 'Smith', 32, 'Mary'],
        ['Duplicate', 'Earl', 61, 'Dupe']
      ];
      const actual = Table.fromSheet(new Sheet('Duplicates', dupes));
      expect(actual.ordinals).to.deep.equal(['Name', 'Name 2', 'Age', 'Name 3']);
      expect(actual.getRowCount()).to.equal(dupes.length - 1);
      expect(actual.selection.length).to.equal(dupes.length - 1);
      actual.selection.forEach((selid, rowid) => expect(selid).to.equal(rowid));
      actual.ordinals.forEach(function(name, colid) {
        const data = actual.namespace[name].data;
        expect(data.length).to.equal(dupes.length - 1);
        actual.selection.forEach(function(selid) {
          expect(data[selid]).to.equal(dupes[selid+1][colid]);
        });
      });
    });
  });
});

