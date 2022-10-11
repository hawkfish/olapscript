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
      .filter((row, rowid) => (that.row <= rowid + 1 && rowid + 1 < that.row + that.numRows))
      .map(row => row.filter((val, colid) => (that.column <= colid + 1  && colid + 1 < that.column + that.numCols)));
  }

  setValues(source) {
  	// Zero indexing as K&R intended...
  	const top = this.row - 1;
  	const left = this.column - 1;
  	const target = this.sheet.values;
  	source.forEach(function(source_row, rid) {
  		const target_row = target[top + rid];
  		source_row.forEach(function(source_cell, cid) {
				target_row[left + cid] = source_cell;
  		});
  	});
  }
};

class MockSheet {
  constructor(name, values) {
    this.name = name;
    this.values = values;
    this.lastRow = values.length;
    this.lastCol = values.length ? values[0].length : 0;
  }

	getMaxColumns() {
		return this.values[0] ? this.values[0].length : 0;
	}

	getMaxRows() {
		return this.values.length;
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
  	if (numRows < 1) {
  		throw Error("The number of rows in the range must be at least 1");
  	}
  	if (numColumns < 1) {
  		throw Error("The number of columns in the range must be at least 1");
  	}

    return new MockRange(this, row, column, numRows, numColumns);
  }

	clearContents() {
		this.values = this.values.map(row => row.map(cell => ""));
		return this;
	}

  insertColumnsAfter(afterPosition, howMany) {
  	if (howMany > 0) {
  		this.values.forEach(function(row) {
  			const inserted = new Array(howMany).fill("");
  			row.splice(afterPosition - 1, 0, ...inserted);
  			console.log("insertColumnsAfter = ", row);
  		});
  		this.lastCol += howMany;
  	}
		return this;
  }

  insertRowsAfter(afterPosition, howMany) {
  	if (howMany > 0) {
  		const nCols = this.getMaxColumns();
  		const inserted = new Array(howMany).fill(null).map(() => new Array(nCols).fill(""));
  		this.values.splice(afterPosition - 1, 0, ...inserted);
  		this.lastRow += howMany;
  	}
		return this;
  }
};

module.exports = {
  MockRange, MockSheet
};
