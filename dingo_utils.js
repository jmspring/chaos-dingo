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

// Given an array, get a random element from that array
exports.random_array_entry = function(array) {
    if(array && array.length > 0) {
        var index = Math.floor(Math.random() *  array.length);
        return array[index];
    } else {
        return null;
    }
}