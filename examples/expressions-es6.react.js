const React = require('react');
const Image = require('Image');
const Profile = require('Profile.react');

class ExpressionsES6 extends React.Component {
  _renderProfile() {
    return (
      <Profile>
        <h2>{this.state.name}</h2>
        <div>{this.state.picture}</div>
      </Profile>
    );
  }

  _getName() {
    return "Name";
  }

  render() {
    return (
      <div className="section">
        <h2>{this.props.label}</h2>
        <span>{3 * 4}</span>
        <span>{this.state.x * 2}</span>
        <Profile
          name={this._getName()}
        />
        <div>
          {
            this.state.y === 0
            ? <h1>0</h1>
            : <h1>1</h1>
          }
        </div>
      </div>
    );
  }
}

module.exports = ExpressionsES6;
