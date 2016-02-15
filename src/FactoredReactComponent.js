const jscodeshift = require('jscodeshift');
const fs = require('fs');

const Templates = {
  'es6': 'Loaded at the end of this file'
};

class FactoredReactComponent {
  constructor(ast, factoredJsxElement, template) {
    this._originalAst = ast;
    this._factoredJsxElement = factoredJsxElement;
    this._template = template;

    this._setRenderElement(factoredJsxElement);
  }

  _setRenderElement(jsxElement) {
    this._jscodeshift = jscodeshift(Templates[this._template]);
    this._jscodeshift
      .find(jscodeshift.MethodDefinition)
      .filter((path) => path.node.key.name === 'render')
      .find(jscodeshift.ReturnStatement)
      .map((path) => path.get('argument'))
      .replaceWith(jsxElement);
    return this;
  }

  getFactoredJsxElement() {
    return this._factoredJsxElement;
  }

  getName() {
    return this._jscodeshift
      .find(jscodeshift.ClassDeclaration)
      .map((path) => path.get('id').get('name'))
      .nodes()[0];
  }

  toSource() {
    return this._jscodeshift.toSource();
  }
}

fs.readFile(__dirname + '/templates/react-class-es6.js', 'utf8', (error, code) => {
  Templates.es6 = code;
});

module.exports = FactoredReactComponent;
