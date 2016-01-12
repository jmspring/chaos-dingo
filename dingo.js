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
var DingoJob = require('./dingo_job').DingoJob;
var DingoJobPipeline = require('./dingo_job_pipeline').DingoJobPipeline;

var options = require('yargs')
    .usage('Usage $0 [options]')
    .option('t', { alias: 'tenant', describe: 'Tenant ID.', demand: true, type: 'string' } )
    .option('s', { alias: 'subscription', describe: 'Subscription ID.', demand: true, type: 'string' } )
    .option('c', { alias: 'client', describe: 'Client ID.', demand: true, type: 'string' } )
    .option('p', { alias: 'password', describe: 'Secret associated with the Client ID.', demand: true, type: 'string' } )
    .option('g', { alias: 'resourcegrp', describe: 'The resource group to operate in.', demand: true, type: 'string' } )
    .option('r', { alias: 'resource', describe: 'The name of the resource to operate on.', type: 'string' } )
    .option('a', { alias: 'randomresource', describe: 'Choose a resource at random from the resource group.  (Limited to VMs)', type: 'boolean' })
    .option('o', { alias: 'operation', describe: 'The operation to perform on the specified resource.  Possible are: start, stop, restart, powercycle.', demand: true, type: 'string' })
    .option('m', { alias: 'resourcematch', describe: 'A regular expression to match / filter the list of random resources.', type: 'string' })
    .option('u', { alias: 'duration', describe: 'The time to wait between start/stop type operations requiring two actual operations.  Can be an integer or a range (range will be random in the range).  Default will be 60 seconds.', type: 'string' })
    .help('?')
    .alias('?', 'help')
    .argv;

if(!options.tenant ||
        !options.subscription ||
        !options.client ||
        !options.password ||
        !options.resourcegrp) {
    process.exit(1);
} else if(!options.randomresource && !options.resource) {
    console.log("Either a resource is required or select one at random.");
    process.exit(1);
} else if(options.randomresource && options.resource) {
    console.log("Can not specify choose a random resource and specify an actual resource.");
    process.exit(1);
} else if(options.resource && options.resourcematch) {
    console.log("Can not specify a resource match pattern when specifying a specific resource.");
    process.exit(1);
}

var resource;
if(options.randomresource) {
    resource = { 'random': true }
    if(options.resourcematch) {
        resource['match'] = options.resourcematch;
    }
} else {
    resource = options.resource;
}

// perform the operation
var job = new DingoJob('vm', options.operation, options.resourcegrp, resource, { duration: options.duration });
var pipeline = new DingoJobPipeline(options.tenant, options.subscription, options.client, options.password, job);
pipeline.go(function(err, result) {
    if(err) {
        console.log('Attempt to process job failed.  Error:' + err);
        process.exit(1);
    } else {
        if(result) {
            console.log('Processing of job completed with status: ' + result);
        }
    }
});
