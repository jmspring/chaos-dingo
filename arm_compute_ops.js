// arm_compute_ops.js
// 
// Operations to perform on compute resources.  Only works with ARM resources.
var ComputeManagementClient = require('azure-arm-compute');

var AZURE_CONSTANTS = require('./azure_constants');

var exports = module.exports = {};

function performVmOperation(operation, credentials, subscriptionId, resourceGroup, resource, callback) {
    if(credentials && resourceGroup && resource) {
        var client = new ComputeManagementClient(credentials, subscriptionId);
        console.log(callback);
        if(operation === 'restart') {
            client.virtualMachines.restart(resourceGroup, resource, callback);
        } else if(operation === 'start') {
            client.virtualMachines.start(resourceGroup, resource, callback);
        } else if(operation === 'stop') {
            client.virtualMachines.powerOff(resourceGroup, resource, callback);
        } else {
            if(callback) {
                callback('Unsupported operation: ' + operation);
            } else {
                throw new Error('Unsupported operation: ' + operation);
            }
        }
    } else {
        if(callback) {
            callback('One or more required parameters null.  Operation: ' + operation);
        } else {
            throw new Error('One or more required parameters null.  Operation: ' + operation);
        }
    }
}

exports.restart_vm = function(credentials, resourceGroup, resource, callback) {
    performVmOperation('restart', credentials, resourceGroup, resource, callback);
};

exports.start_vm = function(credentials, resourceGroup, resource, callback) {
    performVmOperation('start', credentials, resourceGroup, resource, callback);
};

exports.stop_vm = function(credentials, resourceGroup, resource, callback) {
    performVmOperation('stop', credentials, resourceGroup, resource, callback);
};