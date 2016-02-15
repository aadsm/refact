const React = require('react');
const fs = require('fs');
const OriginalCodeEditor = require('./OriginalCodeEditor.react');
const FactoredCodeEditor = require('./FactoredCodeEditor.react');
const jscodeshift = require('jscodeshift');
const Refactor = require('../Refactor');
const FactoredReactComponent = require('../FactoredReactComponent');

class Refact extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      refactor: new Refactor(''),
      originalCodeEditorMode: 'elementSelection'
    };
  }

  componentWillMount() {
    //fs.readFile(__dirname + '/../../examples/static-component-es6.react.js', 'utf8', (error, code) => {
    fs.readFile(__dirname + '/../../examples/expr-component-es6.react.js', 'utf8', (error, code) => {
      this.setState({
        originalCode: code,
        refactor: new Refactor(code)
      });
    });
  }

  _onElementHover(element) {
    var factoredReactComponent = null;

    if (element) {
      factoredReactComponent = this.state.refactor.factorElement(element, 'es6');
    }

    this.setState({
      factoredReactComponent: factoredReactComponent
    });
  }

  _onElementClick(element) {
    var factoredReactComponent = this.state.refactor.factorElement(element, 'es6');
    this.state.refactor.applyFactoredReactComponent(factoredReactComponent);

    this.setState({
      refactor: this.state.refactor,
      factoredReactComponent: factoredReactComponent,
      originalCodeEditorMode: 'editElement'
    });
  }

  render() {
    return (
      <div>
        <div className="refactHeader">
          <span className="logo">Refact</span>
          <span className="instructions">
            <ol>
              <li>Hover react elements in your code to find refactable elements.</li>
              <li>Click the one you want to initiate the refactor.</li>
            </ol>
          </span>
        </div>
        <div className="refactMainArea">
          <div className="originalCodeArea">
            <OriginalCodeEditor
              source={this.state.refactor.toSource()}
              refactor={this.state.refactor}
              editElement={this.state.refactor.getFactoredElement()}
              mode={this.state.originalCodeEditorMode}
              onElementHover={this._onElementHover.bind(this)}
              onElementClick={this._onElementClick.bind(this)}
            />
          </div>
        </div>
        <div className="refactMainArea">
          <div className="factoredCodeArea">
            <FactoredCodeEditor
              factoredReactComponent={this.state.factoredReactComponent}
            />
          </div>
        </div>
      </div>
    );
  }
}

module.exports = Refact;
