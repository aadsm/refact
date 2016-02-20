const jscodeshift = require('jscodeshift');

class CodeIndexer {
  constructor(code) {
    this._parseCode(code);
  }

  _parseCode(code) {
    this._code = code;
    this._jscodeshift = jscodeshift(code);
    this._indexedNodesByType = {};
    this._indexNodeType('element', jscodeshift.JSXElement);
    this._indexNodeType('attribute', jscodeshift.JSXAttribute);
  }

  _indexNodeType(name, nodeType) {
    var indexedNode = this._indexedNodesByType[name] = [];
    this._jscodeshift
      .find(nodeType)
      .forEach((path) => {
        var node = path.node;
        var start = node.loc.start;
        var end = node.loc.end;

        // Add this node to the index on all lines it is present.
        // Unshift instead of push to make the closest scope available at
        // the head of the line index.
        // AST lines are 1-based.
        for (var line = start.line - 1; line < end.line; line++) {
          if (!indexedNode[line]) {
            indexedNode[line] = [];
          }
          indexedNode[line].unshift(path);
        }
      });
  }

  _getNodeAt(name, line, column) {
    var nodesAtLine = this._indexedNodesByType[name][line];

    if (!nodesAtLine) {
      return null;
    }

    for (var i = 0; i < nodesAtLine.length; i++) {
      var node = nodesAtLine[i];
      if (this._isNodeAtPosition(node, line, column)) {
        return node;
      }
    }
  }

  _isNodeAtPosition(element, line, column) {
    var loc = element.node.loc;
    if (!loc) {
      return false;
    }
    var startLine = loc.start.line-1;
    var startColumn = loc.start.column;
    var endLine = loc.end.line-1;
    var endColumn = loc.end.column;

    return (
      ((line === startLine && column >= startColumn) || line > startLine) &&
      ((line === endLine && column <= endColumn) || line < endLine)
    );
  }


  getElementAt(line, column) {
    return this._getNodeAt('element', line, column);
  }

  getAttributeAt(line, column) {
    return this._getNodeAt('attribute', line, column);
  }
}

module.exports = CodeIndexer;
