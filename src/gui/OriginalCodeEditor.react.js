const React = require('react');
const fs = require('fs');
const ReactCodeMirror = require('react-codemirror');
const jscodeshift = require('jscodeshift');
const CodeIndexer = require('../CodeIndexer');

require('codemirror/mode/jsx/jsx');

class OriginalCodeEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      readOnly: 'nocursor',
      codeIndexer: new CodeIndexer(this.props.source),
      selectElementState: {},
    };

    this._onEditingElementNameChange = this._onEditingElementNameChange.bind(this);
    this._onEditingElementAttributeNameChange = this._onEditingElementAttributeNameChange.bind(this);
    this._ignoreCodeMirrorMouseDownOutsideEditText = this._ignoreCodeMirrorMouseDownOutsideEditText.bind(this);
    this._handleEditingTextSelection = this._handleEditingTextSelection.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.isEditingText) {
      return;
    }

    if (nextProps.source !== this.props.source) {
      this._updateCodeMirrorText(nextProps.source);
    }

    if (nextProps.editElement !== this.props.editElement) {
      this._editElement(nextProps.editElement);
    }

    if (nextProps.mode === 'selectElement') {
      this.setState({
        readOnly: 'nocursor'
      });
    }
  }

  _highlightElementAtCoordinates(x, y) {
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

    var element = this.state.codeIndexer.getElementAt(position.line, position.ch);
    this._highlightElement(element);
  }

  _highlightElement(element) {
    var codemirror = this._getCodeMirror();
    var textMark = null;
    var selectElementState = this.state.selectElementState;

    if (selectElementState.element == element) {
      return;
    }

    if (selectElementState.textMark) {
      selectElementState.textMark.clear();
    }

    if (element) {
      var jsxElement = element.node;
      textMark = codemirror.markText(
        {line: jsxElement.loc.start.line-1, ch: jsxElement.loc.start.column},
        {line: jsxElement.loc.end.line-1, ch: jsxElement.loc.end.column},
        {className: 'elementHover'}
      );
    }

    if (this.props.modeConfig.onElementHighlight) {
      this.props.modeConfig.onElementHighlight(element);
    }

    this.setState({
      selectElementState: {
        element: element,
        textMark: textMark,
      },
    });
  }

  _selectElement(element) {
    if (!element) {
      return;
    }

    if (this.props.modeConfig.onElementSelect) {
      this.props.modeConfig.onElementSelect(element);
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
    return this.state.codeIndexer.getElementAt(position.line, position.ch);
  }

  _getAttributeAtCoordinates(x, y) {
    var codemirror = this._getCodeMirror();
    var position = codemirror.coordsChar({
      left: x,
      top: y
    });
    return this.state.codeIndexer.getAttributeAt(position.line, position.ch);
  }

  _startEditingElementAtCoordinates(x, y) {
    var element = this._getElementAtCoordinates(x, y);
    if (!element || element.node.start !== this.props.editElement.node.start) {
      return;
    }

    var attribute = this._getAttributeAtCoordinates(x, y);
    var nodeName;
    var onChange;

    if (attribute) {
      nodeName = attribute.value.name;
      onChange = this._onEditingElementAttributeNameChange;
      var attributeIndex =
        attribute.parent.value.attributes.indexOf(attribute.value);
      this.setState({editingAttributeIndex: attributeIndex});
    } else {
      nodeName = element.value.openingElement.name;
      onChange = this._onEditingElementNameChange;
    }

    this._editRange(nodeName.loc.start, nodeName.loc.end, onChange);
  }

  _stopEditingText() {
    var codemirror = this._getCodeMirror();
    var editingTextPosition = this.state.editingTextMark.find();

    this._readOnlyMarks.forEach(mark => mark.clear());
    this._readOnlyMarks = null;
    this.state.editingTextMark.clear();
    if (this._editingTextSelectionMark) {
      this._editingTextSelectionMark.clear();
      this._editingTextSelectionMark = null;
    }
    // clear selection
    codemirror.setCursor({line: editingTextPosition.from.line, ch: editingTextPosition.from.ch});

    codemirror.off('change', this.state.onEditingTextChange);
    codemirror.off('mousedown', this._ignoreCodeMirrorMouseDownOutsideEditText);
    codemirror.off('beforeSelectionChange', this._handleEditingTextSelection);

    this.setState({
      codeIndexer: new CodeIndexer(this.props.source),
      isEditingText: false,
      editingTextMark: null,
      readOnly: 'nocursor'
    });
  }

  _editRange(start, end, onChange) {
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

    codemirror.on('change', onChange);
    codemirror.on('mousedown', this._ignoreCodeMirrorMouseDownOutsideEditText);
    codemirror.on('beforeSelectionChange', this._handleEditingTextSelection);

    this.setState({
      isEditingText: true,
      readOnly: false,
      editingTextMark: editingTextMark,
      onEditingTextChange: onChange
    });
  }

  _handleEditingTextSelection(codemirror, handles) {
    var range = handles.ranges[0];
    var line = range.anchor.line;
    var start = Math.min(range.anchor.ch, range.head.ch);
    var end = Math.max(range.anchor.ch, range.head.ch);

    if (this._editingTextSelectionMark) {
      this._editingTextSelectionMark.clear();
      this._editingTextSelectionMark = null;
    }

    if (start === end) {
      return;
    }

    this._editingTextSelectionMark = codemirror.markText(
      {line: line, ch: start},
      {line: line, ch: end},
      {className: 'editTextSelected'}
    );
  }

  _ignoreCodeMirrorMouseDownOutsideEditText(codemirror, event) {
    if (this._isMouseEventInTextMark(event, this.state.editingTextMark)) {
      event.codemirrorIgnore = true;
    }
  }

  _isMouseEventInTextMark(event, mark) {
    var codemirror = this._getCodeMirror();
    var position = codemirror.coordsChar(event.pageX, event.pageY);
    var markPosition = mark.find();
    return (
      position.line !== markPosition.from.line ||
      position.ch < markPosition.from.ch || position.ch > markPosition.to.ch
    );
  }

  _onEditingElementNameChange() {
    if (this.props.onElementNameChange) {
      this.props.onElementNameChange(this._getEditingText());
    }
  }

  _onEditingElementAttributeNameChange() {
    if (this.props.onElementAttributeNameChange) {
      this.props.onElementAttributeNameChange(
        this.state.editingAttributeIndex,
        this._getEditingText()
      );
    }
  }

  _onCopyClick() {
    var root = document.body;
    var textarea = document.createElement('textarea');

    root.appendChild(textarea);
    textarea.value = this._getCodeMirror().getValue();
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (e) { console.error(e) }
    root.removeChild(textarea);
  }

  _getEditingText() {
    var textPosition = this.state.editingTextMark.find();
    var lineText =
      this._getCodeMirror().getDoc().getLine(textPosition.from.line);
    return lineText.slice(textPosition.from.ch, textPosition.to.ch);
  }

  _getCodeMirror() {
    return this.refs.codemirror.getCodeMirror();
  }

  _updateCodeMirrorText(source) {
    var codemirror = this._getCodeMirror();
    var scrollInfo = codemirror.getScrollInfo();
    codemirror.setValue(source);
    codemirror.scrollIntoView({
      left: scrollInfo.left,
      top: scrollInfo.top,
      bottom: scrollInfo.top + scrollInfo.height,
      right: scrollInfo.left + scrollInfo.width
    });

    this.setState({
      codeIndexer: new CodeIndexer(source)
    });
  }

  _onCodeMirrorMouseMove(event) {
    if (this.props.mode === 'selectElement') {
      this._highlightElementAtCoordinates(event.pageX, event.pageY);
    }
  }

  _onCodeMirrorClick(event) {
    if (this.state.isEditingText) {
      this._stopEditingText();
      return;
    }

    if (this.props.mode === 'selectElement') {
      this._selectElement(this.state.selectElementState.element);
    } else if (this.props.mode === 'editElement') {
      this._startEditingElementAtCoordinates(event.pageX, event.pageY);
    }
  }

  _getClassName() {
    if (this.props.mode === 'selectElement') {
      return 'originalCodeEditor_selectElementMode';
    } else if (this.props.mode == 'editElement') {
      'originalCodeEditor_editElementMode';
    }
  }

  render() {
    return (
      <div>
        <div className="codeToolbar">
          <span className="codeToolbarTitle">Your Code</span>
          <span className="codeToolbarAction" onClick={this._onCopyClick.bind(this)}>copy</span>
        </div>
        <div
          className={this._getClassName()}
          onMouseMove={this._onCodeMirrorMouseMove.bind(this)}
          onMouseDownCapture={this._onCodeMirrorClick.bind(this)}>
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
