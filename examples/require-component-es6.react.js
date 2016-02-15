const React = require('react');
const Image = require('Image');
const Profile = require('Profile.react');

class RequireComponentES6 extends React.Component {
  _renderProfile() {
    return (
      <Profile>
        <h2>Name</h2>
      </Profile>
    );
  }

  render() {
    return (
      <div className="section">
        <h2>Section</h2>
        <span>Hello There</span>
        <Profile />
        <Image />
      </div>
    );
  }
}

module.exports = StaticComponentES6;
