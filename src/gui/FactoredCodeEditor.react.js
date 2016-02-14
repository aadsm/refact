const React = require('react');
const ReactCodeMirror = require('react-codemirror');

require('codemirror/mode/jsx/jsx');

class FactoredCodeEditor extends React.Component {
  render() {
    return (
      <div>
        <div className="codeToolbar">
          <span className="codeToolbarTitle">Factored Code</span>
        </div>
        <ReactCodeMirror
          ref="codemirror"
          value={this.props.factoredCode}
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
