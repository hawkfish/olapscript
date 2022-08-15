const expect = require ("chai").expect;
const column = require('../src/column');

const Column = column.Column;

describe('Column', function() {
  const count = 5;
  const empty = Array(count).fill(null);
  const numbers = empty.map((val, i) => i);
  const strings = numbers.map(val => String(val));

  describe('Constructor', function() {
    it('should default to undefined/empty', function() {
        const col = new Column();
        expect(col.type).to.equal('undefined');
        expect(col.data).to.be.an('array').lengthOf(0);
    });
    it('should store the type and data for a Number array', function() {
        const type = typeof numbers[0];
        const col = new Column(undefined, numbers);
        expect(col.type).to.equal(type);
        expect(col.data).to.equal(numbers);
    });
    it('should store the type and data for a String array', function() {
        const type = typeof strings[0];
        const col = new Column(undefined, strings);
        expect(col.type).to.equal(type);
        expect(col.data).to.equal(strings);
    });
  });
  describe('getRowCount', function() {
    it('should return 0 for the default constructor', function() {
        const col = new Column();
        expect(col.getRowCount()).to.equal(0);
    });
    it('should the non-empty row count', function() {
        const col = new Column(undefined, numbers);
        expect(col.getRowCount()).to.equal(count);
    });
  });
});
