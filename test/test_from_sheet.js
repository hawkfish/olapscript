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
      const options = {limit: 5};
      const actual = Table.fromSheet(new Sheet('Helpers', values), options);
      expect(actual.ordinals).to.deep.equal(values[0]);
      expect(actual.getRowCount()).to.equal(options.limit);
      expect(actual.selection.length).to.equal(options.limit);
      actual.selection.forEach((selid, rowid) => expect(selid).to.equal(rowid));
      actual.ordinals.forEach(function(name, colid) {
        const data = actual.namespace[name].data;
        expect(data.length).to.equal(options.limit);
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
    it('should read a table with missing column names', function() {
      const dupes = [
        ['Name', 'Last', 'Age', ''],
        ['Joseph', 'Blow', 27, 'Joe'],
        ['Mary', 'Smith', 32, 'Mary'],
        ['Duplicate', 'Earl', 61, 'Dupe']
      ];
      const actual = Table.fromSheet(new Sheet('Duplicates', dupes));
      expect(actual.ordinals).to.deep.equal(['Name', 'Last', 'Age', 'D']);
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
      const contents = [
        ['Name', 'Name 2', 'Age', 'Name'],
        ['Joseph', 'Blow', 27, 'Joe'],
        ['Mary', 'Smith', 32, 'Mary'],
        ['Duplicate', 'Earl', 61, 'Dupe']
      ];
      const actual = Table.fromSheet(new Sheet('Duplicates', contents));
      expect(actual.ordinals).to.deep.equal(['Name', 'Name 2', 'Age', 'Name 3']);
      expect(actual.getRowCount()).to.equal(contents.length - 1);
      expect(actual.selection.length).to.equal(contents.length - 1);
      actual.selection.forEach((selid, rowid) => expect(selid).to.equal(rowid));
      actual.ordinals.forEach(function(name, colid) {
        const data = actual.namespace[name].data;
        expect(data.length).to.equal(contents.length - 1);
        actual.selection.forEach(function(selid) {
          expect(data[selid]).to.equal(contents[selid+1][colid]);
        });
      });
    });
    it('should read a table with no data', function() {
      const nodata = [
        ['Name', 'Last', 'Age'	]
      ];
      const actual = Table.fromSheet(new Sheet('nodata', nodata));
      expect(actual.ordinals).to.deep.equal(['Name', 'Last', 'Age']);
      expect(actual.getRowCount()).to.equal(nodata.length - 1);
      expect(actual.selection.length).to.equal(nodata.length - 1);
      actual.selection.forEach((selid, rowid) => expect(selid).to.equal(rowid));
      actual.ordinals.forEach(function(name, colid) {
        const data = actual.namespace[name].data;
        expect(data.length).to.equal(nodata.length - 1);
        actual.selection.forEach(function(selid) {
          expect(data[selid]).to.equal(nodata[selid+1][colid]);
        });
      });
    });
    it('should read a table not at the top left', function() {
      const contents = [
        [null, null, null, null, null, null],
        [null, 'First', 'Last', 'Age', 'Nickname', null],
        [null, 'Joseph', 'Blow', 27, 'Joe', null],
        [null, 'Mary', 'Smith', 32, 'Mary, null'],
        [null, 'Duplicate', 'Earl', 61, 'Dupe', null],
        [null, null, null, null, null, null]
      ];
      const options = {
      	top: 2,
      	left: 2,
      	limit: 3,
      	width: 4
      }
      const sheet = new Sheet('Inside', contents);
      const actual = Table.fromSheet(sheet, options);
      expect(actual.ordinals).to.be.an('array').lengthOf(options.width);
      expect(actual.ordinals).to.deep.equal(['First', 'Last', 'Age', 'Nickname']);
      expect(actual.getRowCount()).to.equal(options.limit);
      expect(actual.selection.length).to.equal(options.limit);
      actual.ordinals.forEach(function(name, colid) {
        const data = actual.namespace[name].data;
        expect(data.length).to.equal(options.limit);
        actual.selection.forEach(function(selid) {
        	// Top will get adjusted because it contains the header
          expect(data[selid], name).to.equal(contents[options.top + selid][options.left + colid - 1]);
        });
      });
    });
    it('should read a table with a disjoint header', function() {
      const contents = [
        [null, null, null, null, null, null],
        [null, 'First', 'Last', 'Age', 'Nickname', null],
        [null, null, null, null, null, null],
        [null, 'Joseph', 'Blow', 27, 'Joe', null],
        [null, 'Mary', 'Smith', 32, 'Mary, null'],
        [null, 'Duplicate', 'Earl', 61, 'Dupe', null],
        [null, null, null, null, null, null]
      ];
      const options = {
      	top: 4,
      	left: 2,
      	limit: 3,
      	width: 4,
      	header: 2,
      	headerCount: 1
      };
      const sheet = new Sheet('Inside', contents);
      const actual = Table.fromSheet(sheet, options);
      expect(actual.ordinals).to.be.an('array').lengthOf(options.width);
      expect(actual.ordinals).to.deep.equal(['First', 'Last', 'Age', 'Nickname']);
      expect(actual.getRowCount(), "Row Count").to.equal(options.limit);
      expect(actual.selection.length).to.equal(options.limit);
      actual.ordinals.forEach(function(name, colid) {
        const data = actual.namespace[name].data;
        expect(data.length).to.equal(options.limit);
        actual.selection.forEach(function(selid) {
          expect(data[selid], name).to.equal(contents[options.top + selid - 1][options.left + colid - 1]);
        });
      });
    });
    it('should read a table with a no header', function() {
      const contents = [
        [null, null, null, null, null, null],
        [null, 'Joseph', 'Blow', 27, 'Joe', null],
        [null, 'Mary', 'Smith', 32, 'Mary, null'],
        [null, 'Duplicate', 'Earl', 61, 'Dupe', null],
        [null, null, null, null, null, null]
      ];
      const options = {
      	top: 2,
      	left: 2,
      	limit: 3,
      	width: 4,
      	header: 2,
      	headerCount: 0
      };
      const sheet = new Sheet('Inside', contents);
      const actual = Table.fromSheet(sheet, options);
      expect(actual.ordinals).to.be.an('array').lengthOf(options.width);
      expect(actual.ordinals).to.deep.equal([ 'A', 'B', 'C', 'D' ]);
      expect(actual.getRowCount(), "Row Count").to.equal(options.limit);
      expect(actual.selection.length).to.equal(options.limit);
      actual.ordinals.forEach(function(name, colid) {
        const data = actual.namespace[name].data;
        expect(data.length).to.equal(options.limit);
        actual.selection.forEach(function(selid) {
          expect(data[selid], name).to.equal(contents[options.top + selid - 1][options.left + colid - 1]);
        });
      });
    });
    it('should read a table with custom column names', function() {
      const contents = [
        [null, null, null, null, null, null],
        [null, 'Joseph', 'Blow', 27, 'Joe', null],
        [null, 'Mary', 'Smith', 32, 'Mary, null'],
        [null, 'Duplicate', 'Earl', 61, 'Dupe', null],
        [null, null, null, null, null, null]
      ];
      const options = {
      	top: 2,
      	left: 2,
      	limit: 3,
      	width: 4,
      	header: 2,
      	headerCount: 0,
      	columns: ['First', 'Last', 'Age', 'Nickname']
      };
      const sheet = new Sheet('Inside', contents);
      const actual = Table.fromSheet(sheet, options);
      expect(actual.ordinals).to.be.an('array').lengthOf(options.width);
      expect(actual.ordinals).to.deep.equal(options.columns);
      expect(actual.getRowCount(), "Row Count").to.equal(options.limit);
      expect(actual.selection.length).to.equal(options.limit);
      actual.ordinals.forEach(function(name, colid) {
        const data = actual.namespace[name].data;
        expect(data.length).to.equal(options.limit);
        actual.selection.forEach(function(selid) {
          expect(data[selid], name).to.equal(contents[options.top + selid - 1][options.left + colid - 1]);
        });
      });
    });
    it('should read a table with a multi-row header', function() {
      const contents = [
        [null, null, null, null, null, null],
        [null, 'First', 'Last', 'Age', 'Nickname', null],
        [null, 'Name', 'Name', '', '', null],
        [null, null, null, null, null, null],
        [null, 'Joseph', 'Blow', 27, 'Joe', null],
        [null, 'Mary', 'Smith', 32, 'Mary, null'],
        [null, 'Duplicate', 'Earl', 61, 'Dupe', null],
        [null, null, null, null, null, null]
      ];
      const options = {
      	top: 5,
      	left: 2,
      	limit: 3,
      	width: 4,
      	header: 2,
      	headerCount: 2
      };
      const sheet = new Sheet('Inside', contents);
      const actual = Table.fromSheet(sheet, options);
      expect(actual.ordinals).to.be.an('array').lengthOf(options.width);
      expect(actual.ordinals).to.deep.equal(['First Name', 'Last Name', 'Age', 'Nickname']);
      expect(actual.getRowCount(), "Row Count").to.equal(options.limit);
      expect(actual.selection.length).to.equal(options.limit);
      actual.ordinals.forEach(function(name, colid) {
        const data = actual.namespace[name].data;
        expect(data.length).to.equal(options.limit);
        actual.selection.forEach(function(selid) {
          expect(data[selid], name).to.equal(contents[options.top + selid - 1][options.left + colid - 1]);
        });
      });
    });
    it('should read a table with data range columns ', function() {
      const contents = [
        [null, null, null, null, null, 'checkbox'],
        [null, 'First', 'Last', 'Age', 'Nickname', 'checkbox'],
        [null, 'Joseph', 'Blow', 27, 'Joe', 'checkbox'],
        [null, 'Mary', 'Smith', 32, 'Mary', 'checkbox'],
        [null, 'Duplicate', 'Earl', 61, 'Dupe', 'checkbox'],
        [null, null, null, 47, null, 'checkbox']
      ];
      const options = {
      	top: 2,
      	left: 2,
      	limit: 4,
      	width: 5,
      	dataBounds: [2, 3, 5]
      }
      const sheet = new Sheet('Inside', contents);
      const actual = Table.fromSheet(sheet, options);
      expect(actual.ordinals, "Ordinals").to.be.an('array').lengthOf(options.width);
      expect(actual.ordinals, "Ordinals").to.deep.equal(['First', 'Last', 'Age', 'Nickname', 'checkbox']);
      expect(actual.getRowCount()).to.equal(options.limit);
      expect(actual.selection.length).to.equal(options.limit);
      actual.ordinals.forEach(function(name, colid) {
        const data = actual.namespace[name].data;
        expect(data.length).to.equal(options.limit);
        actual.selection.forEach(function(selid) {
        	// Top will get adjusted because it contains the header
          expect(data[selid], name).to.equal(contents[options.top + selid][options.left + colid - 1]);
        });
      });
    });
  });
});

