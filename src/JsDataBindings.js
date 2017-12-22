"use strict";

let JsDataBindings = (function () {
    const BINDING_MODES = {
        OneWay: "->",
        TwoWay: "<->",
        OneWayToSource: "<-",
        Default: "-"
    };
    const DEFAULT_TARGET = {
        Input: "value",
        Checkbox: "checked",
        Div: "innerText"
    };
    const ATTRIBUTE = "data-bindings";
    const REGEX = /^ *([\w-]+) *((<?->?) *(\w+)?)? *$/;
    const OBSERVER_OPTIONS = { childList:true, subtree:true, attributes:true, characterData:true };

    function JsDataBindings(htmlElement) {
        this._map = new WeakMap();
        this._bindings = Object.create(null);
        this._values = Object.create(null);
        this._handlers = Object.create(null);
        this._listeners = Object.create(null);
        this._observer = undefined;
        if (htmlElement !== undefined)
            this.indexDomElement(htmlElement);
    }

    function handleDomMutation(jsdb, event) {
        for (let i = 0, events = event.length; i < events; i++){
            let ev = event[i];
            if (ev.type === "childList"){
                handleRemovedNodes(jsdb, ev.removedNodes);
                handleAddedNodes(jsdb, ev.addedNodes);
            }
            else if (ev.type === "attributes"){
                handleAttributeChanged(jsdb, ev);
            }
            else if(ev.type === "characterData"){
                handleCharacterData(jsdb, ev);
            }
        }
    }
    function handleRemovedNodes(jsdb, nodes) {
        for (let i = 0, nlen = nodes.length; i < nlen; i++){
            if (!jsdb._map.has(nodes[i]))
                continue;
            let bindings = jsdb._map.get(nodes[i]);
            for (let j in bindings){
                removeBinding(jsdb, bindings[j]);
            }
            jsdb._map.delete(nodes[i]);
        }
    }
    function handleAddedNodes(jsdb, nodes) {
        for (let i = 0, nlen = nodes.length; i < nlen; i++){
            indexElement(jsdb, nodes[i]);
        }
    }
    function handleAttributeChanged(jsdb, event) {
        let sender = event.target;
        if (!jsdb._map.has(sender))
            return;
        let target = event.attributeName;
        let map = jsdb._map.get(event.target);
        let binding = jsdb._map.get(event.target)[target];
        if (binding === undefined)
            return;
        propertyChanged(jsdb, sender, binding.source, sender[target])
    }
    function handleCharacterData(jsdb, event) {
        if (event.target.nodeName === "#text"){
            let sender = event.target.parentNode;
            if (!jsdb._map.has(sender))
                return;
            let binding = jsdb._map.get(sender)["innerText"];
            if (binding === undefined || binding.mode === BINDING_MODES.OneWay)
                return;
            propertyChanged(jsdb, sender, binding.source, sender[binding.target])
        }
    }

    function indexElement(jsdb, htmlElement) {
        let bindings = getBindingsFromAttribute(htmlElement);
        let l = bindings.length;
        if (l === 0)
            return;
        let nodeName = htmlElement.nodeName.toLowerCase();
        for (let i = 0; i < l; i++){
            bindElement(jsdb, htmlElement, bindings[i], nodeName);
        }
    }
    function bindElement(jsdb, htmlElement, bindingMatch, nodeName) {
        let binding = parseBinding(htmlElement, bindingMatch, nodeName);

        if (jsdb._bindings[binding.source] === undefined)
            jsdb._bindings[binding.source] = [];

        if (jsdb._values[binding.source] === undefined)
            jsdb._values[binding.source] = htmlElement[binding.target];
        else if (binding.mode !== BINDING_MODES.OneWayToSource)
            htmlElement[binding.target] = jsdb._values[binding.source];

        if (jsdb[binding.source] === undefined)
        {
            Object.defineProperty(jsdb, binding.source, {
                get: () => jsdb._values[binding.source],
                set: value => propertyChanged(jsdb, null, binding.source, value)
            });
        }
        if (binding.event){
            htmlElement.addEventListener(binding.event, getInputHandler(jsdb, binding.source, binding.target));
        }
        jsdb._bindings[binding.source].push(binding);
        addToMap(jsdb, htmlElement, binding);
    }
    function parseBinding(htmlElement, bindingMatch, nodeName) {
        let binding = {
            element: htmlElement,
            source: bindingMatch[1],
            mode: (bindingMatch[3] && bindingMatch[3] !== "-")
                ? bindingMatch[3]
                : getDefaultBindingMode(nodeName),
            target: bindingMatch[4]
                ? bindingMatch[4]
                : getDefaultTarget(htmlElement, nodeName)
        };
        let event = getDefaultEvent(htmlElement, nodeName, binding.target);
        if (event)
            binding.event = event;
        return binding;
    }
    function addToMap(jsdb, htmlElement, binding) {
        let obj;
        if (jsdb._map.has(htmlElement)){
            obj = jsdb._map.get(htmlElement);
            if (obj[binding.target] !== undefined)
                console.warn("binding overridden");
        }
        else {
            obj = Object.create(null);
            jsdb._map.set(htmlElement, obj);
        }
        obj[binding.target] = binding;
    }
    function removeBinding(jsdb, binding) {
        let bindings = jsdb._bindings[binding.source];
        let index = bindings.indexOf(binding);
        if (index !== -1)
            bindings.splice(index, 1);
        if (bindings.length === 0)
            delete jsdb._bindings[binding.source];
        if (binding.event)
            binding.element.removeEventListener(binding.event, getInputHandler(jsdb, binding.source, binding.target));
    }

    function propertyChanged(jsdb, sender, source, value) {
        if (jsdb._values[source] === value)
            return;
        jsdb._values[source] = value;
        let bindings = jsdb._bindings[source];
        for (let i = 0, max = bindings.length; i < max; i++) {
            let binding = bindings[i];
            if (binding !== sender && binding.mode !== BINDING_MODES.OneWayToSource)
                binding.element[binding.target] = value;
        }

        let listeners = jsdb._listeners[source];
        if (listeners === undefined)
            return;
        for (let i = 0, max = listeners.length; i < max; i++) {
            listeners[i](sender, value);
        }
    }

    function getDefaultBindingMode(nodeName) {
        switch (nodeName){
            case "input":
            case "select":
            case "textarea":
                return BINDING_MODES.TwoWay;
            default:
                return  BINDING_MODES.OneWay;
        }
    }
    function getDefaultEvent(htmlElement, nodeName, target) {
        if (nodeName === "input"){
            let type = htmlElement.type;
            if (target === DEFAULT_TARGET.Checkbox && (type === "checkbox" || type === "radiobutton"))
                return "change";
            else if (target === DEFAULT_TARGET.Input)
                return "input";
        }
        else if (nodeName === "select" && target === "value")
            return "input";
        else if (nodeName === "textarea" && target === "value")
            return "input";
        return false;
    }
    function getDefaultTarget(htmlElement, nodeName) {
        switch (nodeName){
            case "input":
                let type = htmlElement.type;
                if (type === "checkbox" || type === "radiobutton")
                    return "checked";
                return "value";
            case "textarea":
            case "select":
                return "value";
            default:
                return "innerText";
        }
    }

    function getInputHandler(jsdb, source, target) {
        if (jsdb._handlers[source] === undefined){
            jsdb._handlers[source] = function (event) {
                propertyChanged(jsdb, event.target, source, event.target[target])
            }
        }
        return jsdb._handlers[source];
    }
    function getBindingsFromAttribute(htmlElement) {
        let arr = [], attr;
        if (htmlElement.getAttribute === undefined || !(attr = htmlElement.getAttribute(ATTRIBUTE)))
            return arr;
        let bindingStrings = attr.split(',');
        for (let i = 0, max = bindingStrings.length; i < max; i++){
            let match = bindingStrings[i].match(REGEX);
            if (!match[1])
                continue;
            arr.push(match);
        }
        return arr;
    }

    JsDataBindings.prototype.indexDomElement = function index_dom_element(htmlElement) {
        let elements = htmlElement.getElementsByTagName("*");
        indexElement(this, htmlElement);
        for (let i = 0, max = elements.length; i < max; i++) {
            indexElement(this, elements[i]);
        }
        if (this._observer === undefined){
            this._observer = new MutationObserver((event) => handleDomMutation(this, event));
            this._observer.observe(htmlElement, OBSERVER_OPTIONS);
        }
    };
    JsDataBindings.prototype.onchanged = function on_property_changed(source, callback) {
        if (typeof source === 'string')
            source = [ source ];
        for (let i = 0, max = source.length; i < max; i++){
            let prop = source[i];
            if (this._listeners[prop] === undefined)
                this._listeners[prop] = [];
            this._listeners[prop].push(callback);
        }
    };
    JsDataBindings.prototype.detach = function detach_bindings() {
        if (this._observer){
            this._observer.disconnect();
            this._observer = null;
        }
        for (let sourceProp in this._bindings){
            let bindings = this._bindings[sourceProp];
            for (let i in bindings){
                let binding = bindings[sourceProp][i];
                if (binding.event){
                    binding.element.removeEventListener(binding.event, getInputHandler(this, sourceProp));
                }
            }
            delete this[sourceProp];
        }
        _map = new WeakMap();
        this._bindings = Object.create(null);
        this._values = Object.create(null);
        this._handlers = Object.create(null);
        this._listeners = Object.create(null);
    };

    return JsDataBindings;
}());