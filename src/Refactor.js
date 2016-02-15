const jscodeshift = require('jscodeshift');
const fs = require('fs');
const FactoredReactComponent = require('./FactoredReactComponent');

class Refactor {
  constructor(code) {
    this._elementsByLine = [];
    this._parseCode(code);
  }

  _parseCode(code) {
    this._code = code;
    this._jscodeshift = jscodeshift(code);
    this._updateElementsIndex();
  }

  _updateElementsIndex() {
    this._elementsByLine = [];
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
          if (!this._elementsByLine[line]) {
            this._elementsByLine[line] = [];
          }
          this._elementsByLine[line].unshift(path);
        }
      });
  }

  getElementAt(line, column) {
    var elementsAtLine = this._elementsByLine[line];

    if (!elementsAtLine) {
      return null;
    }

    for (var i = 0; i < elementsAtLine.length; i++) {
      var element = elementsAtLine[i];
      if (this._isElementAtPosition(element, line, column)) {
        return element;
      }
    }
  }

  _isElementAtPosition(element, line, column) {
    var loc = element.node.loc;
    if (!loc) {
      return false;
    }
    var startLine = loc.start.line-1;
    var startColumn = loc.start.column;
    var endLine = loc.end.line-1;
    var endColumn = loc.end.column;

    return (
      ((line === startLine && column >= startColumn) || line > startLine) &&
      ((line === endLine && column <= endColumn) || line < endLine)
    );
  }

  factorElementAt(line, column, template) {
    var element = this.getElementAt(line, column);
    return this.factorElement(element, template);
  }

  factorElement(element, template) {
    var clonedElement = jscodeshift(this._code)
      .find(element.value.type)
      .filter((path) => path.value.start === element.node.start)

    return new FactoredReactComponent(clonedElement, template);
  }

  applyFactoredReactComponent(factoredReactComponent) {
    var jsxElement = this._factoredElement || factoredReactComponent.getFactoredJsxElement();
    var props = factoredReactComponent.getProps();

    var newJsxElementAttributes = props.map((prop) => {
      return jscodeshift.jsxAttribute(
        jscodeshift.jsxIdentifier(prop.name),
        prop.expression
      );
    });

    var newJsxElement =
      jscodeshift.jsxElement(
        jscodeshift.jsxOpeningElement(
          jscodeshift.jsxIdentifier(factoredReactComponent.getName()),
          newJsxElementAttributes,
          true
        )
      );

    // Replace factored code with new component.
    this._jscodeshift
      .find(jscodeshift.JSXElement)
      .filter((path) => {
        return (
          path.node.start === jsxElement.start &&
          path.node.end === jsxElement.end
        );
      })
      .replaceWith(newJsxElement);

    // Reparse to get Ast with locations in all nodes.
    this._parseCode(this._jscodeshift.toSource());

    // Find the newJsxElement in the new AST.
    newJsxElement = this._jscodeshift
      .find(jscodeshift.JSXElement)
      .filter((path) => path.node.start === jsxElement.start)
      .paths()[0];

    this._factoredElement = newJsxElement;
    return this;
  }

  getFactoredElement() {
    return this._factoredElement;
  }

  toSource() {
    return this._jscodeshift.toSource();
  }
}

module.exports = Refactor;
