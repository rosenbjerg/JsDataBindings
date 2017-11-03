"use strict";

function JsDataBinding(htmlElement)
{
    let variableRegex = /(\w+) *(([<>-]+) *(\w+)?)?/;
    let _map = {};

    function Binding(element, target, bindingMode) {
        this.domElement = element;
        this.targetProperty = target;
        this.bindingMode = bindingMode;
        this.value = "";
        this.onPropertyChanged = function (val) {
            if (this.value !== val) {
                this.value = val;
                if (this.bindingMode !== "<-")
                    this.domElement[this.targetProperty] = val;
            }
        };
    }
    function createGetterSetter(binding, source) {
        return function (val) {
            if (arguments.length === 0) {
                return binding.value;
            }
            else {
                propertyChanged(source, val);
            }
        };
    }
    function propertyChanged(property, value) {
        _map[property].forEach(function (b) {
            b.onPropertyChanged(value)
        })
    }
    function bindElement(jsDataBinding, element, bs, isInputElement) {
        let target = isInputElement ? "value" : "innerText";
        let bindingMode = isInputElement ? "<->" : "->";
        let match = bs.match(variableRegex);
        if (!match[1]){
            throw new Error("Invalid binding: " + bs);
        }
        let source = match[1];
        if (match[3]){
            bindingMode = match[3];
            if (match[4]){
                target = match[4];
            }
        }
        let binding = new Binding(element, target, bindingMode);
        jsDataBinding[source] = createGetterSetter(binding, source);
        if (isInputElement && binding.bindingMode !== '->'){
            element.addEventListener("input", function (event) {
                binding.value = event.target[target];
                propertyChanged(source, event.target[target]);
            });
        }
        if (!_map[source])
            _map[source] = [];
        _map[source].push(binding);

        // if (MutationObserver)
        //TODO Create preferred binding using MutationObserver and use this as fallback
        element.addEventListener("DOMNodeRemoved", function (ev) {
            if (ev.target !== element)
                return;
            let i = _map[source].indexOf(binding);
            _map[source].splice(i, 1);
            if (_map[source].length === 0)
                delete _map[source];
        })
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
            let isInputElement = element instanceof HTMLInputElement;
            for (let j = 0, max2 = bindingStrings.length; j < max2; j++){
                bindElement(this, element, bindingStrings[j], isInputElement);
            }
        }
    };
    if (arguments.length !== 0){
        this.indexDomElement(htmlElement);
    }
}