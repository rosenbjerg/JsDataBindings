"use strict";

function JsDataBinding(htmlElement)
{
    let variableRegex = /(\w+) *(([<>-]+) *(\w+)?)?/;
    let _bindings = {};
    let _values = {};

    function Binding(element, target, bindingMode) {
        this.domElement = element;
        this.targetProperty = target;
        this.mode = bindingMode;
        this.observer = new MutationObserver(onElementRemovedFromDom);
        this.onPropertyChanged = function (sender, value) {
            if (this.domElement === sender)
                return;
            // console.log("onPropertyChanged : " + this.targetProperty + " = " + value);
            if (this.mode !== "<-")
                this.domElement[this.targetProperty] = value;
        };
    }
    function onElementRemovedFromDom(arg) {
        console.log(arg);
    }
    function createGetterSetter(property) {
        return function (val) {
            if (arguments.length === 0) {
                return _values[property];
            }
            else {
                propertyChanged(null, property, val);
            }
        };
    }
    function propertyChanged(sender, property, value) {
        if (_values[property] === value)
            return;
        _values[property] = value;
        console.log(property);
        console.log(_bindings[property]);
        _bindings[property].forEach(function (b) {
            b.onPropertyChanged(sender, value);
        })
    }
    function bindElement(jsDataBinding, element, bs, isInputElement) {
        let target = isInputElement ? "value" : "innerText";
        let bindingMode = isInputElement ? "<->" : "->";
        let match = bs.match(variableRegex);
        if (!match[1]){
            throw new Error("Invalid binding: " + bs);
        }
        let property = match[1];
        if (match[3]){
            bindingMode = match[3];
            if (match[4]){
                target = match[4];
            }
        }
        let binding = new Binding(element, target, bindingMode);


        if (bindingMode !== "->" && element[property])
            _values[property] = element[property];

        if (!_bindings.hasOwnProperty(property))
        {
            _bindings[property] = [];
            // console.log("created binding collection: " + property)
        }

        if (!jsDataBinding.hasOwnProperty(property))
        {
            jsDataBinding[property] = createGetterSetter(property);
            // console.log("created getter/setter for " + property)
        }

        if (isInputElement && target === "value" && binding.mode !== '->'){
            element.addEventListener("input", function (event) {
                propertyChanged(event.target, property, event.target.value);
            });
        }

        _bindings[property].push(binding);
        // console.log("added binding: " + property + "   " + bindingMode);

        // if (MutationObserver)

        binding.observer.observe(element);
        //TODO Create preferred binding using MutationObserver and use this as fallback
        // element.addEventListener("DOMNodeRemoved", function (ev) {
        //     if (ev.target !== element)
        //         return;
        //     console.log("removing");
        //     console.log(ev);
        //     let i = _bindings[property].indexOf(binding);
        //     _bindings[property].splice(i, 1);
        //     if (_bindings[property].length === 0)
        //         delete _bindings[property];
        // })
    }

    this.indexDomElement = function index_dom_element(htmlElement) {
        if (!htmlElement instanceof HTMLElement)
            throw new Error("Argument must be a HTMLElement");

        var elements = htmlElement.getElementsByTagName('*');
        for (let i = 0, max = elements.length; i < max; i++) {
            let element = elements[i];
            let attr = element.getAttribute("data-bindings");
            if (!attr)
                continue;
            let bindingStrings = attr.split(',');

            let isInputElement = element instanceof HTMLInputElement || element instanceof HTMLSelectElement;
            for (let j = 0, max2 = bindingStrings.length; j < max2; j++){
                bindElement(this, element, bindingStrings[j], isInputElement);
            }
        }
    };
    if (arguments.length !== 0){
        this.indexDomElement(htmlElement);
    }
}