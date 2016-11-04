// arm_compute_ops.js
// 
// Operations to perform on compute resources.  Only works with ARM resources.
var ComputeManagementClient = require('azure-arm-compute');

var AZURE_CONSTANTS = require('./azure_constants');

var exports = module.exports = {};

function performVmssOperation(operation, client, resourceGroup, resource, callback) {
    if (client && resourceGroup && resource) {

        // This means we can specify the target VM instance inside a scale set -> e.g. in the test file -> "resource": "scaleset:0" otherwise it will select a random instance. 
        let hasInstanceAppended = resource.split(':').length > 1;
        let instanceId = -1;
        if (hasInstanceAppended) {
            instanceId = resource.split(':')[1];
            resource = resource.split(':')[0];
        }

        client.virtualMachineScaleSetVMs.list(resourceGroup, resource, (err, result) => {
            if (err) {
                console.error(err);
                throw err;
            }

            if (!hasInstanceAppended) {
                let indexToKill = Math.floor(Math.random() * result.length);
                instanceId = result[indexToKill].instanceId;
            }

            if (operation === 'restart') {
                client.virtualMachineScaleSetVMs.restart(resourceGroup, resource, instanceId, callback);
            } else if (operation === 'start') {
                client.virtualMachineScaleSetVMs.start(resourceGroup, resource, instanceId, callback);
            } else if (operation === 'stop') {
                client.virtualMachineScaleSetVMs.powerOff(resourceGroup, resource, instanceId, callback);
            } else {
                var err = new Error('Unsupported operation: ' + operation);
                if (callback) {
                    callback(err);
                } else {
                    throw err;
                }
            }
        });
    } else {
        var err = new Error('One or more required parameters null.  Operation: ' + operation);
        if (callback) {
            callback(err);
        } else {
            throw err;
        }
    }
}

function performVmOperation(operation, client, resourceGroup, resource, callback) {
    if (client && resourceGroup && resource) {
        if (operation === 'restart') {
            client.virtualMachines.restart(resourceGroup, resource, callback);
        } else if (operation === 'start') {
            client.virtualMachines.start(resourceGroup, resource, callback);
        } else if (operation === 'stop') {
            client.virtualMachines.powerOff(resourceGroup, resource, callback);
        } else {
            var err = new Error('Unsupported operation: ' + operation);
            if (callback) {
                callback(err);
            } else {
                throw err;
            }
        }
    } else {
        var err = new Error('One or more required parameters null.  Operation: ' + operation);
        if (callback) {
            callback(err);
        } else {
            throw err;
        }
    }
}

exports.vmOperations = {};
exports.vmOperations.restart_vm = function (client, resourceGroup, resource, callback) {
    performVmOperation('restart', client, resourceGroup, resource, callback);
};

exports.vmOperations.start_vm = function (client, resourceGroup, resource, callback) {
    performVmOperation('start', client, resourceGroup, resource, callback);
};

exports.vmOperations.stop_vm = function (client, resourceGroup, resource, callback) {
    performVmOperation('stop', client, resourceGroup, resource, callback);
};


exports.vmInfoOperations = {};
exports.vmInfoOperations.list_vms = function (client, resourceGroup, callback) {
    if (client && resourceGroup) {
        client.virtualMachines.list(resourceGroup, callback)
    } else {
        callback(new Error('list_vms: One or more required inputs missing.'));
    }
}

exports.vmssOperations = {};
exports.vmssOperations.restart_vm = function (client, resourceGroup, resource, callback) {
    performVmssOperation('restart', client, resourceGroup, resource, callback);
};
exports.vmssOperations.start_vm = function (client, resourceGroup, resource, callback) {
    performVmssOperation('start', client, resourceGroup, resource, callback);
};
exports.vmssOperations.stop_vm = function (client, resourceGroup, resource, callback) {
    performVmssOperation('stop', client, resourceGroup, resource, callback);
};

exports.vmssInfoOperations = {};
exports.vmssInfoOperations.list_vmss = function (client, resourceGroup, callback) {
    if (client && resourceGroup) {
        client.virtualMachineScaleSets.list(resourceGroup, callback);
    } else {
        callback(new Error('list_vmss: One or more required inputs missing.'));
    }
}