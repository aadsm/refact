const React = require('react');

class StaticComponentES6 extends React.Component {
  _renderSection() {
    return (
      <div>
        <h2>Section C</h2>
      </div>
    );
  }

  render() {
    return (
      <div>
        <div className="section">
          <h2>Section A</h2>
          <span>Hello There</span>
        </div>
        <div>
          <h2>Section A</h2>
          freitas
          <span>Welcome</span>
        </div>
      </div>
    );
  }
}

module.exports = StaticComponentES6;
