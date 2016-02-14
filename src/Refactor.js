const jscodeshift = require('jscodeshift');
const fs = require('fs');
const FactoredReactComponent = require('./FactoredReactComponent');

class Refactor {
  constructor(code) {
    this._code = code;
    this._jsxElementsByLine = [];
    this._parseCode(code);
  }

  _parseCode(code) {
    this._jscodeshift = jscodeshift(code);
    this._jscodeshift
      .find(jscodeshift.JSXElement)
      .forEach((path) => {
        var node = path.node;
        var start = node.loc.start;
        var end = node.loc.end;

        // Add this node to the index on all lines it is present.
        // Unshift instead of push to make the closest scope available at
        // the head of the line index.
        // AST lines are 1-based.
        for (var line = start.line - 1; line < end.line; line++) {
          if (!this._jsxElementsByLine[line]) {
            this._jsxElementsByLine[line] = [];
          }
          this._jsxElementsByLine[line].unshift(node);
        }
      });
  }

  getElementAt(line, column) {
    var jsxElementsAtLine = this._jsxElementsByLine[line];

    if (!jsxElementsAtLine) {
      return null;
    }

    for (var i = 0; i < jsxElementsAtLine.length; i++) {
      var jsxElement = jsxElementsAtLine[i];
      if (this._isJsxElementAtPosition(jsxElement, line, column)) {
        return jsxElement;
      }
    }
  }

  _isJsxElementAtPosition(jsxElement, line, column) {
    var startLine = jsxElement.loc.start.line-1;
    var startColumn = jsxElement.loc.start.column;
    var endLine = jsxElement.loc.end.line-1;
    var endColumn = jsxElement.loc.end.column;

    return (
      ((line === startLine && column >= startColumn) || line > startLine) &&
      ((line === endLine && column <= endColumn) || line < endLine)
    );
  }

  factorElementAt(line, column, template) {
    var element = this.getElementAt(line, column);
    return this.factorElement(element);
  }

  factorElement(element, template) {
    return (
      new FactoredReactComponent(this._jscodeshift.getAST(), element, template)
    );
  }

  applyFactoredReactComponent(factoredReactComponent) {

  }

  toSource() {
    return this._jscodeshift.toSource();
  }
}

module.exports = Refactor;
