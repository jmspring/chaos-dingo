// dingo_utils.js
//
// Assorted helper utilities.

exports = module.exports = {};

// Given the result of a call to list VMs, parse out the vm names
exports.parse_vm_list = function(data, callback) {
    var result = [];
    if(data && data.length && data.length >= 0) {
        for(var i = 0; i < data.length; i++) {
            if(data[i].name) {
                result.push(data[i].name);
            }
        }
        callback(null, result);
    } else {
        callback(new Error('parse_vm_list: Invalid data'));
    }
}
 
// Given an array of resources and a regex, filter the array
exports.filter_vm_list = function(pattern, data, callback) {
    var result = [];
    var re;
    
    try {
        // TODO -- there may be issues around this, may need to escape, etc.
        re = new RegExp(pattern);
    } catch(ex) {
        callback(ex);
    }
    
    for(var i = 0; i < data.length; i++) {
        if(data[i].match(re)) {
            result.push(data[i]);
        }
    }
    callback(null, result);
}

// Given an array, get a random element from that array
exports.random_array_entry = function(array) {
    if(array && array.length > 0) {
        var index = Math.floor(Math.random() *  array.length);
        return array[index];
    } else {
        return null;
    }
}

// Given an integer (in a string) or a range X-Y, parse to integers and return the values
exports.parse_integer_or_range = function(value) {
    var result = null;

    var tmp = parseInt(value);
    if(tmp.toString() == value) {
        result = tmp;
    } else {
        var range = value.split('-');
        if(range.length == 2) {
            if((parseInt(range[0]).toString() != range[0]) ||
                    (parseInt(range[1]).toString() != range[1])) {
                result = null;
            } else {
                result = [parseInt(range[0]), parseInt(range[1])];
            }
        }
    }
    
    return result;
}

// Given an integer or range (in a string), parse the value (or range) and
// return a single value.  Note, in the case of a range, the value is between
// the Min and Max values.
exports.parse_integer_argument = function(value) {
    var result;
    var tmp = exports.parse_integer_or_range(value);
    if(tmp == null) {
        return null;
    }
    if(tmp instanceof Array) {
        if(tmp[0] > tmp[1]) {
            // range needs to be MIN - MAX
            result = null;
        } else {
            result = Math.floor(Math.random() * (tmp[1] - tmp[0])) + tmp[0];
        }
    } else if(typeof tmp == 'number') {
        result = tmp
    } else {
        // invalid argument passed into par
        result = null;
    }
    return result;
}

var parse_argument_functions = {
    'int-range': function(value, defaultValue) {
        var result = null;
        if((typeof value == 'undefined') || (value == null)) {
            if((typeof defaultValue == 'undefined') || (defaultValue == null)) {
                throw new Error('Specified value or default invalid');
            } else {
                result = defaultValue;
            }
        } else {
            result = exports.parse_integer_argument(value);
            if(result == null) {
                throw new Error('\'int-range\' value specified invalid.');
            }
        }
        return result;
    }
}

exports.parse_argument = function(type, value, defaultValue) {
    if((typeof type == 'undefined') || (type == null) || !(type in parse_argument_functions)) {
        throw new Error('Specified argument type either undefined or not supported.');
    }
    return parse_argument_functions[type](value, defaultValue);
}