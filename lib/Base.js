/*
 Based on Base.js 1.1a (c) 2006-2010, Dean Edwards
 Updated to pass JSHint and converted into a module by Kenneth Powers
 License: http://www.opensource.org/licenses/mit-license.php
 */
/*global define:true module:true*/
/*jshint eqeqeq:true*/
define(function () {
    // Base Object
    var Base = function () {
    };

    // Implementation
    Base.extend = function (_instance, _static) { // subclass
        var extend = Base.prototype.extend;
        // build the prototype
        Base._prototyping = true;
        var proto = new this();
        extend.call(proto, _instance);
        proto.base = function () {
            // call this method from any other method to invoke that method's ancestor
        };
       //proto.config = {};
        delete Base._prototyping;
        // create the wrapper for the constructor function
        //var constructor = proto.constructor.valueOf(); //-dean
        var constructor = proto.constructor;
        var klass = proto.constructor = function () {
            if (!Base._prototyping) {
                if (this._constructing || this.constructor === klass) { // instantiation
                    this._constructing = true;
                    constructor.apply(this, arguments);
                    delete this._constructing;
                } else if (arguments[0] !== null) { // casting
                    return (arguments[0].extend || extend).call(arguments[0], proto);
                }
            }
        };
        // build the class interface
        klass.ancestor = this;
        klass.extend = this.extend;
        klass.forEach = this.forEach;
        klass.implement = this.implement;
        klass.config = {};
        klass.prototype = proto;
        klass.toString = this.toString;
        klass.valueOf = function (type) {
            return (type === 'object') ? klass : constructor.valueOf();
        };
        extend.call(klass, _static);
        // class initialization
        if (typeof klass.init === 'function') klass.init();
        return klass;
    };

    Base.prototype = {
        extend: function (source, value) {
            if (arguments.length > 1) { // extending with a name/value pair
                var ancestor = this[source];
                if (source === 'config') {
                    var config = {};
                    for (var i in ancestor) {
                        config[i] = ancestor[i];
                    }

                    for (var i in value) {
                        config[i] = value[i];
                    }

                    value = config;
                }

                if (ancestor && (typeof value === 'function') && // overriding a method?
                        // the valueOf() comparison is to avoid circular references
                    (!ancestor.valueOf || ancestor.valueOf() !== value.valueOf()) && /\bbase\b/.test(value)) {
                    // get the underlying method
                    var method = value.valueOf();
                    // override
                    value = function () {
                        var previous = this.base || Base.prototype.base;
                        this.base = ancestor;
                        var returnValue = method.apply(this, arguments);
                        this.base = previous;
                        return returnValue;
                    };
                    // point to the underlying method
                    value.valueOf = function (type) {
                        return (type === 'object') ? value : method;
                    };
                    value.toString = Base.toString;
                }

                this[source] = value;
            } else if (source) { // extending with an object literal
                var extend = Base.prototype.extend;
                // if this object has a customized extend method then use it
                if (!Base._prototyping && typeof this !== 'function') {
                    extend = this.extend || extend;
                }
                var proto = {
                    toSource: null
                };
                // do the "toString" and other methods manually
                var hidden = ['constructor', 'toString', 'valueOf'];
                // if we are prototyping then include the constructor
                for (var i = Base._prototyping ? 0 : 1; i < hidden.length; i++) {
                    var h = hidden[i];
                    if (source[h] !== proto[h])
                        extend.call(this, h, source[h]);
                }
                // copy each of the source object's properties to this object
                for (var key in source) {
                    if (!proto[key]) extend.call(this, key, source[key]);
                }
            }
            return this;
        }
    };

    // initialize
    Base = Base.extend({
        constructor: function () {
            this.extend(arguments[0]);
        }
    }, {
        ancestor: Object,
        version: '1.1',
        forEach: function (object, block, context) {
            for (var key in object) {
                if (this.prototype[key] === undefined) {
                    block.call(context, object[key], key, object);
                }
            }
        },
        implement: function () {
            for (var i = 0; i < arguments.length; i++) {
                if (typeof arguments[i] === 'function') {
                    // if it's a function, call it
                    arguments[i](this.prototype);
                } else {
                    // add the interface using the extend method
                    this.prototype.extend(arguments[i]);
                }
            }
            return this;
        },
        toString: function () {
            return String(this.valueOf());
        }
    });

    // Return Base implementation
    return Base;
});
