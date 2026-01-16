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
5. Runs all tests with code coverage collection
6. Generates HTML coverage report (uploaded as artifact)
7. Posts coverage summary as a PR comment
8. Writes coverage summary to job summary
9. **Fails the build if line coverage is below 85%**

**Coverage Reports:**
- **HTML Report**: Full interactive report available as a downloadable artifact (retained for 14 days)
- **PR Comment**: Summary with badge showing coverage status (red/yellow/green thresholds at 60%/85%)
- **Job Summary**: Markdown summary visible in the workflow run

**Coverage Threshold:**
The build will fail if line coverage drops below 85%. This ensures code quality standards are maintained.

This workflow acts as a gatekeeper, ensuring all code builds, tests pass, and coverage meets the minimum threshold before merging.

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

## Testing the Deployed API

### Environment URLs

| Environment | Base URL | Swagger UI |
|-------------|----------|------------|
| Test | `https://ralph-app-api-test.azurewebsites.net` | [/swagger](https://ralph-app-api-test.azurewebsites.net/swagger) |
| Production | `https://ralph-app-api-prod.azurewebsites.net` | [/swagger](https://ralph-app-api-prod.azurewebsites.net/swagger) |
| Feature Slot | `https://ralph-app-api-test-{slot-name}.azurewebsites.net` | `/swagger` |

### Health Check

The `/health` endpoint verifies the API and database connectivity:

```bash
# Test environment
curl https://ralph-app-api-test.azurewebsites.net/health

# Production environment
curl https://ralph-app-api-prod.azurewebsites.net/health
```

**Response:**
- `200 OK` with body `Healthy` - API and database are operational
- `503 Service Unavailable` with body `Unhealthy` - Database connection failed

The health check performs an actual database connectivity test, so it will catch issues like:
- Database server unreachable
- Invalid connection string
- Authentication failures

### API Endpoints

The Customer API provides the following endpoints:

#### List Customers (with pagination, search, and sorting)

```bash
# Get all customers (paginated)
curl "https://ralph-app-api-test.azurewebsites.net/api/customers"

# Search by name or email
curl "https://ralph-app-api-test.azurewebsites.net/api/customers?search=john"

# With pagination
curl "https://ralph-app-api-test.azurewebsites.net/api/customers?page=1&pageSize=10"

# With sorting
curl "https://ralph-app-api-test.azurewebsites.net/api/customers?sortBy=name&sortOrder=asc"

# Combined
curl "https://ralph-app-api-test.azurewebsites.net/api/customers?search=smith&page=1&pageSize=25&sortBy=email&sortOrder=desc"
```

#### Get Single Customer

```bash
curl "https://ralph-app-api-test.azurewebsites.net/api/customers/{id}"
```

#### Create Customer

```bash
curl -X POST "https://ralph-app-api-test.azurewebsites.net/api/customers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+61 400 123 456",
    "address": "123 Main St, Sydney NSW 2000"
  }'
```

#### Update Customer

```bash
curl -X PUT "https://ralph-app-api-test.azurewebsites.net/api/customers/{id}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john.smith@example.com",
    "phone": "+61 400 123 456",
    "address": "456 New St, Melbourne VIC 3000"
  }'
```

#### Delete Customer

```bash
curl -X DELETE "https://ralph-app-api-test.azurewebsites.net/api/customers/{id}"
```

### Using Swagger UI

The easiest way to explore and test the API is via the Swagger UI:

1. Navigate to the Swagger URL for your environment (see table above)
2. Expand any endpoint to see request/response schemas
3. Click **Try it out** to test endpoints directly in the browser
4. Fill in parameters and click **Execute**
5. View the response body, headers, and status code

### Response Format

**Paginated List Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+61 400 123 456",
      "address": "123 Main St, Sydney NSW 2000",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "page": 1,
  "pageSize": 25,
  "totalPages": 1,
  "totalCount": 1
}
```

**Single Customer Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+61 400 123 456",
  "address": "123 Main St, Sydney NSW 2000",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 Not Found | Check the URL path is correct (endpoints are case-sensitive) |
| 500 Internal Server Error | Check Azure App Service logs in the Azure Portal |
| Connection refused | Verify the App Service is running and not stopped |
| Slow response | First request after idle may be slow due to cold start |

**View Application Logs:**
```bash
# Stream live logs (requires Azure CLI)
az webapp log tail \
  --name ralph-app-api-test \
  --resource-group rg-ralph-app
```
