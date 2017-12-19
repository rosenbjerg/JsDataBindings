"use strict";

function JsDataBindings(htmlElement) {
    this._bindings = {};
    this._values = {};
    this._handlers = {};
    this._listeners = {};
    this._observer = undefined;
    if (htmlElement !== undefined)
        this.indexDomElement(htmlElement);
}

// Constants
JsDataBindings.prototype.BindingModes = {
    OneWay: "->",
    TwoWay: "<->",
    OneWayToSource: "<-",
    Default: "-"
};
JsDataBindings.prototype.DefaultTarget = {
    Input: "value",
    Checkbox: "checked",
    Div: "innerText"
};
JsDataBindings.prototype.Attribute = "data-bindings";
JsDataBindings.prototype.Regex = / *(\w+) *((<?->?) *(\w+)?)? */;
JsDataBindings.prototype.ObserverOptions = { childList:true, subtree:true };

// Binding class
JsDataBindings.prototype.Binding = function Binding(element, target, bindingMode) {
    this.element = element;
    this.target = target;
    this.mode = bindingMode;
};
JsDataBindings.prototype.Binding.prototype.onPropertyChanged = function (sender, value){
    if (this.element !== sender && this.mode !== JsDataBindings.prototype.BindingModes.OneWayToSource)
        this.element[this.target] = value;
};
// 'Private' functions
JsDataBindings.prototype._handleDomMutation = function handle_dom_mutation(that, event) {
    console.log(event);
    if (event[0].type === "childList"){
        let added = event[0].addedNodes;
        let addedLength = added.length;
        let removed = event[0].removedNodes;
        let removedLength = removed.length;
        for (let i = 0; i < removedLength; i++){
            let bindings = that._getBindingsFromAttribute(removed[i]);
            for (let j = 0, maxj = bindings.length; j < maxj; j++){
                let sourceProperty = bindings[j][1];
                let jsBindings = that._bindings[sourceProperty];
                for (let k = 0, maxk = jsBindings.length; k < maxk; k++){
                    if (jsBindings[k].element !== removed[i])
                        continue;
                    jsBindings.splice(k, 1);
                    if (jsBindings.length === 0)
                        delete that._bindings[sourceProperty];
                    break;
                }
            }
        }
        if (addedLength > removedLength) {
            for (let i = 0; i < addedLength; i++){
                that._indexElement(added[i]);
            }
        }
    }
};
JsDataBindings.prototype._propertyChanged = function property_changed(sender, sourceProperty, value) {
    if (this._values[sourceProperty] === value)
        return;
    this._values[sourceProperty] = value;
    let bindings = this._bindings[sourceProperty];
    for (let i = 0, max = bindings.length; i < max; i++) {
        bindings[i].onPropertyChanged(sender, value);
    }

    let listeners = this._listeners[sourceProperty];
    if (listeners === undefined)
        return;
    for (let i = 0, max = listeners.length; i < max; i++) {
        listeners[i](sender, value);
    }
};
JsDataBindings.prototype._getInputHandler = function get_input_handler(sourceProperty) {
    if (this._handlers[sourceProperty] === undefined){
        let thisRef = this;
        this._handlers[sourceProperty] = function (event) {
            thisRef._propertyChanged(event.target, sourceProperty, event.target.value);
        }
    }
    return this._handlers[sourceProperty];
};
JsDataBindings.prototype._getBindingsFromAttribute = function get_bindings_from_attribute(htmlElement) {
    let arr = [];
    if (htmlElement.getAttribute === undefined)
        return arr;
    let attr = htmlElement.getAttribute(this.Attribute);
    if (!attr)
        return arr;
    let bindingStrings = attr.split(',');
    for (let i = 0, max = bindingStrings.length; i < max; i++){
        let match = bindingStrings[i].match(this.Regex);
        if (!match[1])
            continue;
        arr.push(match);
    }
    return arr;
};
JsDataBindings.prototype._getBindings = function (htmlElement) {
    if (this._map.has(htmlElement))
        return this._map.get(htmlElement);
    let bindings = [];
    this._map.set(htmlElement, bindings);
    return bindings;
};
JsDataBindings.prototype._bindElement = function bind_element(element, bs, isInputElement) {

    let targetProperty = isInputElement ? (element.type !== "checkbox" ? this.DefaultTarget.Input : this.DefaultTarget.Checkbox) : this.DefaultTarget.Div;
    let bindingMode = isInputElement ? this.BindingModes.TwoWay  : this.BindingModes.OneWay;
    let sourceProperty = bs[1];
    if (bs[3]){
        if (bs[3] !== this.BindingModes.Default)
            bindingMode = bs[3];
        if (bs[4])
            targetProperty = bs[4];
    }
    let defaults = this._getDefaults(element, isInputElement, bs);
    // console.log(defaults);
    if (this._bindings[sourceProperty] === undefined)
        this._bindings[sourceProperty] = [];

    if (this._values[sourceProperty] === undefined)
        this._values[sourceProperty] = element[targetProperty];

    if (this[sourceProperty] === undefined)
    {
        Object.defineProperty(this, sourceProperty, {
            get:  () => this._values[sourceProperty],
            set: value => this._propertyChanged(null, sourceProperty, value)
        });
    }
    if (bindingMode !== this.BindingModes.OneWayToSource)
        element[targetProperty] = this._values[sourceProperty];

    let binding = new this.Binding(element, targetProperty, bindingMode);
    // if (bindingMode !== this.BindingModes.OneWay){
    //     if (element[targetProperty])
    //         this._values[sourceProperty] = element[targetProperty];
    //     if (isInputElement){
    //         // console.log(targetProperty);
    //         if (targetProperty === this.DefaultTarget.Input)
    //             element.addEventListener("input", this._getInputHandler(sourceProperty));
    //         else if (targetProperty === this.DefaultTarget.Checkbox && !console.log("change"))
    //             element.addEventListener("change", this._getInputHandler(sourceProperty));
    //     }
    // }
    this._bindings[sourceProperty].push(binding);
    // console.log(`${sourceProperty} ${bindingMode} ${targetProperty} bound`);
};
JsDataBindings.prototype._getDefaults = function (element, isInput, bindingMatch) {
    // let source, target, mode;
    // source = bindingMatch[1];
    // if (bindingMatch[3]) {
    //     mode = bindingMatch[3];
    //     if (bindingMatch[4]){
    //         target = bindingMatch[4];
    //     }
    //     else {
    //         if (isInput){
    //             if (element.type.toLowerCase() === "checkbox" ||
    //                 element.nodeName.toLowerCase() === "select"){
    //                 target
    //             }
    //         }
    //     }
    // }
    // else {
    //
    // }
    // let defaults = {
    //     source: bindingMatch[1],
    //     mode: bindingMatch[3] ? bindingMatch[3] : this.BindingModes.OneWay,
    //     target: bindingMatch[4] ? bindingMatch[4] : this.DefaultTarget.Div
    // };
    // if (isInput){
    //
    // }
    //
    // let sourceProperty = bs[1];
    // if (bs[3]){
    //     if (bs[3] !== this.BindingModes.Default)
    //         bindingMode = bs[3];
    //     if (bs[4])
    //         targetProperty = bs[4];
    // }
    //
    // let targetProperty = isInputElement ? (element.type !== "checkbox" ? this.DefaultTarget.Input : this.DefaultTarget.Checkbox) : this.DefaultTarget.Div;
    // let bindingMode = isInputElement ? this.BindingModes.TwoWay  : this.BindingModes.OneWay;
    // if (isInput) {
    //     defaults.mode = this.BindingModes.TwoWay
    //     if (element.nodeName === "SELECT"){
    //
    //     }
    // }
    // else {
    //
    // }
};
JsDataBindings.prototype._indexElement = function index_element(htmlElement) {
    let bindings = this._getBindingsFromAttribute(htmlElement);
    let l = bindings.length;
    if (l === 0)
        return;
    let isInputElement = htmlElement instanceof HTMLInputElement || htmlElement instanceof HTMLSelectElement;
    for (let i = 0; i < l; i++){
        this._bindElement(htmlElement, bindings[i], isInputElement);
    }
};
// Public functions
JsDataBindings.prototype.detach = function detach_all_bindings () {
    if (this._observer){
        this._observer.disconnect();
        this._observer = null;
    }
    for (let prop in this._values){
        if (!this._values.hasOwnProperty(prop))
            continue;
        for (let i in this._bindings[prop]){
            if (!this._bindings[prop].hasOwnProperty(i))
                continue;
            let binding = this._bindings[prop][i];
            if (binding.mode !== '->' &&
                (binding.element instanceof HTMLInputElement ||
                    binding.element instanceof  HTMLSelectElement)){
                if (binding.target === this.DefaultTarget.Input)
                    binding.element.removeEventListener("input", this._getInputHandler(prop));
                else if (binding.target === this.DefaultTarget.Checkbox)
                    binding.element.removeEventListener("change", this._getInputHandler(prop));
            }
        }
        delete this[prop];
    }
    this._bindings = {};
    this._values = {};
    this._handlers = {};
};
JsDataBindings.prototype.indexDomElement = function index_dom_element(htmlElement) {
    if (!(htmlElement instanceof HTMLElement))
        throw new TypeError("Argument must be an HTMLElement");
    let elements = htmlElement.getElementsByTagName("*");
    this._indexElement(htmlElement);
    for (let i = 0, max = elements.length; i < max; i++) {
        this._indexElement(elements[i]);
    }
    if (this._observer === undefined && "MutationObserver" in window){
        let thisRef = this;
        this._observer = new MutationObserver(function (event) {
            thisRef._handleDomMutation(thisRef, event);
        });
        this._observer.observe(htmlElement, this.ObserverOptions);
        console.log("observer set");
    }
};
JsDataBindings.prototype.onchanged = function on_property_changed(sourceProperty, callback) {
    if (typeof sourceProperty === 'string')
        sourceProperty = [sourceProperty];
    for (let i = 0, max = sourceProperty.length; i < max; i++){
        let prop = sourceProperty[i];
        if (this._listeners[prop] === undefined)
            this._listeners[prop] = [];
        this._listeners[prop].push(callback);
    }
};