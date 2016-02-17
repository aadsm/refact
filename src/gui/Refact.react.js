const React = require('react');
const fs = require('fs');
const OriginalCodeEditor = require('./OriginalCodeEditor.react');
const FactoredCodeEditor = require('./FactoredCodeEditor.react');
const Refactor = require('../Refactor');
const FactoredReactComponent = require('../FactoredReactComponent');

class Refact extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      refactor: new Refactor(''),
      originalCodeEditorMode: 'elementSelection',
      example: 'expressions'
    };
  }

  componentWillMount() {
    this._loadExample(this.state.example)
  }

  _loadExample(example) {
    this._getExampleCode(example, (code) => {
      this.setState({
        originalCode: code,
        refactor: new Refactor(code)
      })
    });
  }

  _getExampleCode(example, callback) {
    if (example === 'simple') {
      fs.readFile(__dirname + '/../../examples/simple-es6.react.js', 'utf8', (error, code) => callback(code));
    } else if (example === 'composition') {
      fs.readFile(__dirname + '/../../examples/composition-es6.react.js', 'utf8', (error, code) => callback(code));
    } else if (example === 'expressions') {
      fs.readFile(__dirname + '/../../examples/expressions-es6.react.js', 'utf8', (error, code) => callback(code));
    }
  }

  _onElementHover(element) {
    var factoredReactComponent = null;

    if (element) {
      factoredReactComponent = this.state.refactor.factorElement(element, 'es6');
    }

    this.setState({
      factoredReactComponent: factoredReactComponent
    });
  }

  _onElementClick(element) {
    var factoredReactComponent = this.state.refactor.factorElement(element, 'es6');
    this.state.refactor.applyFactoredReactComponent(factoredReactComponent);

    this.setState({
      refactor: this.state.refactor,
      factoredReactComponent: factoredReactComponent,
      originalCodeEditorMode: 'editElement'
    });
  }

  _onElementNameChange(name) {
    this.state.factoredReactComponent.setName(name);
    this.state.refactor.applyFactoredReactComponent(this.state.factoredReactComponent);
    this.setState({factoredReactComponent: this.state.factoredReactComponent});
  }

  _onElementAttributeNameChange(attributeIndex, name) {
    this.state.factoredReactComponent.setPropName(attributeIndex, name);
    this.state.refactor.applyFactoredReactComponent(this.state.factoredReactComponent);
    this.setState({factoredReactComponent: this.state.factoredReactComponent});
  }

  _onExampleChange(event) {
    this._loadExample(event.target.value);
  }

  _onOriginalCodeChange(value) {

  }

  _editCode() {
    this.setState({
      refactor: new Refactor(this.state.originalCode),
      originalCodeEditorMode: 'edit',
      factoredReactComponent: null
    });
  }

  _elementSelection() {
    this.setState({
      refactor: new Refactor(this.state.originalCode),
      factoredReactComponent: null,
      originalCodeEditorMode: 'elementSelection'
    });
  }

  _renderInstructions() {
    var instructions = [];

    if (this.state.originalCodeEditorMode === 'edit') {
      instructions.push(
        <li key="edit">Edit your code.</li>,
        <li
          key="factor"
          className="clickableItem"
          onClick={this._elementSelection.bind(this)}>
          Click here to select an element to factor out.
        </li>
      );
    } else if (this.state.originalCodeEditorMode === 'elementSelection') {
      instructions.push(
        <li key="hover">
          Hover react elements in your code to find refactable elements.
        </li>,
        <li key="clickToStart">
          Click the one you want to initiate the refactor.
        </li>
      );
    } else if (this.state.originalCodeEditorMode === 'editElement') {
      instructions.push(
        <li key="clickName">
          Click on the underlined component name to edit it.
        </li>,
        <li key="clickAttribute">
          Click on the underlined component prop names to edit them.
        </li>
      );
    }

    return (
      <span className="instructions">
        <ol>{instructions}</ol>
      </span>
    );
  }

  _renderOptions() {
    var options = [];
    if (this.state.originalCodeEditorMode === 'edit') {
      options.push(
        <li key="selectExample">
          Select an example:
          &nbsp;
          <select onChange={this._onExampleChange.bind(this)}>
            <option>--</option>
            <option value="simple">Simple Component (ES6)</option>
            <option value="composition">Composition Component (ES6)</option>
            <option value="expressions">Expressions Component (ES6)</option>
          </select>
        </li>
      );
    } else if (this.state.originalCodeEditorMode === 'elementSelection') {
      options.push(
        <li
          key="editCode"
          className="clickableItem"
          onClick={this._editCode.bind(this)}>
          Click here to edit your code
        </li>
      );
    } else if (this.state.originalCodeEditorMode === 'editElement') {
      options.push(
        <li
          key="elementSelection"
          className="clickableItem"
          onClick={this._elementSelection.bind(this)}>
          Choose a different element to factor
        </li>,
        <li
          key="cancelAndEditCode"
          className="clickableItem"
          onClick={this._editCode.bind(this)}>
          Cancel everything and edit your code
        </li>
      );
    }

    return (
      <span className="options">
        <ul>{options}</ul>
      </span>
    );
  }

  _getVisualInstructionSrc() {
    if (this.state.originalCodeEditorMode === 'elementSelection') {
      return "images/hover-element.gif";
    }
  }

  render() {
    return (
      <div>
        <div className="refactHeader">
          <span className="logo">Refact</span>
          {this._renderInstructions()}
          <span className="refactHeaderOr">
            -or-
          </span>
          {this._renderOptions()}
          {/*
            <img
              className="visualInstruction"
              src={this._getVisualInstructionSrc()}
            />
          */}

        </div>
        <div className="refactMainArea">
          <div className="originalCodeArea">
            <OriginalCodeEditor
              source={this.state.refactor.toSource()}
              refactor={this.state.refactor}
              editElement={this.state.refactor.getFactoredElement()}
              mode={this.state.originalCodeEditorMode}
              onElementHover={this._onElementHover.bind(this)}
              onElementClick={this._onElementClick.bind(this)}
              onChange={this._onOriginalCodeChange.bind(this)}
              onElementNameChange={this._onElementNameChange.bind(this)}
              onElementAttributeNameChange={
                this._onElementAttributeNameChange.bind(this)
              }
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
