# Refact

# What it does
Useful for when you have a react component that grew too much and now you want to separate it into multiple little components.

You can paste or drag your code into a text editor, and then select which react element you want to factor out. A new react component will be created out of this element and your code will be updated to use this new component instead.

Give it a go at http://aadsm.github.io/refact.

# Caveats
This is just a proof of concept of an idea I had in mind for a while ago. There's still much to do if I find this to be useful in my day to day work.

It only supports generating ES6 react based classes, will had support for classic React later (React.createClass).

Factoring out of the selected element into a new React element uses the most simple and naive way. Dependencies are not brought at all into the new component. This is something I plan to address in the future.

# How to use locally
```
npm install && npm run dist
```

Open `gui/index.html` in a browser.
Follow the instructions at the top.

# Documentation

This refactoring is based on two main classes: `Refactor` and `FactoredReactComponent`.

## Refactor
This class represents the code you want to refactor. You initialize it with your code and then you can create a new React component by selecting a react element to refactor:

```
var yourCode = 'function render() { return <div className="foo"><h1>Title</h1></div>; }';
var refactor = new Refactor(yourCode);
var factoredReactComponent = refactor.factorElementAt(0, 30, 'es6');
```

`factorElementAt` receives the line and column where the element is located (in this case the `div`) and returns a `FactoredReactComponent` instance. 'es6' is the component template to use, in this case an ES6 React Component (it's the only one for now).

### FactoredReactComponent
You can edit the new react component name and any properties that were created to pass in dependencies that existed in your code. In this example there will be one property, the className.

```
// Change its name
factoredReactComponent.setName("MyComponent");
// Read the properties created
factoredReactComponent.getProps();
// Change the properties' names
factoredReactComponent.setPropName(0, "className");
```

The first argument of the `setPropName` method is the prop index returned by `getProps()`.

When you're happy with the new React component you can print out its code:
```
console.log(factoredReactComponent.toSource());
```

Finally you need to start using this new component in your code to replace the factored elements:
```
refactor.applyFactoredReactComponent(factoredReactComponent);
console.log(refactor.toSource());
```

You can call `applyFactoredReactComponent` as many times as you want to update it with your factoredReactComponent changes.
