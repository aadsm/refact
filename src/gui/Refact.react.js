const React = require('react');
const fs = require('fs');
const OriginalCodeEditor = require('./OriginalCodeEditor.react');
const FactoredCodeEditor = require('./FactoredCodeEditor.react');
const jscodeshift = require('jscodeshift');

class Refact extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      factoredTemplate: '',
      factoredCode: ''
    };
  }

  componentWillMount() {
    fs.readFile(__dirname + '/../templates/react-class-es6.js', 'utf8', (error, code) => {
      this.setState({
        factoredTemplate: code
      });
    });
  }

  _onJsxElementHover(jsxElement) {
    var factoredCode = '';

    if (jsxElement) {
      factoredCode = jscodeshift(this.state.factoredTemplate)
        .find(jscodeshift.MethodDefinition)
        .filter((path) => path.node.key.name === 'render')
        .find(jscodeshift.ReturnStatement)
        .map((path) => path.get('argument'))
        .replaceWith(jsxElement)
        .toSource();
    }

    this.setState({
      factoredCode: factoredCode
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
              onJsxElementHover={this._onJsxElementHover.bind(this)}
            />
          </div>
        </div>
        <div className="refactMainArea">
          <div className="factoredCodeArea">
            <FactoredCodeEditor
              factoredCode={this.state.factoredCode}
            />
          </div>
        </div>
      </div>
    );
  }
}

module.exports = Refact;
