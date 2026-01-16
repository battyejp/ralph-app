using './main.bicep'

// Test environment parameters
// For production, create a separate file or use different parameter values

param location = 'australiaeast'
param appName = 'ralph-app-api'
param environment = 'test'
param mysqlAdminLogin = 'appadmin'
// mysqlAdminPassword should be passed via command line: --parameters mysqlAdminPassword=<value>
