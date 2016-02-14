const React = require('react');
const ReactCodeMirror = require('react-codemirror');

require('codemirror/mode/jsx/jsx');

class FactoredCodeEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  _getCode() {
    if (!this.props.factoredReactComponent) {
      return '';
    }

    return this.props.factoredReactComponent.toSource();
  }

  render() {
    return (
      <div>
        <div className="codeToolbar">
          <span className="codeToolbarTitle">Factored Code</span>
        </div>
        <ReactCodeMirror
          ref="codemirror"
          value={this._getCode()}
          options={{
            lineNumbers: false,
            mode: "jsx",
            readOnly: "nocursor"
          }}
        />
      </div>
    );
  }
}

module.exports = FactoredCodeEditor;
