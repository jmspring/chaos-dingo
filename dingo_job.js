// dingo_job.js
//
// Encapsulates the necessary information for each job specification.
"use strict";

var dingoJobTypes = require('./dingo_job_types');
var dingoUtils = require('./dingo_utils');

const DingoJob = class DingoJob {
    constructor(type, operation, resourceGroup, resource, jobArgs) {
        // Verify it is a known job type and operation.
        if(!(type in dingoJobTypes)) {
            throw new Error('Specified job type not supported.  Type: ' + type);
        } else if(!(operation in dingoJobTypes[type]['operations'])) {
            throw new Error('Operation specified not supported by type.  Type: ' + type + ', Operation: ' + operation);
        }
        
        this.type = dingoJobTypes[type];
        this.operation = operation;
        this.resourceGroup = resourceGroup;
        if(typeof resource == 'string') {
            this.resource = resource;
        } else {
            this.resourceMatch = resource.match;
        }
        
        var opArgs = null;
        if('args' in this.type.operations[this.operation]) {
            opArgs = this.type.operations[this.operation]['args'];
        }
        
        // inject operational specific arguments
        if(opArgs && (typeof jobArgs == 'object')) {
            for(var a in jobArgs) {
                if(a in opArgs) {
                    this[a] = jobArgs[a];
                }
            }
        }
        
        // verify required parameters
        if('args' in this.type.operations[this.operation]) {
            var args = this.type.operations[this.operation]['args'];
            for(var a in args) {
                if(!(a in this)) {
                    throw new Error('Required argument missing.  Argument: ' + a);
                } else {
                    // verify we get something reasonable from the required values
                    var argType = args[a].type;
                    var value = this[a]
                    var defaultValue;
                    if('defaultValue' in args[a]) {
                        defaultValue = args[a].defaultValue;
                    }
                    try {
                        var tmp = dingoUtils.parse_argument(argType, value, defaultValue);
                    } catch(ex) {
                        throw new Error('Value specified for argument invalid.  Type: ' + argType + ', Operation: ' + operation + ', Value: ' + value);
                    }
                }
            }
        }
    }
}

// Was a resource specified?
DingoJob.prototype.getResource = function() {
    var resource = null;
    if('resource' in this) {
        if(typeof this != 'string') {
            throw new Error('Unknown type for resource supplied.');
        }
        resource = this.resource;
    }
    return resource;
}

// Was a resourceMatch specified?
DingoJob.prototype.getResourceMatch = function() {
    var resourceMatch = null;
    if('resourceMatch' in this) {
        if(typeof this.resourceMatch != 'string') {
            throw new Error('Unknown type for resourceMatch supplied.');
        }
        resourceMatch = this.resourceMatch;
    }
    return resourceMatch;
}

// Does this operation / job require a begin and end action.  Only a two phase
// function is currently supported per job.
DingoJob.prototype.isMultistep = function() {
    if(typeof this.type.operations[this.operation].op == 'function') {
        return false;
    } else {
        return true;
    }
}

// For multistep operations, retrieve the duration in between each step
DingoJob.prototype.getOperationDuration = function() {
    var result = 0;
    if(typeof this.type.operations[this.operation].op == 'object') {
        if('args' in this.type.operations[this.operation]) {
            var args = this.type.operations[this.operation]['args'];
            if('duration' in args) {
                var type = args['duration'].type;
                var value = this.duration;
                var defaultValue;
                if('defaultValue' in args['duration']) {
                    defaultValue = args['duration']['defaultValue'];
                }
                try {
                    result = dingoUtils.parse_argument(type, value, defaultValue);
                } catch(ex) {
                    throw new Exception('Unable to parse duration argument.');
                }
            }
        }
    }
    return result;
}

// Perform the operation.  The external control will determine the resource to
// use based on information from the job.
DingoJob.prototype.performOperation = function(phase, client, resource, callback) {
    var opArgs = [ client, this.resourceGroup, resource ];
    if('args' in this.type.operations[this.operation]) {
        var args = this.type.operations[this.operation]['args'];        
        for(var a in args) {
            if('includeInCall' in args[a] && args[a]['includeInCall']) {
                var type = args[a]['type'];
                var value = this[a];
                var defaultValue;
                if('defaultValue' in args[a]) {
                    defaultValue = args[a]['defaultValue'];
                }
                opArgs.push(dingoUtils.parse_argument(type, value, defaultValue));
            }
        }
    }
    opArgs.push(callback);
    
    var func;
    if(typeof this.type.operations[this.operation].op == 'function') {
        func = this.type.operations[this.operation].op;
    } else {
        var tmp = this.type.operations[this.operation].op;
        if(tmp.length < phase) {
            throw new Error('Operation function requested is not present.  Phase: ' + phase);
        }
        func = this.type.operations[this.operation].op[phase];
    }
    func.apply(this, opArgs);
}

module.exports = { DingoJob };
