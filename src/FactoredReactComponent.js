const jscodeshift = require('jscodeshift');
const fs = require('fs');

const Templates = {
  'es6': 'Loaded at the end of this file'
};

class FactoredReactComponent {
  constructor(ast, factoredJsxElement, template) {
    this._ast = ast;
    this._factoredJsxElement = factoredJsxElement;
    this._template = template;

    this.setRenderElement(factoredJsxElement);
  }

  setRenderElement(jsxElement) {
    this._jscodeshift = jscodeshift(Templates[this._template])
      .find(jscodeshift.MethodDefinition)
      .filter((path) => path.node.key.name === 'render')
      .find(jscodeshift.ReturnStatement)
      .map((path) => path.get('argument'))
      .replaceWith(jsxElement);
    return this;
  }

  toSource() {
    return this._jscodeshift.toSource();
  }
}

fs.readFile(__dirname + '/templates/react-class-es6.js', 'utf8', (error, code) => {
  Templates.es6 = code;
});

module.exports = FactoredReactComponent;
