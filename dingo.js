"use strict"
// dingo.js
// 
// An implementation of a Chaos Monkey for Azure using the Azure NodeJS SDK.
// This application currently has the following assumptions:
//
//      1 - The resources the application should operate against are
//          Azure Resource Manager (ARM) based resources, in otherwords, the
//          application uses the newer Azure APIs.
//
//          Details about ARM is here: https://azure.microsoft.com/en-us/documentation/articles/resource-group-overview/
//
//      2 - Operations are performed by a Service Principal tied to an Active
//          Directory associated with the subscription.
//
//          More about creating a Service Principal can be found here:
//          https://azure.microsoft.com/en-us/documentation/articles/resource-group-authenticate-service-principal/
//
//          Note, currently only the password method is supported.

// modules
var DingoTest = require('./dingo_test').DingoTest;

var options = require('yargs')
    .usage('Usage $0 [options]')
    .option('t', { alias: 'tenant', describe: 'Tenant ID.', type: 'string' })
    .option('s', { alias: 'subscription', describe: 'Subscription ID.', type: 'string' })
    .option('c', { alias: 'client', describe: 'Client ID.', type: 'string' })
    .option('p', { alias: 'password', describe: 'Secret associated with the Client ID.', type: 'string' })
    .option('g', { alias: 'resourcegrp', describe: 'The resource group to operate in.', type: 'string' })
    .option('r', { alias: 'resource', describe: 'The name of the resource to operate on.', type: 'string' })
    .option('a', { alias: 'randomresource', describe: 'Choose a resource at random from the resource group.', type: 'boolean' })
    .option('o', { alias: 'operation', describe: 'The operation to perform on the specified resource.  Possible are: start, stop, restart, powercycle.', type: 'string' })
    .option('m', { alias: 'resourcematch', describe: 'A regular expression to match / filter the list of random resources.', type: 'string' })
    .option('u', { alias: 'duration', describe: 'The time to wait between start/stop type operations requiring two actual operations.  Can be an integer or a range (range will be random in the range).  Default will be 60 seconds.', type: 'string' })
    .option('n', { alias: 'testduration', describe: 'The total time to run multiple tests.  Note that the time is not absolute, if the current test runs long the process will stop after that test.  Can be an integer or a range (range will be random in the range).', type: 'string' })
    .option('d', { alias: 'testdelay', describe: 'The time to wait between each individual test.  If when time to run the next test and the total time has been exceeded, the process will exit.    Can be an integer or a range (range will be random in the range).  Default will be 60 seconds.', type: 'string' })
    .option('z', { alias: 'testrandom', describe: 'Run tests in random order.', type: 'boolean' })
    .option('v', { alias: 'resourcetype', describe: 'What type of resource to operate on.  Currently only \'vm\' supported.', type: 'string', default: 'vm' })
    .option('f', { alias: 'testfile', describe: 'JSON file defining test to run.  Note that any arguments specified on the command line may over ride values in the test file.', type: 'string' })
    .help('?')
    .alias('?', 'help')
    .argv;

// perform the operation
var test = DingoTest.generateTest(options);
test.go();
