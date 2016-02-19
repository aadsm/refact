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

  _onCopyClick() {
    var root = document.body;
    var textarea = document.createElement('textarea');

    root.appendChild(textarea);
    textarea.value = this.refs.codemirror.getCodeMirror().getValue();
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (e) { console.error(e) }
    root.removeChild(textarea);
  }

  render() {
    return (
      <div>
        <div className="codeToolbar">
          <span className="codeToolbarTitle">Factored Code</span>
          <span className="codeToolbarAction" onClick={this._onCopyClick.bind(this)}>copy</span>
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
