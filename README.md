# JsDataBindings

Simple databinding engine in pure JavaScript

Loading this library creates a constructor for the type JsDataBinding.
Calling this method without a parameter will return an 'empty' JsDataBinding object.

JsDataBindings only have a single function:
`indexDomElement(htmlElement)`. This function is used to parse the databindings specified in HTML, 
and create getter and setter functions for each binding name

