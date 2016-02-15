const React = require('react');
const fs = require('fs');
const ReactCodeMirror = require('react-codemirror');
const jscodeshift = require('jscodeshift');

require('codemirror/mode/jsx/jsx');

class OriginalCodeEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      readOnly: 'cursor'
    };
  }

  _getElementAtCoordinates(x, y) {
    var codemirror = this._getCodeMirror();
    var position = codemirror.coordsChar({
      left: x,
      top: y
    });
    return this.props.refactor.getElementAt(position.line, position.ch);
  }

  _hoverElementAtCoordinates(x, y) {
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

    var element = this.props.refactor.getElementAt(position.line, position.ch);
    this._hoverElement(element);
  }

  _hoverElement(element) {
    var codemirror = this._getCodeMirror();
    var marker = null;

    if (this.state.hoveredElement == element) {
      return;
    }

    if (this.state.hoveredMarker) {
      this.state.hoveredMarker.clear();
    }

    if (element) {
      var jsxElement = element.node;
      var marker = codemirror.markText(
        {line: jsxElement.loc.start.line-1, ch: jsxElement.loc.start.column},
        {line: jsxElement.loc.end.line-1, ch: jsxElement.loc.end.column},
        {className: 'elementSelection'}
      );
    }

    if (this.props.onElementHover) {
      this.props.onElementHover(element);
    }

    this.setState({
      hoveredElement: element,
      hoveredMarker: marker
    });
  }

  _getCodeMirror() {
    return this.refs.codemirror.getCodeMirror();
  }

  _onCodeMirrorMouseMove(event) {
    if (this.props.mode === 'elementSelection') {
      this._hoverElementAtCoordinates(event.pageX, event.pageY);
    }
  }

  _onCodeMirrorClick(event) {
    if (this.state.editing) {
      return;
    }

    if (this.state.isEditing) {
      this._stopEditing();
    } else if (this.props.mode === 'elementSelection') {
      this._selectElement(this.state.hoveredElement);
    } else if (this.props.mode === 'editElement') {
      var element = this._getElementAtCoordinates(event.pageX, event.pageY);
      var elementName = element.value.openingElement.name;
      this._editRange(elementName.loc.start, elementName.loc.end);
    }
  }

  _stopEditing() {
    this._readOnlyMarks.forEach(mark => mark.clear());
    this._readOnlyMarks = null;
    this.state.editingTextMark.clear();

    this.setState({
      isEditing: false,
      editingTextMark: null
    });
  }

  _editRange(start, end) {
    var codemirror = this._getCodeMirror();
    var lastLineHandle = codemirror.getLineHandle(codemirror.lastLine());

    this._readOnlyMarks = [
      codemirror.markText(
        {line: 0, ch: 0},
        {line: start.line-1, ch: start.column},
        {readOnly: true, atomic: true}
      ),
      codemirror.markText(
        {line: end.line-1, ch: end.column},
        {line: codemirror.lastLine(), ch: lastLineHandle.text.length},
        {readOnly: true, atomic: true}
      )
    ];
    var editingTextMark = codemirror.markText(
      {line: start.line-1, ch: start.column},
      {line: end.line-1, ch: end.column},
      {
        className: 'editText',
        startStyle: 'startEditText',
        endStyle: 'endEditText',
        inclusiveLeft: true,
        inclusiveRight: true,
        clearWhenEmpty: false
      }
    );

    this.setState({
      isEditing: true,
      readOnly: false,
      editingTextMark: editingTextMark
    });
  }

  _selectElement(element) {
    if (!element) {
      return;
    }

    if (this.props.onElementClick) {
      this.props.onElementClick(element);
    }
  }

  render() {
    return (
      <div>
        <div className="codeToolbar">
          <span className="codeToolbarTitle">Your Code</span>
        </div>
        <div
          className="originalCodeEditor_selectionMode"
          onMouseMove={this._onCodeMirrorMouseMove.bind(this)}
          onClick={this._onCodeMirrorClick.bind(this)}>
          <ReactCodeMirror
            ref="codemirror"
            value={this.props.refactor.toSource()}
            options={{
              lineNumbers: true,
              mode: "jsx",
              readOnly: this.state.readOnly
            }}
          />
        </div>
      </div>
    );
  }
}

module.exports = OriginalCodeEditor;
