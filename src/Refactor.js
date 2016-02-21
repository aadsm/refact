const jscodeshift = require('jscodeshift');
const fs = require('fs');
const FactoredReactComponent = require('./FactoredReactComponent');
const CodeIndexer = require('./CodeIndexer');

class Refactor {
  constructor(code) {
    this._code = code;
    this._jscodeshift = jscodeshift(code);
  }

  factorElementAt(line, column, template) {
    template = template || 'es6';
    return this.factorElement(
      new CodeIndexer(this._code).getElementAt(line, colum, template)
    );
  }

  factorElement(element, template) {
    var clonedElement = jscodeshift(this._code)
      .find(element.value.type)
      .filter((path) => path.value.start === element.node.start)

    return new FactoredReactComponent(clonedElement, template);
  }

  applyFactoredReactComponent(factoredReactComponent) {
    var jsxElement = (this._factoredElement && this._factoredElement.node) || factoredReactComponent.getFactoredJsxElement();
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
    this._jscodeshift = jscodeshift(this._jscodeshift.toSource());

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
