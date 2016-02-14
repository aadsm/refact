const React = require('react');
const fs = require('fs');
const ReactCodeMirror = require('react-codemirror');
const jscodeshift = require('jscodeshift');

require('codemirror/mode/jsx/jsx');

class OriginalCodeEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this._jsxElementsByLine = [];
  }

  _hoverJsxElementAtCoordinates(x, y) {
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

    var jsxElement = this.props.refactor.getElementAt(position.line, position.ch);
    this._hoverJsxElement(jsxElement);
  }

  _hoverJsxElement(jsxElement) {
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

  _startRefactoring(jsxElement) {

  }

  _getCodeMirror() {
    return this.refs.codemirror.getCodeMirror();
  }

  _onCodeMirrorMouseMove(event) {
    this._hoverJsxElementAtCoordinates(event.pageX, event.pageY);
  }

  _onCodeMirrorClick(event) {
    if (!this.state.hoveredJsxElement) {
      return;
    }

    this._startRefactoring(this.state.hoveredJsxElement);
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
            value={this.props.refactor.toSource()}
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
