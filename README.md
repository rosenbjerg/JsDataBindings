# JsDataBindings

Simple data-binding engine in pure JavaScript.

Loading the library creates a constructor for the type JsDataBindings: `JsDataBindings(htmlElement)`.
The constructor can be used with or without an argument. 
Calling it with an HTMLElement as argument will create a new instance, and call indexDomElement with the passed HTMLElement as parameter.

The 'empty' JsDataBinding object has two functions:
`indexDomElement(htmlElement)`. This function is used to parse the data-bindings specified in the HTML, 
and create getter and setter functions for each binding property specified in the bindings.

#### Attribute format
The data-bindings are declared in the HTML data- attribute: `data-bindings`.
Each binding each specified as with the name of a source property, a binding mode and the name a target property.
* The source property is the name of the getter/setter function created.
* The binding mode can be one of three options: 
  * `->` 1-way
  * `<->` 2-way
  * `<-` 1-way to source
  * `-` Use default for HTMLElement type
* The target property is the name of the property on the HTMLElement to bind to.

The target property can be omitted.

Default values for target property:
* `value` for `input` and `select` HTMLElements 
* `innerText` for all other elements.

The binding mode can be omitted, but only if the target property is also omitted. 

Defaults values for binding mode:
* `<->` for `input` and `select` HTMLElements
* `->` for all other elements.


Multiple bindings are simply separated with a comma (`,`)

#### Functions
`indexDomElement(htmlElement)` binds all elements inside the html element with `data-bindings` attribute

`detach()` removes all bindings and getter/setter functions. 

One getter/setter function for each source property. 
The getter/setter functions returns the current value when called without a parameter,
and sets the value when called with one parameter.

#### Example
HTML:
```
..
<div id="container">
    <input data-bindings="firstname" type="text">
    <input data-bindings="lastname, disabled -> disabled" type="text">
    <input data-bindings="city, disabled -> disabled" type="text">
</div>
..
```
JavaScript:
```
let cb = new JsDataBindings(document.getElementById("container"));
cb.firstname("John"); // Sets the value to "John"
cb.firstname(); // Gets the value
```

#### Notes
[MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) support is required to detect removal of elements inside an indexed html element.
Consider using a polyfill for MutationObserver if targeting browsers without support for it.

Be aware that bindings to the `<title>` element can be slower than to other elements (10x slower on my machine), 
so perhaps avoid binding it to properties that change very rapidly, i.e. in a for-loop.