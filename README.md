# chaos-dingo
Monkey and Lemur are taken, so Chaos Dingo it is.  This is a tool to mess with
Azure services using the Azure NodeJS SDK.

The initial approach started with [WazMonkey](https://github.com/smarx/WazMonkey) 
by Steve Marx, but modernizing it for Azure Resource Manager based services
and leverage the Azure NodeJS SDK.

Chaos Dingo currently supports performing operations on Azure VMs deployed to 
an Azure Resource Manager based resource group.  It does not support 'Classic'
Azure VMs.

In order to run Chaos Dingo, you will need an Azure Subscription, a Resource 
Group with one or more resources in it (currently only VMs), and a Service 
Principal with permissions to perform actions on those resources within the 
Resource Group.

If you aren't familiar with what a Service Principal is, I recommend starting
by taking a look [here](http://innerdot.com/tag/active-directory.html).

There are two ways to interact with the Chaos Dingo, via the command line or
via a test file.  From the command line, you are limited to working with a
specific Resource Group and either a specific resource (or a randomly selected
resource).  One that resource, you can either perform a specific operation or
a randomly selected one.  There are also flags that allow you to trigger operations
over a period of time (for instance every two minutes for ten minutes).

The second way to work the Chaos Dingo is to use a test file.  The test file
has the the following format:

        {
            "tenantId": "<tenant id>"
            "subscriptionId": "<subscription id>",
            "clientId": "<client id>",
            "clientSecret": "<client secret/password>",
            "testDuration": "<test duration>",
            "testDelay": "<test delay>",
            "randomOrder": "<true/false>"
            "jobs": [
                { "type": "<operation type>", "operation": "<operation>", "resourceGroup": "<resource group>", "resource": "<resource>", ["duration": "<duration>"] },
                ...
            ]
        }
        
The first section of the test file defines "global properties" of the test run.  It
should be noted that **testDuration**, **testDelay**, and **randomOrder** are optional
in this file.  Also, if one of the values in this "global properties" is defined on
the command line, the command line value will be used in place of the value in the 
test file.  The fields and what they are used for are as follows:

- **tenantId**: The UUID referring to your Azure Active Directory tenant
- **subscriptionId**:  The UUID referring to the subscription resources belong to
- **clientId**:  The UUID of your the application tied to your Service Principal
- **clientSecret**: The password associated with the Service Principal
- **testDuration**: A value (can be a single value or range) in seconds on how long to run jobs in the test
- **testDelay**: A value (can be a single value or a range) in seconds on how long to pause between jobs
- **randomOrder**: A boolean value that when true will pick jobs from the list in random order.  Note that  all jobs will be run prior to restarting the whole test run, just done in random order

The second "section" of this file **jobs** is where you define individual operations to
perform.  

- **type**: A string denoting the type of resource an operation will be performed on.
- **operation**: Within each **type** of resource, there are predefined operations allowed.  If the value is **"*"**, then an operation will be chosen at random.
- **resourceGroup**: The resource group the resource to act upon is located.
- **resource**: The resource to act upon.  If the value is **"*"**, then a resource will be chosen at random.
- **resourceMatch**: If selecting a random resource is specified, then an optional regex can be defined using this entry to filter which resources are chosen.
- **duration**: This is an optional value.  Some operations are multi-step, this defines the delay between each step.  The value can be a single integer or a range.

The various fields above map directly to specific command line values.

Here are the Chaos Dingo command line options:

        node ./dingo.js -?
        Usage dingo.js [options]

        Options:
          -t, --tenant          Tenant ID.                                      [string]
          -s, --subscription    Subscription ID.                                [string]
          -c, --client          Client ID.                                      [string]
          -p, --password        Secret associated with the Client ID.           [string]
          -g, --resourcegrp     The resource group to operate in.               [string]
          -r, --resource        The name of the resource to operate on.         [string]
          -a, --randomresource  Choose a resource at random from the resource group.
                                (Limited to VMs)                               [boolean]
          -o, --operation       The operation to perform on the specified resource.
                                Possible are: start, stop, restart, powercycle. [string]
          -m, --resourcematch   A regular expression to match / filter the list of
                                random resources.                               [string]
          -u, --duration        The time to wait between start/stop type operations
                                requiring two actual operations.  Can be an integer or a
                                range (range will be random in the range).  Default will
                                be 60 seconds.                                  [string]
          -n, --testduration    The total time to run multiple tests.  Note that the
                                time is not absolute, if the current test runs long the
                                process will stop after that test.  Can be an integer or
                                a range (range will be random in the range).    [string]
          -d, --testdelay       The time to wait between each individual test.  If when
                                time to run the next test and the total time has been
                                exceeded, the process will exit.    Can be an integer or
                                a range (range will be random in the range).  Default
                                will be 60 seconds.                             [string]
          -z, --testrandom      Run tests in random order.                     [boolean]
          -v, --resourcetype    What type of resource to operate on.  Currently only
                                'vm' supported.                 [string] [default: "vm"]
          -f, --testfile        JSON file defining test to run.  Note that any arguments
                                specified on the command line may over ride values in
                                the test file.                                  [string]
          -?, --help            Show help                                      [boolean]
          
A minimal command line to run a single test would be:

        node ./dingo.js -t <tenant id> \
                        -s <subscription id> \
                        -c <client id> \
                        -p <client secret> \
                        -g <resource group> \
                        -r <resource> \
                        -v <operation type -- only vm currently>
                        -o <operation>
                        
So, say you wanted to perform a **restart** on the vm **dingotest1** in the resource group
**dingotestres**, given:

- **tenantId**:  6191c822-bd3e-4c3a-5512-be5fcee2cb34
- **subscriptionId**:  ad4fe441-2adc-49c0-c9c0-72e187c33ae3
- **clientId**:  b5d89d5c-c8e1-4e31-74d1-50396a1aeeca
- **clientSecret**: supersecret          

The command line would look like:

        node ./dingo.js -t 6191c822-bd3e-4c3a-5512-be5fcee2cb34 \
                        -s ad4fe441-2adc-49c0-c9c0-72e187c33ae3 \
                        -c b5d89d5c-c8e1-4e31-74d1-50396a1aeeca \
                        -p supersecret \
                        -g dingotestres \
                        -r dingotest1 \
                        -v vm \
                        -o restart
                        
The same action, if you wanted to specify it in a test file, call it **dingo_test.json** would look like:

        {
            "tenantId": "6191c822-bd3e-4c3a-5512-be5fcee2cb3",
            "subscriptionId": "ad4fe441-2adc-49c0-c9c0-72e187c33ae3",
            "clientId": "b5d89d5c-c8e1-4e31-74d1-50396a1aeeca",
            "clientSecret": "supersecret",
            "jobs": [
                { "type": "vm", "operation": "restart", "resourceGroup": "dingotestres", "resource": "dingotest1" }
            ]
        }

And the commmand line would look like:

        node ./dingo.js -f ./dingo_test.json
        
Now, if you wanted to perform random operations on the same VM over a period between 5 and 10 minutes, 
pausing for 30 to 60 seconds in between, you would modify the file as so:

        {
            "tenantId": "6191c822-bd3e-4c3a-5512-be5fcee2cb3",
            "subscriptionId": "ad4fe441-2adc-49c0-c9c0-72e187c33ae3",
            "clientId": "b5d89d5c-c8e1-4e31-74d1-50396a1aeeca",
            "clientSecret": "supersecret",
            "testDuration": "300-600",
            "testDelay": "30-60",
            "jobs": [
                { "type": "vm", "operation": "*", "resourceGroup": "dingotestres", "resource": "dingotest1" }
            ]
        }

## Currently supported resource types and operations

The resource types and operations supported are as follows:

- **vm**
    - stop: Stop a VM
    - start: Start a VM
    - restart: Restart a VM
    - powercycle: This operation stops a VM, pauses for **duration** and then starts it again


          