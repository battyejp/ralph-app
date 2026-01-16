# GitHub Actions Workflows

This directory contains the CI/CD pipelines for the Ralph App backend API.

## Workflows Overview

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| [backend-ci.yml](#backend-ci) | PRs and pushes to `main` | Code validation and testing |
| [backend-deploy.yml](#backend-deploy) | Pushes to `main`, manual | Deploy to Test and Production |
| [backend-deploy-feature.yml](#backend-deploy-feature) | Feature branches, PRs | Ephemeral preview environments |
| [infra-deploy.yml](#infrastructure-deploy) | Manual only | Provision Azure infrastructure |

## Workflow Details

### Backend CI

**File:** `backend-ci.yml`

**Triggers:**
- Pull requests to `main` (when backend code changes)
- Pushes to `main` (when backend code changes)

**What it does:**
1. Checks out the code
2. Sets up .NET 10
3. Restores dependencies
4. Builds the solution
5. Runs all tests
6. Uploads code coverage to Codecov (on PRs)

This workflow acts as a gatekeeper, ensuring all code builds and tests pass before merging.

---

### Backend Deploy

**File:** `backend-deploy.yml`

**Triggers:**
- Pushes to `main` (when backend or infra code changes)
- Manual trigger via `workflow_dispatch` with environment selection

**What it does:**
1. **Build Job:** Compiles, tests, and creates a publish artifact
2. **Deploy to Test:** Deploys to `ralph-app-api-test` and runs a health check
3. **Deploy to Production:** After test succeeds, deploys to `ralph-app-api-prod`

**Deployment Flow:**
```
Build → Deploy Test → Health Check → Deploy Production → Health Check
```

**Environments:**
- Test: `ralph-app-api-test.azurewebsites.net`
- Production: `ralph-app-api-prod.azurewebsites.net`

---

### Backend Deploy Feature

**File:** `backend-deploy-feature.yml`

**Triggers:**
- Pushes to `feature/**`, `feat/**`, `bugfix/**`, `hotfix/**` branches
- Manual trigger via `workflow_dispatch`
- When a PR is labeled with `deploy`

**What it does:**
1. Generates a sanitized environment name from the branch name
2. Builds and tests the code
3. Creates a deployment slot on the test App Service
4. Deploys the feature branch to the slot
5. Comments on the PR with the deployment URL
6. **Automatically cleans up** the slot when the PR is closed

**Example:**
- Branch: `feature/user-authentication`
- Slot URL: `ralph-app-api-test-user-authenticatio.azurewebsites.net`

This enables reviewers to test features in isolation before merging.

---

### Infrastructure Deploy

**File:** `infra-deploy.yml`

**Triggers:**
- Manual only (`workflow_dispatch`)

**What it does:**
1. Logs into Azure using OIDC
2. Creates the resource group (`rg-ralph-app`) in Australia East
3. Deploys the Bicep template from `infra/main.bicep`

**Inputs:**
- `environment`: Select `test` or `production`

**Required Secrets:**
- `MYSQL_ADMIN_PASSWORD`: Password for the MySQL admin user

This workflow is intentionally manual since infrastructure changes should be deliberate and reviewed.

---

## Required Secrets

Configure these secrets in your GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `AZURE_CLIENT_ID` | Azure AD application (service principal) client ID |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |
| `MYSQL_ADMIN_PASSWORD` | MySQL administrator password (for infra deployment) |
| `CODECOV_TOKEN` | Codecov upload token (optional, for coverage reports) |

## Environments

Configure these environments in GitHub repository settings with appropriate protection rules:

- **test**: No approval required
- **production**: Requires approval before deployment

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Feature Branch │     │   Pull Request  │     │   Main Branch   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ backend-deploy- │     │   backend-ci    │     │ backend-deploy  │
│    feature      │     │  (validation)   │     │ (test → prod)   │
└────────┬────────┘     └─────────────────┘     └────────┬────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────┐                             ┌─────────────────┐
│  Preview Slot   │                             │  Test → Prod    │
│  (ephemeral)    │                             │  (staged)       │
└─────────────────┘                             └─────────────────┘
```
