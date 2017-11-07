"use strict";

function JsDataBindings(htmlElement)
{
    let variableRegex = /(\w+) *(([<>-]+) *(\w+)?)?/;
    let _bindings = {};
    let _values = {};
    let _handlers = {};
    let _observer;
    let _this;

    function handleDomMutation(event) {
        if (event[0].type === "childList"){
            let added = event[0].addedNodes;
            let addedLength = added.length;
            let removed = event[0].removedNodes;
            let removedLength = removed.length;
            if (removedLength !== 0 && addedLength === 0){
                for (let i = 0; i < removedLength; i++){
                    let bindings = getBindingsFromAttribute(removed[i]);
                    for (let j = 0, maxj = bindings.length; j < maxj; j++){
                        let sourceProperty = bindings[j][1];
                        let jsBindings = _bindings[sourceProperty];
                        for (let k = 0, maxk = jsBindings.length; k < maxk; k++){
                            if (jsBindings[k].element !== removed[i])
                                continue;
                            jsBindings.splice(k, 1);
                            if (jsBindings.length === 0)
                                delete _bindings[sourceProperty];
                            break;
                        }
                    }
                }
            }
            else if (removedLength === 0 && addedLength !== 0){
                console.log("only added");
                for (let i = 0; i < addedLength; i++){
                    indexElement(_this, added[i]);
                }
            }
            else {
                console.log("added and removed");
            }
        }
    }
    function propertyChanged(sender, sourceProperty, value) {
        if (_values[sourceProperty] === value)
            return;
        _values[sourceProperty] = value;
        let bindings = _bindings[sourceProperty];
        for (let i = 0, max = bindings.length; i < max; i++) {
            bindings[i].onPropertyChanged(sender, value);
        }
    }

    function Binding(element, target, bindingMode) {
        this.element = element;
        this.target = target;
        this.mode = bindingMode;
        this.formatter = noFormatter;
        this.onPropertyChanged = function (sender, value){
            if (this.element !== sender && this.mode !== "<-")
                this.element[this.target] = this.formatter(value);
        }
    }
    function noFormatter(str) { return str; }
    function getInputHandler(sourceProperty) {
        if (_handlers[sourceProperty] === undefined){
            _handlers[sourceProperty] = function (event) {
                propertyChanged(event.target, sourceProperty, event.target.value);
            }
        }
        return _handlers[sourceProperty];
    }
    function getBindingsFromAttribute(htmlElement) {
        let arr = [];
        if (htmlElement.getAttribute === undefined)
            return arr;
        let attr = htmlElement.getAttribute("data-bindings");
        if (!attr)
            return arr;
        let bindingStrings = attr.split(',');
        for (let i = 0, max = bindingStrings.length; i < max; i++){
            let match = bindingStrings[i].match(variableRegex);
            if (!match[1])
                continue;
            arr.push(match);
        }
        return arr;
    }
    function bindElement(jsDataBinding, element, bs, isInputElement) {
        let targetProperty = isInputElement ? "value" : "innerText";
        let bindingMode = isInputElement ? "<->" : "->";
        let sourceProperty = bs[1];
        if (bs[3]){
            if (bs[3] !== '-')
                bindingMode = bs[3];
            if (bs[4])
                targetProperty = bs[4];
        }
        if (_bindings[sourceProperty] === undefined)
        {
            _bindings[sourceProperty] = [];
            _values[sourceProperty] = "";
        }
        if (jsDataBinding[sourceProperty] === undefined)
        {
            Object.defineProperty(jsDataBinding, sourceProperty, {
                get: function () {
                    return _values[sourceProperty];
                },
                set: function (value) {
                    propertyChanged(null, sourceProperty, value);
                }
            });
        }

        let binding = new Binding(element, targetProperty, bindingMode);
        if (bindingMode !== '->'){
            if (element[targetProperty])
                _values[sourceProperty] = element[targetProperty];
            if (isInputElement && targetProperty === "value"){
                element.addEventListener("input", getInputHandler(sourceProperty));
            }
        }
        if (bindingMode !== '<-' && _values[sourceProperty])
            element[targetProperty] = _values[sourceProperty];
        _bindings[sourceProperty].push(binding);
    }

    this.setFormatter = function set_data_formatter(htmlElement, sourceProperty, formatFunction) {
        let bindings = _bindings[sourceProperty];
        if (bindings === undefined)
            return false;
        if (!htmlElement){
            for (let i = 0; i < bindings.length; i++){
                bindings[i].formatter = formatFunction;
            }
            return true;
        }
        else {
            for (let i = 0; i < bindings.length; i++){
                if (bindings[i].element !== htmlElement)
                    continue;
                bindings[i].formatter = formatFunction;
                return true;
            }
        }
        return false;
    };
    function indexElement(jsDataBinding, htmlElement) {
        let bindings = getBindingsFromAttribute(htmlElement);
        if (bindings.length === 0)
            return;
        let isInputElement = htmlElement instanceof HTMLInputElement || htmlElement instanceof HTMLSelectElement;
        for (let j = 0, max2 = bindings.length; j < max2; j++){
            bindElement(jsDataBinding, htmlElement, bindings[j], isInputElement);
        }
    }
    this.indexDomElement = function index_dom_element(htmlElement) {
        if (typeof htmlElement === 'string')
            htmlElement = document.querySelector(htmlElement);
        if (htmlElement === null || !htmlElement instanceof HTMLElement)
            throw new TypeError("Argument must be an HTMLElement or a selector for one");
        var elements = htmlElement.querySelectorAll('[data-bindings]');
        for (let i = 0, max = elements.length; i < max; i++) {
            indexElement(this, elements[i]);
        }
        indexElement(this, htmlElement);
        if (_observer === undefined && "MutationObserver" in window){
            _observer = new MutationObserver(handleDomMutation);
            _observer.observe(htmlElement, {childList:true, subtree:true});
            _this = this;
        }
    };
    this.detach = function detach_all_bindings () {
        if (_observer){
            _observer.disconnect();
            _observer = null;
        }
        for (let prop in _values){
            for (let i in _bindings[prop]){
                let binding = _bindings[prop][i];
                if (binding.mode !== '->' &&
                    (binding.element instanceof HTMLInputElement ||
                        binding.element instanceof  HTMLSelectElement)){
                    binding.element.removeEventListener("input", getInputHandler(prop));
                }
            }
            delete this[prop];
        }
        _bindings = {};
        _values = {};
        _handlers = {};
    };

    if (arguments.length !== 0)
        this.indexDomElement(htmlElement);
}