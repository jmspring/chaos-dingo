// arm_compute_ops.js
// 
// Operations to perform on compute resources.  Only works with ARM resources.
var ComputeManagementClient = require('azure-arm-compute');

var AZURE_CONSTANTS = require('./azure_constants');

var exports = module.exports = {};

function performVmOperation(operation, client, resourceGroup, resource, callback) {
    if(client && resourceGroup && resource) {
        if(operation === 'restart') {
            client.virtualMachines.restart(resourceGroup, resource, callback);
        } else if(operation === 'start') {
            client.virtualMachines.start(resourceGroup, resource, callback);
        } else if(operation === 'stop') {
            client.virtualMachines.powerOff(resourceGroup, resource, callback);
        } else {
            var err = new Error('Unsupported operation: ' + operation);
            if(callback) {
                callback(err);
            } else {
                throw err;
            }
        }
    } else {
        var err = new Error('One or more required parameters null.  Operation: ' + operation);
        if(callback) {
            callback(err);
        } else {
            throw err;
        }
    }
}

exports.vmOperations = {};
exports.vmOperations.restart_vm = function(client, resourceGroup, resource, callback) {
    performVmOperation('restart', client, resourceGroup, resource, callback);
};

exports.vmOperations.start_vm = function(client, resourceGroup, resource, callback) {
    performVmOperation('start', client, resourceGroup, resource, callback);
};

exports.vmOperations.stop_vm = function(client, resourceGroup, resource, callback) {
    performVmOperation('stop', client, resourceGroup, resource, callback);
};


exports.vmInfoOperations = {};
exports.vmInfoOperations.list_vms = function(client, resourceGroup, callback) {
    if(client && resourceGroup) {
        client.virtualMachines.list(resourceGroup, callback)
    } else {
        callback(new Error('list_vms: One or more required inputs missing.'));
    }
}