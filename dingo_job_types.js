// dingo_job_types.js
//
// Specific information by job type to allow validation, etc.
var armCompute = require('./arm_compute_ops');

exports = module.exports = {};

exports.vmss = {
    operations: {
        start: {
            op: armCompute.vmssOperations.start_vm
        },
        stop: {
            op: armCompute.vmssOperations.stop_vm
        },
        restart: {
            op: armCompute.vmssOperations.restart_vm,
            allowRandom: true
        },
        powercycle: {
            op: [armCompute.vmssOperations.stop_vm, armCompute.vmssOperations.start_vm],
            args: {
                duration: {
                    type: 'int-range',
                    defaultValue: 60,
                    includeInCall: false
                }
            },
            allowRandom: true
        }
    }
};

exports.vm = {
    operations: {
        start: {
            op: armCompute.vmOperations.start_vm
        },
        stop: {
            op: armCompute.vmOperations.stop_vm
        },
        restart: {
            op: armCompute.vmOperations.restart_vm,
            allowRandom: true
        },
        powercycle: {
            op: [armCompute.vmOperations.stop_vm, armCompute.vmOperations.start_vm],
            args: {
                duration: {
                    type: 'int-range',
                    defaultValue: 60,
                    includeInCall: false
                }
            },
            allowRandom: true
        }
    }
};