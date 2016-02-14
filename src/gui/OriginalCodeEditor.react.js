const React = require('react');
const fs = require('fs');
const ReactCodeMirror = require('react-codemirror');
const jscodeshift = require('jscodeshift');

require('codemirror/mode/jsx/jsx');

class OriginalCodeEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      originalCode: '',
    };
    this._jsxElementsByLine = [];
  }

  componentWillMount() {
    fs.readFile(__dirname + '/../../examples/static-component-es6.react.js', 'utf8', (error, code) => {
      this._updateOriginalCode(code);
    });
  }

  _updateOriginalCode(code) {
    this.setState({
      originalCode: code
    });

    this._parseOriginalCode();
  }

  _parseOriginalCode() {
    this._jsxElementsByLine = [];

    jscodeshift(this.state.originalCode)
      .find(jscodeshift.JSXElement)
      .forEach((path) => {
        var node = path.node;
        var start = node.loc.start;
        var end = node.loc.end;

        // Add this node to the index on all lines it is present.
        // Unshift instead of push to make the closest scope available at
        // the head of the line index.
        // AST lines are 1-based.
        for (var line = start.line - 1; line < end.line; line++) {
          if (!this._jsxElementsByLine[line]) {
            this._jsxElementsByLine[line] = [];
          }
          this._jsxElementsByLine[line].unshift(node);
        }
      });
  }

  _hoverJSXElementAtCoordinates(x, y) {
    var codemirror = this._getCodeMirror();
    var position = codemirror.coordsChar({
      left: x,
      top: y
    });

    if (
      this._lastPosition &&
      this._lastPosition.line === position.line &&
      this._lastPosition.ch === position.ch
    ) {
      return;
    }
    this._lastPosition = position;

    var jsxElement = this._findJsxElementAtPosition(position.line, position.ch);
    this._hoverJSXElement(jsxElement);
  }

  _hoverJSXElement(jsxElement) {
    var codemirror = this._getCodeMirror();
    var marker = null;

    if (this.state.hoveredJsxElement == jsxElement) {
      return;
    }

    if (this.state.hoveredMarker) {
      this.state.hoveredMarker.clear();
    }

    if (jsxElement) {
      var marker = codemirror.markText(
        {line: jsxElement.loc.start.line-1, ch: jsxElement.loc.start.column},
        {line: jsxElement.loc.end.line-1, ch: jsxElement.loc.end.column},
        {className: 'jsxElementSelection'}
      );
    }

    if (this.props.onJsxElementHover) {
      this.props.onJsxElementHover(jsxElement);
    }

    this.setState({
      hoveredJsxElement: jsxElement,
      hoveredMarker: marker
    });
  }

  _findJsxElementAtPosition(line, column) {
    var jsxElementsAtLine = this._jsxElementsByLine[line];

    if (!jsxElementsAtLine) {
      return null;
    }

    for (var i = 0; i < jsxElementsAtLine.length; i++) {
      var jsxElement = jsxElementsAtLine[i];
      if (this._isJsxElementAtPosition(jsxElement, line, column)) {
        return jsxElement;
      }
    }
  }

  _isJsxElementAtPosition(jsxElement, line, column) {
    var startLine = jsxElement.loc.start.line-1;
    var startColumn = jsxElement.loc.start.column;
    var endLine = jsxElement.loc.end.line-1;
    var endColumn = jsxElement.loc.end.column;

    return (
      ((line === startLine && column >= startColumn) || line > startLine) &&
      ((line === endLine && column <= endColumn) || line < endLine)
    );
  }

  _getCodeMirror() {
    return this.refs.codemirror.getCodeMirror();
  }

  _onCodeMirrorMouseMove(event) {
    this._hoverJSXElementAtCoordinates(event.pageX, event.pageY);
  }

  render() {
    return (
      <div>
        <div className="codeToolbar">
          <span className="codeToolbarTitle">Your Code</span>
        </div>
        <div
          className="originalCodeEditor_selectionMode"
          onMouseMove={this._onCodeMirrorMouseMove.bind(this)}>
          <ReactCodeMirror
            ref="codemirror"
            value={this.state.originalCode}
            options={{
              lineNumbers: true,
              mode: "jsx",
              readOnly: "nocursor"
            }}
          />
        </div>
      </div>
    );
  }
}

module.exports = OriginalCodeEditor;
