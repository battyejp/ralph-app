# Deployment Guide

This guide covers setting up CI/CD pipelines for the Ralph App backend deployment to Azure.

## Overview

The deployment setup includes:

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `backend-ci.yml` | PR + push to main | Build and test on every change |
| `backend-deploy.yml` | Push to main | Deploy to Test, then Production |
| `backend-deploy-feature.yml` | Push to feature branches | Deploy to feature environments |
| `infra-deploy.yml` | Manual | Deploy Azure infrastructure |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Actions                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Push to feature/*  ──►  Feature Environment (Deployment Slot)  │
│                                                                  │
│  Push to main       ──►  Test ──► Production                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Azure                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐     ┌──────────────────┐                  │
│  │  App Service     │     │  App Service     │                  │
│  │  (Test)          │     │  (Production)    │                  │
│  │  + Feature Slots │     │                  │                  │
│  └────────┬─────────┘     └────────┬─────────┘                  │
│           │                        │                             │
│           ▼                        ▼                             │
│  ┌──────────────────┐     ┌──────────────────┐                  │
│  │  MySQL Flexible  │     │  MySQL Flexible  │                  │
│  │  Server (Test)   │     │  Server (Prod)   │                  │
│  └──────────────────┘     └──────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. Azure subscription
2. GitHub repository with Actions enabled
3. Azure CLI installed locally (for initial setup)

## Step 1: Create Azure Service Principal

Use Azure CLI to create a service principal with federated credentials for OIDC authentication (no secrets needed):

```bash
# Login to Azure
az login

# Set your subscription
az account set --subscription "<your-subscription-id>"

# Create resource group
az group create --name rg-ralph-app --location australiaeast

# Create service principal
az ad sp create-for-rbac \
  --name "github-actions-ralph-app" \
  --role contributor \
  --scopes /subscriptions/<subscription-id>/resourceGroups/rg-ralph-app
```

Save the output - you'll need `appId`, `tenant`, and the subscription ID.

### Configure Federated Credentials (OIDC)

For each GitHub environment, create a federated credential:

```bash
# Get the service principal object ID
SP_OBJECT_ID=$(az ad sp list --display-name "github-actions-ralph-app" --query "[0].id" -o tsv)

# Create federated credential for 'test' environment
az ad app federated-credential create \
  --id $SP_OBJECT_ID \
  --parameters '{
    "name": "github-test",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:<your-org>/<your-repo>:environment:test",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# Create federated credential for 'production' environment
az ad app federated-credential create \
  --id $SP_OBJECT_ID \
  --parameters '{
    "name": "github-production",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:<your-org>/<your-repo>:environment:production",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# Create federated credential for feature branches
az ad app federated-credential create \
  --id $SP_OBJECT_ID \
  --parameters '{
    "name": "github-feature-branches",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:<your-org>/<your-repo>:ref:refs/heads/feature/*",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

## Step 2: Configure GitHub Environments

Create environments in your GitHub repository:

1. Go to **Settings > Environments**
2. Create `test` environment
3. Create `production` environment

### Add Secrets to Each Environment

Add these secrets to both `test` and `production` environments:

| Secret | Value |
|--------|-------|
| `AZURE_CLIENT_ID` | Service principal `appId` |
| `AZURE_TENANT_ID` | Azure AD `tenant` ID |
| `AZURE_SUBSCRIPTION_ID` | Your subscription ID |
| `MYSQL_ADMIN_PASSWORD` | Strong password for MySQL admin |

### Repository Secrets (Optional)

For code coverage reporting:

| Secret | Value |
|--------|-------|
| `CODECOV_TOKEN` | Token from codecov.io (optional) |

## Step 3: Deploy Infrastructure

Run the infrastructure deployment workflow manually:

1. Go to **Actions > Deploy Infrastructure**
2. Click **Run workflow**
3. Select environment: `test`
4. Run again for `production`

Or deploy via Azure CLI:

```bash
# Deploy test environment
az deployment group create \
  --resource-group rg-ralph-app \
  --template-file infra/main.bicep \
  --parameters environment=test mysqlAdminPassword='<your-password>'

# Deploy production environment
az deployment group create \
  --resource-group rg-ralph-app \
  --template-file infra/main.bicep \
  --parameters environment=production mysqlAdminPassword='<your-password>'
```

## Step 4: Verify Deployment

After infrastructure is deployed, push a change to the backend:

```bash
# Make a small change to backend
git checkout -b feature/test-deployment
echo "// test" >> src/backend/CustomerApi/Program.cs
git add .
git commit -m "test: trigger deployment"
git push -u origin feature/test-deployment
```

This will trigger the feature environment deployment.

## Workflow Details

### backend-ci.yml

**Triggers:**
- Pull requests targeting `main` (when `src/backend/**` changes)
- Push to `main` (when `src/backend/**` changes)

**Jobs:**
1. Build .NET 10 application
2. Run tests
3. Upload code coverage (on PRs)

### backend-deploy.yml

**Triggers:**
- Push to `main` (when `src/backend/**` changes)
- Manual dispatch

**Jobs:**
1. **Build** - Compile and test, upload artifact
2. **Deploy Test** - Deploy to test App Service, health check
3. **Deploy Production** - Deploy to production App Service, health check

### backend-deploy-feature.yml

**Triggers:**
- Push to `feature/*`, `feat/*`, `bugfix/*`, `hotfix/*` branches
- Adding `deploy` label to a PR
- Manual dispatch

**Features:**
- Auto-creates deployment slot from branch name
- Comments deployment URL on PR
- Auto-cleans up slot when PR closes

### infra-deploy.yml

**Triggers:**
- Manual dispatch only

**Features:**
- Creates/updates Azure infrastructure
- Deploys App Service Plan, Web App, MySQL Flexible Server
- Environment-specific configurations (SKUs, replication, etc.)

## Environment URLs

After deployment, your environments will be available at:

| Environment | URL |
|-------------|-----|
| Test | `https://ralph-app-api-test.azurewebsites.net` |
| Production | `https://ralph-app-api-prod.azurewebsites.net` |
| Feature | `https://ralph-app-api-test-<branch-name>.azurewebsites.net` |

## Troubleshooting

### OIDC Authentication Fails

- Verify federated credential subject matches exactly
- Check environment name matches GitHub environment
- Ensure service principal has Contributor role on resource group

### Deployment Slot Creation Fails

- App Service Plan must be Standard tier or higher for slots
- Check slot name is valid (alphanumeric and hyphens only, max 20 chars)

### Health Check Fails

- Ensure `/health` endpoint exists and returns 200
- Check application logs: `az webapp log tail --name <app-name> --resource-group rg-ralph-app`

### MySQL Connection Issues

- Verify firewall rule allows Azure services
- Check connection string in App Service configuration
- Ensure MySQL server is running: `az mysql flexible-server show --name <server-name> --resource-group rg-ralph-app`

## Security Notes

1. **OIDC Authentication** - No long-lived secrets; tokens are short-lived and scoped
2. **Environment Protection** - Consider adding required reviewers for production
3. **Secrets** - Never commit secrets; use GitHub Secrets and Azure Key Vault
4. **Network** - Consider adding VNet integration for production

## Customization

### Change Resource Names

Edit environment variables in workflow files:
- `AZURE_RESOURCE_GROUP` - Resource group name
- `APP_NAME` - Base name for App Service

### Change Azure Region

Edit in:
- `infra-deploy.yml`: `LOCATION` environment variable
- `infra/main.bicepparam`: `location` parameter

### Add Production Approval

In GitHub, go to **Settings > Environments > production** and add:
- Required reviewers
- Wait timer (e.g., 15 minutes)
- Deployment branches (restrict to `main` only)
