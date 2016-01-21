// dingo_test.js
//
// Class for encapsulating test information.
"use strict";

var fs = require('fs');

var dingoJobTypes = require('./dingo_job_types');
var dingoUtils = require('./dingo_utils');
var DingoJob = require('./dingo_job').DingoJob;
var DingoJobPipeline = require('./dingo_job_pipeline').DingoJobPipeline;

const DingoTest = class DingoTest {
    constructor(tenantId, subscriptionId, clientId, clientSecret, duration, delay, randomOrder) {
        this.tenantId = tenantId;
        this.subscriptionId = subscriptionId;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.testDuration = 0;
        this.testDelay = 0;
        this.testRandomOrder = false;
        
        if(duration) {
            this.testDuration = duration;
        }
        if(delay) {
            this.testDelay = delay;
        }
        if(randomOrder) {
            this.testRandomOrder = true;
        }
        
        this.jobs = [];
    }
}

// Add a job to the test.
DingoTest.prototype.addJob = function(job) {
    this.jobs.push(job);
}

// Display test details
DingoTest.prototype.dumpTest = function() {
    console.log("Test defined:");
    console.log("    Tenant Id:      " + this.tenantId);
    console.log("    Subcription Id: " + this.subscriptionId);
    console.log("    Client Id:      " + this.clientId);
    console.log("    Client Secret:  " + this.clientSecret);
    console.log("");
    console.log("Global properties:");
    console.log("    Test duration:  " + this.testDuration);
    console.log("    Test delay:     " + this.testDelay);
    console.log("    Random Order:   " + this.testRandomOrder);
    console.log("");
    console.log("Jobs:");
    for(var i = 0; i < this.jobs.length; i++) {
        this.jobs[i].dumpJob(4);
    }    
}

// Parse the command line and create the test.
DingoTest.generateTest = function(args) {
    if(!args) {
        throw new Error('Unable to generate test.  No arguments supplied.');
    }
    
    // command line overrides settings in a test file
    var tenantId = args.tenant;
    var subscriptionId = args.subscription;
    var clientId = args.client;
    var clientSecret = args.password;
    
    var testDuration = dingoUtils.parse_argument('int-range', args.testduration, 60);
    var testDelay = dingoUtils.parse_argument('int-range', args.testdelay, 60);
    var randomOrder = args.testrandom;
    
    var jobs = [];
    
    if(args.testfile) {
        if(!args.testfile) {
            throw new Error('Unable to generate test.  No test file specified.');
        }
        
        var testJson;
        try {
            var testfile = fs.readFileSync(args.testfile);
            testJson = JSON.parse(testfile);
        } catch(ex) {
            throw new Error('Unable to generate test.  Failure reading test file.  File: ' + args.testfile + ', Error: ' + ex);
        }
        
        // validate json content, if items missing or if a command line option exists, that takes precedence
        if(!tenantId) { tenantId = testJson.tenantId; }
        if(!subscriptionId) { subscriptionId = testJson.subscriptionId; }
        if(!clientId) { clientId = testJson.clientId; }
        if(!clientSecret) { clientSecret = testJson.clientSecret; }
        
        // Flags for how to run test jobs.  Default is run each test once.
        if(!args.testduration && testJson.testDuration) {
            testDuration = dingoUtils.parse_argument('int-range', testJson.testDuration, 0);
        }
        if(!args.testdelay && testJson.testDelay) {
            testDelay = dingoUtils.parse_argument('int-range', testJson.testDelay, 0);
        }
        if(!randomOrder) { randomOrder = testJson.randomOrder ? testJson.randomOrder : false; }
        
        if((typeof testJson.jobs != 'object') && !(testJson.jobs instanceof Array)) {
            throw new Error('\'jobs\' section of test file required and conform to the valid format.');
        }
        var jobList = testJson.jobs;
        
console.log("POOP");
console.log("---- " + args.resourceMa);
        for(var i = 0; i < jobList.length; i++) {
            var j = jobList[i];
console.log("++++ " + j.resourceMatch);
            jobs.push({
                type: j.type,
                operation: j.operation,
                resourceGroup: (args.resourcegrp ? args.resourcegrp : j.resourceGroup),
                resource: (args.resource ? (args.resource == '*' ? null : args.resource) : (j.resource == "*" ? null : j.resource)),
                resourceMatch: (args.resourcematch ? args.resourcematch : j.resourceMatch),
                randomResource: (args.randomresource ? true : (j.resource == '*' ? true : false)),
                duration: dingoUtils.parse_argument('int-range', (args.duration ? args.duration : (j.duration ? j.duration : 60)), 60)
            });
        }
    } else {
        // job arguments
        var type = args.resourcetype;
        var operation = args.operation;
        var resourceGroup = args.resourcegrp;
        var resource = (args.resource == '*' ? null : args.resource);
        var resourceMatch = args.resourcematch;
        var randomResource = (args.randomresource ? true : (resource == null ? true : false));
        var duration = dingoUtils.parse_argument('int-range', args.duration, 60);
        if(!type || !operation || !resourceGroup) {
            throw new Error('Required parameters not specified.');
        }
                
        jobs.push({
            type: type,
            operation: operation,
            resourceGroup: resourceGroup,
            resource: resource,
            resourceMatch: resourceMatch,
            randomResource: randomResource,
            duration: duration
        });
    }
        
    if(!tenantId) { throw new Error('Required parameter \'tenantId\' not specified.'); }
    if(!subscriptionId) { throw new Error('Required parameter \'subscriptionId\' not specified.'); }
    if(!clientId) { throw new Error('Required parameter \'clientId\' not specified.'); }
    if(!clientSecret) { throw new Error('Required parameter \'clientSecret\' not specified.'); }
    
    if(jobs.length == 0) {
        throw new Error('No jobs specified.');
    }
    
    var test = new DingoTest(tenantId, subscriptionId, clientId, clientSecret, testDuration, testDelay, randomOrder);
    for(var i = 0; i < jobs.length; i++) {
        var j = jobs[i];
        var job = DingoJob.generateJob(j.type, j.operation, j.resourceGroup, j.resource, j.resourceMatch, j.randomResource, j.duration);        
        test.addJob(job);
    }
    
    test.dumpTest();
    return test;
}

