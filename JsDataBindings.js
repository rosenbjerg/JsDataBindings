"use strict";

function JsDataBindings(htmlElement)
{
    let variableRegex = /(\w+) *(([<>-]+) *(\w+)?)?/;
    let _bindings = {};
    let _values = {};
    let _handlers = {};
    let _observer;

    function handleDomMutation(event) {
        if (event[0].type === "childList"){
            if (event[0].removedNodes.length !== 0){
                let nodes = event[0].removedNodes;
                for (let i = 0; i < nodes.length; i++){
                    let bindings = getBindingsFromAttribute(nodes[i]);
                    for (let j = 0; j < bindings.length; j++){
                        let sourceProperty = bindings[j][1];
                        let jsBindings = _bindings[sourceProperty];
                        for (let k = 0; k < jsBindings.length; k++){
                            if (jsBindings[k].element !== nodes[i])
                                continue;
                            jsBindings.splice(k, 1);
                            if (jsBindings.length === 0)
                                delete _bindings[sourceProperty];
                            break;
                        }
                    }
                }
            }
            else if (event[0].addedNodes.length !== 0){
                console.log(event);
            }
        }
    }
    function propertyChanged(sender, sourceProperty, value) {
        if (_values[sourceProperty] === value)
            return;
        _values[sourceProperty] = value;
        let bindings = _bindings[sourceProperty];
        for (let i = 0; i < bindings.length; i++) {
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
    function createGetterSetter(sourceProperty) {
        return function (value) {
            if (value === undefined)
                return _values[sourceProperty];
            else
                propertyChanged(null, sourceProperty, value);
        };
    }
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
            jsDataBinding[sourceProperty] = createGetterSetter(sourceProperty);

        let binding = new Binding(element, targetProperty, bindingMode);
        if (bindingMode !== '->'){
            if (element[targetProperty])
                _values[sourceProperty] = element[targetProperty];
            if (isInputElement && targetProperty === "value"){
                element.addEventListener("input", getInputHandler(sourceProperty));
            }
        }
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
    this.indexDomElement = function index_dom_element(htmlElement) {
        if (!htmlElement instanceof HTMLElement)
            throw new TypeError("Argument must be a HTMLElement");
        var elements = htmlElement.getElementsByTagName('*');
        for (let i = 0, max = elements.length; i < max; i++) {
            let element = elements[i];
            let bindings = getBindingsFromAttribute(element);
            if (bindings.length === 0)
                continue;
            let isInputElement = element instanceof HTMLInputElement || element instanceof HTMLSelectElement;
            for (let j = 0, max2 = bindings.length; j < max2; j++){
                bindElement(this, element, bindings[j], isInputElement);
            }
        }
        if (_observer === undefined && "MutationObserver" in window){
            _observer = new MutationObserver(handleDomMutation);
            _observer.observe(htmlElement, {childList:true, subtree:true});
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