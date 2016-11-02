// dingo_pipeline.js
//
// Given a job object, construct the pipeline of operations and perform the operation
// specified in the job.
"use strict";

var adalNode = require('adal-node');
var async = require('async');
var azureCommon = require('azure-common');
var ComputeManagementClient = require('azure-arm-compute');
var armCompute = require('./arm_compute_ops');
var azureConstants = require('./azure_constants');
var dingoUtils = require('./dingo_utils');
const DingoJobPipeline = class DingoJobPipeline {
	constructor(tenantId, subscriptionId, clientId, password, job) {
		this.tenantId = tenantId;
		this.subscriptionId = subscriptionId;
		this.clientId = clientId;
		this.password = password;
		this.job = job;
		// runtime variables
		this.client = null;
		this.credentials = null;
		this.resource = null;
	}
}

// functions set up as an async series to process the job
DingoJobPipeline.prototype.authenticate_user = function (next) {
	console.log('Authenticating user.');
	var obj = this;
	var context = new adalNode.AuthenticationContext(azureConstants.AUTHORIZATION_ENDPOINT + this.tenantId);
	context.acquireTokenWithClientCredentials(azureConstants.ARM_RESOURCE_ENDPOINT,
		this.clientId,
		this.password,
		function (err, result) {
			if (err) throw err;
			obj.credentials = new azureCommon.TokenCloudCredentials({
				subscriptionId: obj.subscriptionId,
				authorizationScheme: result.tokenType,
				token: result.accessToken
			});
			next();
		});
}

DingoJobPipeline.prototype.generate_client = function (next) {
	console.log('Generate client.');
	this.client = new ComputeManagementClient(this.credentials, this.subscriptionId);
	next();
}

DingoJobPipeline.prototype.determine_resource = function (next) {
	if (this.job.getResource() == null) {
		var obj = this;
		var resource = null;
		if (this.job.type === 'vmss') {
			armCompute.vmssInfoOperations.list_vmss(this.client, this.job.resourceGroup, function (err, result) {
				parse_resource_list(err, result, next, obj);
			});
		} else {
			armCompute.vmInfoOperations.list_vms(this.client, this.job.resourceGroup, function (err, result) {
				parse_resource_list(err, result, next, obj);
			});
		}
	} else {
		this.resource = this.job.getResource();
		console.log('Resource to perform operation on: ' + this.resource);
		next();
	}
}

var parse_resource_list = function (err, result, next, obj) {
	if (err) {
		throw err;
	} else {
		dingoUtils.parse_vm_list(result, function (err, result) {
			if (err) {
				throw err;
			} else {
				// Check to see if the list of resources is filtered by name
				if (obj.job.getResourceMatch() != null) {
					var vms = result;
					dingoUtils.filter_vm_list(obj.job.getResourceMatch(), vms, function (err, result) {
						if (err) {
							throw err;
						} else {
							if (result.length == 0) {
								throw new Error('No resources matched.');
							} else {
								var tmp = dingoUtils.random_array_entry(result)
								for (var i = 0; i < vms.length; i++) {
									if (vms[i] == tmp) {
										obj.resource = tmp;
										break;
									}
								}
								if (!obj.resource) {
									throw new Error('Resource match pattern specified did not find a valid resource');
								}
							}
						}
					});
				} else {
					obj.resource = dingoUtils.random_array_entry(result);
				}
			}
		});
	}
	console.log('Resource to perform operation on: ' + obj.resource);
	next();
}

DingoJobPipeline.prototype.perform_operation = function (phase, next) {
	if (!this.job.isMultistep()) {
		console.log('Start operation: ' + this.job.operation);
	} else {
		console.log('Starting phase ' + phase + ' of operation: ' + this.job.operation);
	}
	var obj = this;
	this.job.performOperation(phase, this.client, this.resource, function (err, result) {
		if (err) {
			throw err;
		} else {
			if (!obj.job.isMultistep()) {
				console.log('Operation: ' + obj.job.operation + ' succeeded.');
			} else {
				console.log('Phase ' + phase + ' of operation: ' + obj.job.operation + ' succeeded.');
			}
		}
		if (next) {
			next();
		}
	});
}
DingoJobPipeline.prototype.pause_between_operations = function (next) {
	var duration = this.job.getOperationDuration();
	console.log('Pausing for ' + duration + ' seconds.');
	setTimeout(function () {
		next();
	}, duration * 1000);
}

DingoJobPipeline.prototype.finish_job = function (next) {
	if (this.callback) {
		this.callback(null, true);
	}
}

DingoJobPipeline.prototype.go = function (callback) {
	var create_perform_operation_function = function (object, phase) {
		return function (next) {
			object.perform_operation(phase, next);
		};
	}

	var create_async_object_function = function (object, func) {
		return function (next) {
			func.apply(object, [next]);
		}
	}

	var asyncOps = [
		create_async_object_function(this, this.authenticate_user),
		create_async_object_function(this, this.generate_client),
		create_async_object_function(this, this.determine_resource)
	]

	var stepCount = this.job.getStepCount();
	for (var i = 0; i < stepCount; i++) {
		asyncOps.push(create_perform_operation_function(this, i));
		if (i + 1 < stepCount) {
			asyncOps.push(create_async_object_function(this, this.pause_between_operations));
		}
	}

	asyncOps.push(function (next) {
		callback(null, true);
	});

	async.series(asyncOps);
}

module.exports = { DingoJobPipeline };