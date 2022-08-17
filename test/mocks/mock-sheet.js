class MockRange {
  constructor(sheet, row, column, numRows, numColumns) {
    this.sheet = sheet;
    this.row = row || 1;
    this.column = column || 1;
    this.numRows = numRows || sheet.getLastRow();
    this.numCols = numColumns || 1;
  }

  getNumColumns() {
    return this.numCols;
  }

  getValues() {
    const that = this;
    return this
      .sheet
      .values
      .filter((row, rowid) => (that.row-1 <= rowid && rowid < that.numRows))
      .map(row => row.filter((val, colid) => (that.column - 1 <= colid  && colid < that.numCols)));
  }
};

class MockSheet {
  constructor(name, values) {
    this.name = name;
    this.values = values;
    this.lastRow = values.length;
    this.lastCol = values.length ? values[0].length : 0;
  }

  getName() {
    return this.name;
  }

  getLastRow() {
    return this.lastRow;
  }

  getLastColumn() {
    return this.lastCol;
  }

  getRange(row, column, numRows, numColumns) {
    row = row || 1;
    column = column || 1;
    numRows = numRows || this.numRows;
    numColumns = numColumns || 1;

    return new MockRange(this, row, column, numRows, numColumns);
  }
};

module.exports = {
  MockRange, MockSheet
};
