// dingo_job.js
//
// Encapsulates the necessary information for each job specification.
"use strict";

var dingoJobTypes = require('./dingo_job_types');
var dingoUtils = require('./dingo_utils');

const DingoJob = class DingoJob {
    constructor(type, operation, resourceGroup, resource, jobArgs) {
        if(!type || !resourceGroup || !operation) {
            throw new Error('Unable to create DingoJob object.  One or more required values not specified or null.');
        }
    
        // Verify it is a known job type and operation.  In the case of a
        // 'random' operation, verify the specified type contains allowed
        // 'random' operations.
        if(!(type in dingoJobTypes)) {
            throw new Error('Specified job type not supported.  Type: ' + type);
        } else {
            if(operation != '*') {
                if(!(operation in dingoJobTypes[type]['operations'])) {
                    throw new Error('Operation specified not supported by type.  Type: ' + type + ', Operation: ' + operation);
                }
            } else {
                var randomOps = [];
                for(var o in dingoJobTypes[type]['operations']) {
                    if('allowRandom' in dingoJobTypes[type]['operations'][o]) {
                        if(dingoJobTypes[type]['operations'][o]['allowRandom']) {
                            randomOps.push(o);
                        }
                    }
                }
                if(randomOps.length == 0) {
                    throw new Error('Random operation requested for type \'' + type + '\'.  No random operations supported.')
                }
                operation = dingoUtils.random_array_entry(randomOps);
                this.randomOperation = true;
            }
        }
        
        this.type = type;
        this.operation = operation;
        this.resourceGroup = resourceGroup;
        if(typeof resource == 'string') {
            this.resource = resource;
        } else {
            this.resourceMatch = resource.match;
        }
        
        // Since an operation could be random, required arguments must be specified
        // or have default values.  If not, an Error will be thrown.
        this.extraArgs = jobArgs;
        
        var typeDetails = dingoJobTypes[type];
        
        var opArgs = null;
        if('args' in typeDetails.operations[this.operation]) {
            opArgs = typeDetails.operations[this.operation]['args'];
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
        if('args' in typeDetails.operations[this.operation]) {
            var args = typeDetails.operations[this.operation]['args'];
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
        if(typeof this.resource != 'string') {
            throw new Error('Unknown type for resource supplied.');
        }
        resource = this.resource;
    }
    return resource;
}

// Was a resourceMatch specified?
DingoJob.prototype.getResourceMatch = function() {
    var resourceMatch = null;
    if('resourceMatch' in this && this.resourceMatch) {
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
    if(typeof dingoJobTypes[this.type].operations[this.operation].op == 'function') {
        return false;
    } else {
        return true;
    }
}

// How many steps are there in this job?
DingoJob.prototype.getStepCount = function() {
    if(typeof dingoJobTypes[this.type].operations[this.operation].op == 'function') {
        return 1;
    } else {
        return dingoJobTypes[this.type].operations[this.operation].op.length;
    }
}


// For multistep operations, retrieve the duration in between each step
DingoJob.prototype.getOperationDuration = function() {
    var result = 0;
    if(typeof dingoJobTypes[this.type].operations[this.operation].op == 'object') {
        if('args' in dingoJobTypes[this.type].operations[this.operation]) {
            var args = dingoJobTypes[this.type].operations[this.operation]['args'];
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
    if('args' in dingoJobTypes[this.type].operations[this.operation]) {
        var args = dingoJobTypes[this.type].operations[this.operation]['args'];        
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
    if(typeof dingoJobTypes[this.type].operations[this.operation].op == 'function') {
        func = dingoJobTypes[this.type].operations[this.operation].op;
    } else {
        var tmp = dingoJobTypes[this.type].operations[this.operation].op;
        if(tmp.length < phase) {
            throw new Error('Operation function requested is not present.  Phase: ' + phase);
        }
        func = dingoJobTypes[this.type].operations[this.operation].op[phase];
    }
    func.apply(this, opArgs);
}

// Generate and return a job object based on inputs.
// TODO -- Optional args needs to be expanded.
DingoJob.generateJob = function(type, operation, resourceGroup, resource, resourceMatch, randomResource, duration)
{
    // Generate the resource structure
    var res;
    if(randomResource) {
        res = { 'random': true }
        if(resourceMatch) {
            res['match'] = resourceMatch;
        }
    } else {
        res = resource;
    }
    resource = res;

    var job = new DingoJob(type, operation, resourceGroup, resource, { duration: duration });
    return job;
}

// Regenerate a job based on the current job.
DingoJob.prototype.regenerateJob = function() {
    var operation;
    if(this.randomOperation) {
        operation = "*";
    } else {
        operation = this.operation;
    }
    
    var resource;
    if(!this.resource) {
        resource = {};
        if(this.resourceMatch) {
            resource['match'] = this.resourceMatch;
        }
    } else {
        resource = currentJob.resource;
    }
    
    return new DingoJob(this.type, operation, this.resourceGroup, resource, this.extraArgs);
}

DingoJob.prototype.dumpJob = function(indent) {
    var offset = "";
    if((typeof indent == 'number') && (indent > 0)) {
        offset = new Array(indent + 1).join(' ');
    }
    console.log(offset + "Job:")
    console.log(offset + "    Type:           " + this.type);
    console.log(offset + "    Operation:      " + (this.randomOperation ? "*" : this.operation));
    console.log(offset + "    Resource Group: " + this.resourceGroup);
    console.log(offset + "    Resource:       " + (!this.resource ? "*" : this.resource));
    if(this.resourceMatch) {
        console.log(offset + "    Resource Match: " + this.resourceMatch);
    }
    if(this.extraArgs && (Object.keys(this.extraArgs).length > 0)) {
        console.log(offset + "    Extra args:")
        for(var k in this.extraArgs) {
            console.log(offset + "        " + k + ": " + this.extraArgs[k]);
        }
    }
}

module.exports = { DingoJob };
