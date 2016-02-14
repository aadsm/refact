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
      refactor: new Refactor('')
    };
  }

  componentWillMount() {
    fs.readFile(__dirname + '/../../examples/static-component-es6.react.js', 'utf8', (error, code) => {
      this.setState({
        refactor: new Refactor(code)
      });
    });
  }

  _onJsxElementHover(jsxElement) {
    var factoredReactComponent = null;

    if (jsxElement) {
      factoredReactComponent = this.state.refactor.factorElement(jsxElement, 'es6');
    }

    this.setState({
      factoredReactComponent: factoredReactComponent
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
              refactor={this.state.refactor}
              onJsxElementHover={this._onJsxElementHover.bind(this)}
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
