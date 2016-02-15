const React = require('react');
const fs = require('fs');
const ReactCodeMirror = require('react-codemirror');
const jscodeshift = require('jscodeshift');

require('codemirror/mode/jsx/jsx');

class OriginalCodeEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      readOnly: 'nocursor'
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.source !== this.props.source) {
      var codemirror = this._getCodeMirror();
      var scrollInfo = codemirror.getScrollInfo();
      codemirror.setValue(nextProps.source);
      // Keep scroll position at the same level when the document changes
      // during element editing.
      if (nextProps.mode === 'editElement') {
        codemirror.scrollIntoView({
          left: scrollInfo.left,
          top: scrollInfo.top,
          bottom: scrollInfo.top + scrollInfo.height,
          right: scrollInfo.left + scrollInfo.width
        });
      }
    }

    if (nextProps.editElement !== this.props.editElement) {
      this._editElement(nextProps.editElement);
    }
  }

  _editElement(element) {
    if (!element) {
      this._editElementMarkers.map((marker) => marker.clear());
      this._editElementMarkers = null;
      return;
    }

    var editableNames = element.node.openingElement.attributes.map((attr) => {
      return attr.name;
    });
    editableNames.push(element.node.openingElement.name);

    var codemirror = this._getCodeMirror();
    this._editElementMarkers = editableNames.map((name) =>
      codemirror.markText(
        {line: name.loc.start.line-1, ch: name.loc.start.column},
        {line: name.loc.end.line-1, ch: name.loc.end.column},
        {
          className: 'editableText',
          inclusiveLeft: true,
          inclusiveRight: true,
          clearWhenEmpty: false
        }
      )
    );
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
    if (this.state.isEditingText) {
      this._stopEditingText();
    } else if (this.props.mode === 'elementSelection') {
      this._selectElement(this.state.hoveredElement);
    } else if (this.props.mode === 'editElement') {
      var element = this._getElementAtCoordinates(event.pageX, event.pageY);
      if (!element || element.node !== this.props.editElement.node) {
        return;
      }
      var elementName = element.value.openingElement.name;
      this._editRange(elementName.loc.start, elementName.loc.end);
    }
  }

  _stopEditingText() {
    this._readOnlyMarks.forEach(mark => mark.clear());
    this._readOnlyMarks = null;
    this.state.editingTextMark.clear();

    this.setState({
      isEditingText: false,
      editingTextMark: null,
      readOnly: 'nocursor'
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
      isEditingText: true,
      readOnly: false,
      editingTextMark: editingTextMark
    });
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   if (nextState.isEditingText) {
  //     return false;
  //   } else {
  //     return true;
  //   }
  // }

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
          className={[
            this.props.mode === 'elementSelection'
              ? 'originalCodeEditor_selectionMode'
              : '',
            this.props.mode === 'editElement'
              ? 'originalCodeEditor_editElementMode'
              : '',
          ].join(' ')}
          onMouseMove={this._onCodeMirrorMouseMove.bind(this)}
          onMouseDown={this._onCodeMirrorClick.bind(this)}>
          <ReactCodeMirror
            ref="codemirror"
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
