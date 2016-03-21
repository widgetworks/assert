// TODO(vojta):
// - extract into multiple files
// - different error types
// - simplify/humanize error messages
// - throw when invalid input (such as odd number of args into assert.argumentTypes)
define(["require", "exports"], function (require, exports) {
    "use strict";
    var POSITION_NAME = ['', '1st', '2nd', '3rd'];
    function argPositionName(i) {
        var position = (i / 2) + 1;
        return POSITION_NAME[position] || (position + 'th');
    }
    var primitive = {
        void: function voidType() { },
        any: function any() { },
        string: function string() { },
        number: function number() { },
        boolean: function boolean() { }
    };
    function assertArgumentTypes() {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i - 0] = arguments[_i];
        }
        var actual, type;
        var currentArgErrors;
        var errors = [];
        var msg;
        for (var i = 0, l = params.length; i < l; i = i + 2) {
            actual = params[i];
            type = params[i + 1];
            currentArgErrors = [];
            // currentStack = [];
            //
            if (!isType(actual, type, currentArgErrors)) {
                // console.log(JSON.stringify(errors, null, '  '));
                // TODO(vojta): print "an instance of" only if T starts with uppercase.
                errors.push(argPositionName(i) + ' argument has to be an instance of ' + prettyPrint(type) + ', got ' + prettyPrint(actual));
                if (currentArgErrors.length) {
                    errors.push(currentArgErrors);
                }
            }
        }
        if (errors.length) {
            throw new Error('Invalid arguments given!\n' + formatErrors(errors));
        }
    }
    function prettyPrint(value) {
        if (typeof value === 'undefined') {
            return 'undefined';
        }
        if (typeof value === 'string') {
            return '"' + value + '"';
        }
        if (typeof value === 'boolean') {
            return value.toString();
        }
        if (value === null) {
            return 'null';
        }
        if (typeof value === 'object') {
            if (value.map) {
                return '[' + value.map(prettyPrint).join(', ') + ']';
            }
            var properties = Object.keys(value);
            return '{' + properties.map(function (p) { return p + ': ' + prettyPrint(value[p]); }).join(', ') + '}';
        }
        return value.__assertName || value.name || value.toString();
    }
    function isType(value, T, errors) {
        if (T === primitive.void) {
            return typeof value === 'undefined';
        }
        if (T === primitive.any || value === null) {
            return true;
        }
        if (T === primitive.string) {
            return typeof value === 'string';
        }
        if (T === primitive.number) {
            return typeof value === 'number';
        }
        if (T === primitive.boolean) {
            return typeof value === 'boolean';
        }
        // var parentStack = currentStack;
        // currentStack = [];
        // shouldnt this create new stack?
        if (typeof T.assert === 'function') {
            var parentStack = currentStack;
            var isValid;
            currentStack = errors;
            try {
                isValid = T.assert(value);
            }
            catch (e) {
                fail(e.message);
                isValid = false;
            }
            currentStack = parentStack;
            if (typeof isValid === 'undefined') {
                isValid = errors.length === 0;
            }
            return isValid;
        }
        return value instanceof T;
        // if (!(value instanceof T)) {
        //   fail('not instance of ' + prettyPrint(T));
        // }
        // var res = currentStack;
        // currentStack = parentStack;
        // return res;
    }
    function formatErrors(errors, indent) {
        if (indent === void 0) { indent = '  '; }
        return errors.map(function (e) {
            if (typeof e === 'string')
                return indent + '- ' + e;
            return formatErrors(e, indent + '  ');
        }).join('\n');
    }
    // assert a type of given value and throw if does not pass
    function type(actual, T) {
        var errors = [];
        // currentStack = [];
        if (!isType(actual, T, errors)) {
            // console.log(JSON.stringify(errors, null, '  '));
            // TODO(vojta): print "an instance of" only if T starts with uppercase.
            var msg = 'Expected an instance of ' + prettyPrint(T) + ', got ' + prettyPrint(actual) + '!';
            if (errors.length) {
                msg += '\n' + formatErrors(errors);
            }
            throw new Error(msg);
        }
    }
    function returnType(actual, T) {
        var errors = [];
        // currentStack = [];
        if (!isType(actual, T, errors)) {
            // console.log(JSON.stringify(errors, null, '  '));
            // TODO(vojta): print "an instance of" only if T starts with uppercase.
            var msg = 'Expected to return an instance of ' + prettyPrint(T) + ', got ' + prettyPrint(actual) + '!';
            if (errors.length) {
                msg += '\n' + formatErrors(errors);
            }
            throw new Error(msg);
        }
        return actual;
    }
    // TODO(vojta): define these with DSL?
    var string = define('string', function (value) {
        return typeof value === 'string';
    });
    // function string() {}
    // string.assert = function(value) {
    //   return typeof value === 'string';
    // };
    var boolean = define('boolean', function (value) {
        return typeof value === 'boolean';
    });
    // function boolean() {}
    // boolean.assert = function(value) {
    //   return typeof value === 'boolean';
    // };
    var number = define('number', function (value) {
        return typeof value === 'number';
    });
    // function number() {}
    // number.assert = function(value) {
    //   return typeof value === 'number';
    // };
    function arrayOf() {
        var types = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            types[_i - 0] = arguments[_i];
        }
        return assert.define('array of ' + types.map(prettyPrint).join('/'), function (value) {
            if (assert(value).is(Array)) {
                for (var _i = 0, value_1 = value; _i < value_1.length; _i++) {
                    var item = value_1[_i];
                    (_a = assert(item)).is.apply(_a, types);
                }
            }
            var _a;
        });
    }
    function structure(definition) {
        var properties = Object.keys(definition);
        return assert.define('object with properties ' + properties.map(function (x) { return ("\"" + x + "\""); }).join(', '), function (value) {
            if (assert(value).is(Object)) {
                for (var _i = 0, properties_1 = properties; _i < properties_1.length; _i++) {
                    var property = properties_1[_i];
                    assert(value[property], property).is(definition[property]);
                }
            }
        });
    }
    // I'm sorry, bad global state... to make the API nice ;-)
    var currentStack = [];
    function fail(message) {
        currentStack.push(message);
    }
    function define(classOrName, check) {
        var cls = classOrName;
        if (typeof classOrName === 'string') {
            cls = function () { };
            cls.__assertName = classOrName;
        }
        cls.assert = function (value) {
            // var parentStack = currentStack;
            // currentStack = [];
            return check(value);
            // if (currentStack.length) {
            //   parentStack.push(currentStack)
            // }
            // currentStack = parentStack;
        };
        return cls;
    }
    function assert(value, name) {
        if (name === void 0) { name = ''; }
        var errorPrefix = '';
        if (name != '') {
            errorPrefix = "`" + name + "`: ";
        }
        return {
            is: function is() {
                var types = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    types[_i - 0] = arguments[_i];
                }
                // var errors = []
                var allErrors = [];
                var errors;
                for (var _a = 0, types_1 = types; _a < types_1.length; _a++) {
                    var type = types_1[_a];
                    errors = [];
                    if (isType(value, type, errors)) {
                        return true;
                    }
                    // if no errors, merge multiple "is not instance of " into x/y/z ?
                    allErrors.push("" + errorPrefix + prettyPrint(value) + " is not instance of `" + prettyPrint(type) + "`");
                    if (errors.length) {
                        allErrors.push(errors);
                    }
                }
                // if (types.length > 1) {
                //   currentStack.push(['has to be ' + types.map(prettyPrint).join(' or '), ...allErrors]);
                // } else {
                currentStack.push.apply(currentStack, allErrors);
                // }
                return false;
            }
        };
    }
    exports.assert = assert;
    // PUBLIC API
    var assert;
    (function (assert) {
    })(assert || (assert = {}));
    exports.assert = assert;
    // PUBLIC API
    // asserting API
    assert.primitive = primitive;
    // throw if no type provided
    assert.type = type;
    // throw if odd number of args
    assert.argumentTypes = assertArgumentTypes;
    assert.returnType = returnType;
    // define AP;
    assert.define = define;
    assert.fail = fail;
    // primitive value type;
    assert.any = primitive.any;
    assert.string = string;
    assert.number = number;
    assert.boolean = boolean;
    // custom types
    assert.arrayOf = arrayOf;
    assert.structure = structure;
});