function randomArrayOfN(n) {
    var result = [];
    while(result.length < n) {
        var r = Math.floor(Math.random() * n);
        var found = false;
        for(var i = 0; i < result.length; i++) {
            if(r == result[i]) {
                found = true;
                break;
            }
        }
        if(!found) {
            result.push(r);
        }
    }
    return result;
}

DingoTest.processJob = function(manager, jobSequence, startTime, currentIndex) {
    var pipeline = new DingoJobPipeline(manager.tenantId, 
                                        manager.subscriptionId,
                                        manager.clientId,
                                        manager.clientSecret, 
                                        manager.jobs[jobSequence[currentIndex]])
    pipeline.go(function(err, result) {
        if(err) {
            throw new Error('Attempt to process job failed.  Error: ' + err);
        } else {
            if(manager.testDuration) {
                var now = Date.now();
                if(now - startTime >= (manager.testDuration * 1000)) {
                    console.log('Total test time exceeded.  Shutting down.');
                    process.exit(0);
                }
            } else if(currentIndex + 1 >= jobSequence.length) {
                console.log('All tests run.');
                process.exit(0);
            }
            
            if(manager.jobs[jobSequence[currentIndex]].randomOperation) {
                var updatedJob = manager.jobs[jobSequence[currentIndex]].regenerateJob();
                manager.jobs[jobSequence[currentIndex]] = updatedJob;
            }
            
            if(currentIndex + 1 == jobSequence.length) {
                if(manager.testRandomOrder) {
                    jobSequence = randomArrayOfN(manager.jobs.length);
                }
                currentIndex = 0;
            } else {
                currentIndex++;
            }

            setTimeout(function() {
                DingoTest.processJob(manager, jobSequence, startTime, currentIndex)
            }, manager.testDelay * 1000);
        }
    });
}

DingoTest.prototype.go = function() {
    var manager = this;
    var startTime = Date.now();

    
    // test details
    var jobSequence;
    if(manager.testRandomOrder) {
        jobSequence = randomArrayOfN(manager.jobs.length);
    } else {
        jobSequence = [];
        for(var i = 0; i < manager.jobs.length; i++) { jobSequence.push(i); }
    }
    
    DingoTest.processJob(manager, jobSequence, startTime, 0);
}

module.exports = { DingoTest };
