const jscodeshift = require('jscodeshift');
const fs = require('fs');

const Templates = {
  'es6': 'Loaded at the end of this file'
};

class FactoredReactComponent {
  constructor(factoredElement, template) {
    this._originalAst = factoredElement.getAST();
    this._factoredJsxElement = factoredElement.nodes()[0];
    this._template = template;

    this._setRenderElement(this._factoredJsxElement);
    this._importRequires(this._factoredJsxElement);
    this._importDependenciesAsProps(this._factoredJsxElement);
  }

  _setRenderElement(jsxElement) {
    this._jscodeshift = jscodeshift(Templates[this._template]);
    this._jscodeshift
      .find(jscodeshift.MethodDefinition)
      .filter((path) => path.node.key.name === 'render')
      .find(jscodeshift.ReturnStatement)
      .map((path) => path.get('argument'))
      .replaceWith(jsxElement);
  }

  _importDependenciesAsProps(jsxElement) {
    var props = this._props = [];
    jscodeshift(jsxElement)
      .find(jscodeshift.JSXExpressionContainer)
      .replaceWith((path) => {
        var propName = 'prop' + (props.length + 1);
        props.push({
          name: propName,
          expression: path.node,
        });
        return jscodeshift.jsxExpressionContainer(
          jscodeshift.memberExpression(
            jscodeshift.memberExpression(
              jscodeshift.thisExpression(),
              jscodeshift.identifier("props")
            ),
            jscodeshift.identifier(propName)
          )
        );
      })
      .forEach((path, index) => {
        props[index].identifier = path.get('expression').get('property');
      });
  }

  _importRequires(jsxElement) {
    var elementNames = jscodeshift(jsxElement)
      .find(jscodeshift.JSXOpeningElement)
      .nodes()
      .map((node) => node.name.name);

    var requires = jscodeshift(this._originalAst)
      .find(jscodeshift.VariableDeclaration)
      .filter((path) => {
        return elementNames.indexOf(path.value.declarations[0].id.name) >= 0;
      })
      .nodes();

    this._jscodeshift
      .find(jscodeshift.VariableDeclaration)
      .filter((path) => path.value.declarations[0].id.name === 'React')
      .insertAfter(requires);

    //     jscodeshift.variableDeclaration(
    //       "const",
    //       [
    //         jscodeshift.variableDeclarator(
    //           jscodeshift.identifier("Image"),
    //           jscodeshift.callExpression(
    //             jscodeshift.identifier("require"),
    //             [
    //               jscodeshift.literal("Image.react")
    //             ]
    //           )
    //         )
    //       ]
    //     )
    //   );
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

  setName(name) {
    this._jscodeshift
      .find(jscodeshift.ClassDeclaration)
      .map((path) => path.get('id'))
      .replaceWith(jscodeshift.identifier(name));
  }

  getProps() {
    return this._props.map(prop => {
      return {
        name: prop.name,
        expression: prop.expression
      };
    });
  }

  setPropName(propIndex, name) {
    jscodeshift(this._props[propIndex].identifier)
      .replaceWith(jscodeshift.identifier(name));
  }

  toSource() {
    return this._jscodeshift.toSource();
  }
}

fs.readFile(__dirname + '/templates/react-class-es6.js', 'utf8', (error, code) => {
  Templates.es6 = code;
});

module.exports = FactoredReactComponent;
