# JsDataBindings

Simple data-binding engine in pure JavaScript.
Does not update DOM elements when setting the bound property to the same value it had

Loading the library creates a constructor for the type JsDataBindings: `JsDataBindings(htmlElement)`.
The constructor can be used with or without an argument. 
Calling it with an HTMLElement as argument will create a new instance, and call indexDomElement with the passed HTMLElement as parameter.

### Attribute format
The data-bindings are declared in the HTML data- attribute: `data-bindings`.
Each binding is specified with the name of a source property, a binding mode and the name a target property.
* The **source property** is the name of the property that will be created.
* The **binding mode** can be one of four options: 
  * `->` 1-way
  * `<->` 2-way
  * `<-` 1-way to source
  * `-` Use default for HTMLElement type
* The **target property** is the name of the property on the HTMLElement to bind to.

The target property can be omitted.

Default values for target property:
* `value` for `input` and `select` HTMLElements 
* `innerText` for all other elements.

The binding mode can be omitted, but only if the target property is also omitted. 

Defaults values for binding mode:
* `<->` for `input` and `select` HTMLElements
* `->` for all other elements.


Multiple bindings are simply separated with a comma (`,`)

### Functions
* `indexDomElement(htmlElement)` binds all elements inside the html element with `data-bindings` attribute

* `detach()` removes all bindings and getter/setter functions. 

* One property for each unique source property. 

### Example
**HTML:**
```
..
<div id="container">
    <input data-bindings="firstname" type="text">
    <input data-bindings="lastname, disabled -> disabled" type="text">
    <input data-bindings="city, disabled -> disabled" type="text">
</div>
..
```


**JavaScript:**
```
let cb = new JsDataBindings(document.getElementById("container"));
cb.firstname = "John"; // Sets the value to "John"
let fn = cb.firstname; // Gets the value
```
The `cb` object will have a property for _firstname_, _lastname_, _disable_ and _city_.

### Notes
[MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) support is required to detect removal of elements inside an indexed html element.
Consider using a polyfill for MutationObserver if targeting browsers without support for it.

Be aware that bindings to the `<title>` element can be slower than to other elements (10x slower on my machine), 
so perhaps avoid binding it to properties that change very rapidly, i.e. in a for-loop.