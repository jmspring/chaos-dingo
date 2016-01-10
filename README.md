# chaos-dingo
Monkey and Lemur are taken, so Chaos Dingo it is.  This is a tool to mess with
Azure services using the Azure NodeJS SDK.

Initial approach started with [WazMonkey](https://github.com/smarx/WazMonkey) 
by Steve Marx, but modernizing it for Azure Resource Manager based services
and leverage the Azure NodeJS SDK.

Initial plan is to work strictly with stopping, starting, and restarting VMs.
The order these will be implemented are:

1.  Specify operation and VM to perform operation on **done**
2.  Select a random VM to perform specified operation on.
3.  Select a random VM but allow a filter to match the VM names.
4.  Add a "test plan" that will perform random operations on VMs allowed by (3) and specify durations (absolute and random)
    
Initially, this utility will require the use of a service principal.  If one isn't 
familiar with service principals, I recommend taking a look 
[here](http://innerdot.com/tag/active-directory.html).