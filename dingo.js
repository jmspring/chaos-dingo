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
var adalNode = require('adal-node');
var async = require('async');
var azureCommon = require('azure-common');
var ComputeManagementClient = require('azure-arm-compute');

var armCompute = require('./arm_compute_ops');
var azureConstants = require('./azure_constants');

var operationTimeout = 60;  // time to wait before we timeout of an operation

var options = require('yargs')
    .usage('Usage $0 [options]')
    .option('t', { alias: 'tenant', describe: 'Tenant ID.', demand: true, type: 'string' } )
    .option('s', { alias: 'subscription', describe: 'Subscription ID.', demand: true, type: 'string' } )
    .option('c', { alias: 'client', describe: 'Client ID.', demand: true, type: 'string' } )
    .option('p', { alias: 'password', describe: 'Secret associated with the Client ID.', demand: true, type: 'string' } )
    .option('g', { alias: 'resourcegrp', describe: 'The resource group to operate in.', demand: true, type: 'string' } )
    .option('r', { alias: 'resource', describe: 'The name of the resource to operate on.', demand: true, type: 'string' } )
    .option('o', { alias: 'operation', describe: 'The operation to perform on the specified resource.  Possible are: start, stop, restart.', demand: true, type: 'string' })
    .help('?')
    .alias('?', 'help')
    .argv;

if(!options.tenant ||
        !options.subscription ||
        !options.client ||
        !options.password ||
        !options.resourcegrp ||
        !options.resource) {
    process.exit(1);
}

var vmFunction = null;
switch(options.operation) {
    case 'start':
        vmFunction = armCompute.start_vm;
        break;
    case 'stop':
        vmFunction = armCompute.stop_vm;
        break;
    case 'restart':
        vmFunction = armCompute.restart_vm;
        break;
    default:
        throw new Error('Unsupported operation.  Operation: ' + options.operation);
}

var client;
var response;
var credentials;
var context = new adalNode.AuthenticationContext(azureConstants.AUTHORIZATION_ENDPOINT + options.tenant);
async.series([
    function (next) {
        context.acquireTokenWithClientCredentials(azureConstants.ARM_RESOURCE_ENDPOINT, 
                                                  options.client, 
                                                  options.password,
                                                  function(err, result){
            if (err) throw err;
            response = result;
            next();
        });
    },
    function (next) {
        credentials = new azureCommon.TokenCloudCredentials({
            subscriptionId : options.subscription,
            authorizationScheme : response.tokenType,
            token : response.accessToken
        });

        next();
    },
    function (next) {
        vmFunction(credentials, options.resourcegrp, options.resource, function(err, result) {
            if(err) {
                throw err;            
            } else {
                console.log("Operation " + options.operation + " succeeded.");
            }
        });
    }
]);
