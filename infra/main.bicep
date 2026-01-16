// Main Bicep template for Ralph App Backend Infrastructure
// Deploys: App Service Plan, Web Apps (Test + Production), MySQL Flexible Server

@description('The Azure region for all resources')
param location string = resourceGroup().location

@description('Base name for all resources')
param appName string = 'ralph-app-api'

@description('Environment name (test, production)')
@allowed(['test', 'production'])
param environment string

@description('App Service Plan SKU')
param appServicePlanSku string = environment == 'production' ? 'P1v3' : 'S1'

@description('MySQL administrator login')
param mysqlAdminLogin string = 'appadmin'

@description('MySQL administrator password')
@secure()
param mysqlAdminPassword string

@description('MySQL SKU name')
param mysqlSkuName string = environment == 'production' ? 'Standard_D2ds_v4' : 'Standard_B1ms'

// Variables
var appServicePlanName = '${appName}-plan-${environment}'
var webAppName = '${appName}-${environment == 'production' ? 'prod' : 'test'}'
var mysqlServerName = '${appName}-mysql-${environment}'
var mysqlDatabaseName = 'customerdb'

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: appServicePlanSku
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// Web App
resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: webAppName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|10.0'
      alwaysOn: environment == 'production'
      healthCheckPath: '/health'
      appSettings: [
        {
          name: 'ASPNETCORE_ENVIRONMENT'
          value: environment == 'production' ? 'Production' : 'Staging'
        }
      ]
      connectionStrings: [
        {
          name: 'DefaultConnection'
          connectionString: 'Server=${mysqlServer.properties.fullyQualifiedDomainName};Port=3306;Database=${mysqlDatabaseName};User=${mysqlAdminLogin};Password=${mysqlAdminPassword};'
          type: 'MySql'
        }
      ]
    }
    httpsOnly: true
  }
}

// MySQL Flexible Server
resource mysqlServer 'Microsoft.DBforMySQL/flexibleServers@2023-06-30' = {
  name: mysqlServerName
  location: location
  sku: {
    name: mysqlSkuName
    tier: environment == 'production' ? 'GeneralPurpose' : 'Burstable'
  }
  properties: {
    version: '8.0.21'
    administratorLogin: mysqlAdminLogin
    administratorLoginPassword: mysqlAdminPassword
    storage: {
      storageSizeGB: environment == 'production' ? 128 : 32
      autoGrow: 'Enabled'
    }
    backup: {
      backupRetentionDays: environment == 'production' ? 35 : 7
      geoRedundantBackup: environment == 'production' ? 'Enabled' : 'Disabled'
    }
    highAvailability: {
      mode: environment == 'production' ? 'ZoneRedundant' : 'Disabled'
    }
  }
}

// MySQL Database - Reference existing if already created
resource mysqlDatabase 'Microsoft.DBforMySQL/flexibleServers/databases@2023-06-30' existing = {
  parent: mysqlServer
  name: mysqlDatabaseName
}

// MySQL Firewall Rule - Allow Azure Services
resource mysqlFirewallRule 'Microsoft.DBforMySQL/flexibleServers/firewallRules@2023-06-30' = {
  parent: mysqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Outputs
output webAppName string = webApp.name
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output mysqlServerName string = mysqlServer.name
output mysqlServerFqdn string = mysqlServer.properties.fullyQualifiedDomainName
