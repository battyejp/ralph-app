---
name: ci-cd
description: "Create GitHub Actions CI/CD pipelines with Azure deployment. Use when setting up continuous integration, deployment pipelines, or Azure infrastructure. Triggers on: create pipeline, setup ci/cd, deploy to azure, github actions, continuous deployment."
---

# CI/CD Pipeline Generator

Create GitHub Actions workflows for CI/CD with Azure deployment.

---

## The Job

1. Understand the project type and deployment requirements
2. Ask clarifying questions about Azure resources and environment setup
3. Generate GitHub Actions workflow files
4. Provide Azure setup instructions and required secrets

**Important:** Generate production-ready, secure pipelines following best practices.

---

## Step 1: Clarifying Questions

Ask questions to understand the deployment needs:

```
1. What type of application are you deploying?
   A. Web App (App Service)
   B. Container (Azure Container Apps / AKS)
   C. Static Site (Static Web Apps)
   D. Function App
   E. Multiple services (monorepo)

2. What environments do you need?
   A. Production only
   B. Production + Staging
   C. Production + Staging + Development
   D. Custom setup

3. What triggers should start the pipeline?
   A. Push to main branch only
   B. Push to main + Pull request checks
   C. Manual trigger only
   D. All of the above

4. Do you need infrastructure as code?
   A. Yes, using Bicep
   B. Yes, using Terraform
   C. No, infrastructure already exists
   D. Not sure, recommend something
```

---

## Step 2: Gather Project Information

Determine from the codebase:

- **Frontend:** Framework (Next.js, React, Vue, etc.), build commands, output directory
- **Backend:** Runtime (.NET, Node.js, Python, etc.), build commands, port
- **Database:** Type and migration strategy
- **Environment variables:** Required secrets and configuration

---

## Step 3: Generate Workflow Files

Create files in `.github/workflows/`:

### Common Patterns

**CI Workflow (`ci.yml`):**
- Trigger on PR and push to main
- Run linting, type checking, tests
- Build verification
- Code coverage reporting

**CD Workflow (`deploy.yml`):**
- Trigger on push to main (or manual)
- Build artifacts
- Deploy to Azure
- Run smoke tests
- Rollback on failure

---

## Workflow Templates

### Web App (App Service)

```yaml
name: Deploy to Azure App Service

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AZURE_WEBAPP_NAME: your-app-name
  AZURE_WEBAPP_PACKAGE_PATH: '.'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run tests
        run: npm test

      - name: Login to Azure
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          package: ${{ env.AZURE_WEBAPP_PACKAGE_PATH }}
```

### Container Deployment

```yaml
name: Build and Deploy Container

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: your-registry.azurecr.io
  IMAGE_NAME: your-app

jobs:
  build-and-push:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Login to Azure Container Registry
        uses: azure/docker-login@v2
        with:
          login-server: ${{ env.REGISTRY }}
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}

      - name: Build and push image
        run: |
          docker build -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} .
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

      - name: Deploy to Azure Container Apps
        uses: azure/container-apps-deploy-action@v2
        with:
          containerAppName: your-container-app
          resourceGroup: your-resource-group
          imageToDeploy: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
```

### .NET Backend

```yaml
name: Deploy .NET API

on:
  push:
    branches: [main]
    paths:
      - 'src/backend/**'
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '10.0.x'

      - name: Restore dependencies
        run: dotnet restore
        working-directory: src/backend

      - name: Build
        run: dotnet build --configuration Release --no-restore
        working-directory: src/backend

      - name: Test
        run: dotnet test --no-build --configuration Release
        working-directory: src/backend

      - name: Publish
        run: dotnet publish -c Release -o ./publish
        working-directory: src/backend/CustomerApi

      - name: Login to Azure
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          package: src/backend/CustomerApi/publish
```

---

## Step 4: Azure Setup Instructions

Provide clear instructions for:

### 1. Create Azure Service Principal

```bash
az ad sp create-for-rbac --name "github-actions-sp" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
  --sdk-auth
```

### 2. Configure GitHub Secrets

Required secrets to add in GitHub repository settings:

| Secret Name | Description |
|-------------|-------------|
| `AZURE_CREDENTIALS` | Full JSON output from service principal creation |
| `AZURE_SUBSCRIPTION_ID` | Your Azure subscription ID |
| `AZURE_TENANT_ID` | Your Azure AD tenant ID |
| `ACR_USERNAME` | Container registry username (if using containers) |
| `ACR_PASSWORD` | Container registry password (if using containers) |

### 3. Environment-Specific Configuration

For multiple environments, use GitHub Environments:
- Create environments in repo Settings > Environments
- Add environment-specific secrets
- Configure protection rules (approvals, wait timers)

---

## Step 5: Infrastructure as Code (Optional)

If requested, generate Bicep or Terraform files:

### Bicep Example (`infra/main.bicep`)

```bicep
param location string = resourceGroup().location
param appName string
param environment string = 'production'

resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: '${appName}-plan'
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
}

resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: '${appName}-${environment}'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|10.0'
    }
  }
}
```

---

## Security Best Practices

Always include in generated pipelines:

1. **Use OIDC authentication** when possible (no long-lived secrets)
2. **Pin action versions** to specific SHA or major version
3. **Limit permissions** using `permissions:` block
4. **Use environments** for production with required reviewers
5. **Never echo secrets** in workflow logs
6. **Scan for vulnerabilities** using CodeQL or similar

---

## Output

Generate the following files:

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | Continuous Integration (tests, lint, build) |
| `.github/workflows/deploy-{env}.yml` | Deployment workflow per environment |
| `infra/main.bicep` | Infrastructure as Code (if requested) |
| `DEPLOYMENT.md` | Setup instructions and secrets documentation |

---

## Checklist

Before completing:

- [ ] Asked clarifying questions about deployment needs
- [ ] Analyzed project structure to determine build steps
- [ ] Generated appropriate workflow files
- [ ] Included all required secrets documentation
- [ ] Added environment-specific configuration
- [ ] Followed security best practices
- [ ] Provided Azure CLI setup commands
- [ ] Created DEPLOYMENT.md with setup instructions
