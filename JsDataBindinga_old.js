class JsDataBindings
{
    constructor(htmlElement){
        const BindingModes = {
            OneWay: "->",
            TwoWay: "<->",
            OneWayToSource: "<-",
            Default: "-"
        };
        const Defaults = {
            Input: "value",
            Div: "innerText"
        };
        const attribute = "data-bindings";
        const variableRegex = / *(\w+) *(([<>-]+) *(\w+)?)? */;
        let _bindings = {};
        let _values = {};
        let _handlers = {};
        let _listeners = {};
        let _observer;
        let _this;

        function Binding(element, target, bindingMode) {
            this.element = element;
            this.target = target;
            this.mode = bindingMode;
        }

        Binding.prototype.onPropertyChanged = function (sender, value){
            if (this.element !== sender && this.mode !== BindingModes.OneWayToSource)
                this.element[this.target] = value;
        };

        function handleDomMutation(event) {
            if (event[0].type === "childList"){
                let added = event[0].addedNodes;
                let addedLength = added.length;
                let removed = event[0].removedNodes;
                let removedLength = removed.length;
                if (removedLength !== 0){
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
                if (addedLength !== 0) {
                    if (addedLength > removedLength) {
                        for (let i = 0; i < addedLength; i++){
                            indexElement(_this, added[i]);
                        }
                    }
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

            let listeners = _listeners[sourceProperty]
            if (listeners === undefined)
                return;
            for (let i = 0, max = listeners.length; i < max; i++) {
                listeners[i](sender, value);
            }
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
            let attr = htmlElement.getAttribute(attribute);
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
            let targetProperty = isInputElement ? Defaults.Input : Defaults.Div;
            let bindingMode = isInputElement ? BindingModes.TwoWay : BindingModes.OneWay;
            let sourceProperty = bs[1];
            if (bs[3]){
                if (bs[3] !== BindingModes.Default)
                    bindingMode = bs[3];
                if (bs[4])
                    targetProperty = bs[4];
            }
            if (_bindings[sourceProperty] === undefined)
                _bindings[sourceProperty] = [];

            if (_values[sourceProperty] === undefined)
                _values[sourceProperty] = element[targetProperty];

            if (jsDataBinding[sourceProperty] === undefined)
            {
                Object.defineProperty(jsDataBinding, sourceProperty, {
                    get: function () { return _values[sourceProperty]; },
                    set: function (value) { propertyChanged(null, sourceProperty, value); }
                });
            }
            if (bindingMode !== BindingModes.OneWayToSource)
                element[targetProperty] = _values[sourceProperty];

            let binding = new Binding(element, targetProperty, bindingMode);
            if (bindingMode !== BindingModes.OneWay){
                if (element[targetProperty])
                    _values[sourceProperty] = element[targetProperty];
                if (isInputElement && targetProperty === Defaults.Input){
                    element.addEventListener("input", getInputHandler(sourceProperty));
                }
            }
            _bindings[sourceProperty].push(binding);
        }
        function indexElement(jsDataBinding, htmlElement) {
            let bindings = getBindingsFromAttribute(htmlElement);
            let l = bindings.length;
            if (l === 0)
                return;
            let isInputElement = htmlElement instanceof HTMLInputElement || htmlElement instanceof HTMLSelectElement;
            for (let i = 0; i < l; i++){
                bindElement(jsDataBinding, htmlElement, bindings[i], isInputElement);
            }
        }

        this.indexDomElement = function index_dom_element(htmlElement) {
            if (!(htmlElement instanceof HTMLElement))
                throw new TypeError("Argument must be an HTMLElement");
            let elements = htmlElement.getElementsByTagName("*");
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
        this.onchanged = function on_property_changed(sourceProperty, callback) {
            if (typeof sourceProperty === 'string')
                sourceProperty = [sourceProperty];
            for (let i = 0, max = sourceProperty.length; i < max; i++){
                let prop = sourceProperty[i];
                if (_listeners[prop] === undefined)
                    _listeners[prop] = [];
                _listeners[prop].push(callback);
            }
        };

        if (htmlElement !== undefined)
            this.indexDomElement(htmlElement);
    }
}