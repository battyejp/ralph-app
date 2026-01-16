# Claude Agent Instructions - Customer Search Application

## Overview

This is a full-stack customer search application built using the Ralph autonomous agent pattern. The application consists of a Next.js frontend, .NET backend API, and MySQL database, all orchestrated with Docker Compose.

## Ralph Agent Pattern

Ralph is an autonomous AI agent loop that runs Claude repeatedly until all PRD items are complete. Each iteration is a fresh Claude instance with clean context.

### Commands

```bash
# Run Ralph (from project root with prd.json)
./ralph.sh [max_iterations]
```

### Key Files

- `ralph.sh` - The bash loop that spawns fresh Claude instances
- `prompt.md` - Instructions given to each Claude instance
- `prd.json` - Product requirements with user stories
- `prd.json.example` - Example PRD format
- `progress.txt` - Development log with learnings from each iteration

### Memory Persistence

- Each iteration spawns a fresh Claude instance with clean context
- Memory persists via git history, `progress.txt`, and `prd.json`
- Stories should be small enough to complete in one context window
- Always update CLAUDE.md with discovered patterns for future iterations

## Project Architecture

### Tech Stack

**Frontend:**
- Next.js 14 with App Router (not Pages Router)
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui component library (built on Radix UI primitives)
- Jest for testing

**Backend:**
- .NET 10 Web API (not .NET 8)
- Entity Framework Core 9.0
- MySQL 8.0 database
- AutoMapper for DTO mapping
- Swagger/OpenAPI for API documentation

**Infrastructure:**
- Docker Compose for orchestration
- Multi-stage Dockerfiles for build optimization
- Volume mounts for frontend hot reload

### Directory Structure

```
src/
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # React components
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── hooks/            # Custom React hooks
│   │   └── lib/              # Utilities and API client
│   │       └── api/          # API client with types
│   ├── Dockerfile            # Multi-stage: dev, builder, production
│   └── package.json
│
└── backend/
    ├── CustomerApi/
    │   ├── Controllers/      # API endpoints
    │   ├── DTOs/             # Data transfer objects
    │   ├── Models/           # Entity models
    │   ├── Repositories/     # Data access layer (ICustomerRepository)
    │   ├── Data/             # ApplicationDbContext
    │   ├── Mappings/         # AutoMapper profiles
    │   └── Dockerfile        # Multi-stage: build, publish, runtime
    │
    └── CustomerApi.Tests/    # xUnit tests
```

## Critical Patterns and Conventions

### Environment Constraints

**IMPORTANT**: Node.js and .NET SDK are NOT installed on the host system. All development, builds, and tests must run inside Docker containers.

- Cannot run `npm`, `npx`, or `dotnet` commands directly on host
- Cannot use `create-next-app` or other scaffolding tools
- All testing must be done via `docker-compose exec` or `docker run`
- Manual file creation required for project setup

### Frontend Patterns

#### Next.js 14 App Router

- Uses App Router (`src/app/`) not Pages Router
- `'use client'` directive required for components with React hooks (useState, useEffect, etc.)
- Client components should be in `src/components/`, not `src/app/`
- Server components are the default in App Router

#### Suspense Boundaries for URL Parameters

**CRITICAL**: Components using `useSearchParams()` must be wrapped in a Suspense boundary to avoid prerendering errors.

Pattern:
```typescript
'use client';

function PageContent() {
  const searchParams = useSearchParams();
  // Component logic
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}
```

#### shadcn/ui Components

- Components are manually created in `src/components/ui/`
- Built on Radix UI primitives (@radix-ui/react-*)
- Use `class-variance-authority` for variant management
- Styling via Tailwind CSS utility classes
- Common components: Button, Input, Label, Dialog, Table, Select, Toast

**Component Installation Pattern**:
Since `npx shadcn-ui add` is not available, components must be created manually:
1. Check shadcn/ui documentation for component code
2. Create file in `src/components/ui/[component].tsx`
3. Install required Radix UI dependencies in package.json
4. Import and use in your components

#### API Client Pattern

**Singleton Pattern**:
```typescript
// lib/api/customerApi.ts
class CustomerApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  }

  // Methods here
}

export const customerApi = new CustomerApiClient();
```

**Error Handling**:
- Custom `ApiError` class extends Error with `status` and `errors` properties
- Network errors (TypeError) wrapped in ApiError with user-friendly messages
- Retry mechanism for transient failures (408, 429, 500+)
- Non-retryable errors: 400, 401, 403, 404

**Environment Variables**:
- Use `NEXT_PUBLIC_` prefix for client-side access
- Default values for development: `NEXT_PUBLIC_API_URL=http://localhost:5000`

#### Testing with Jest

**Configuration**:
- Jest config in `jest.config.js` with Next.js support
- Setup file: `jest.setup.js` imports `@testing-library/jest-dom`
- Coverage threshold: 80% minimum
- Test files: `*.test.tsx` or `*.test.ts`

**Testing Patterns**:
- Mock `global.fetch` for API client tests
- Mock `useDebounce` hook to make tests synchronous
- Use `getAllByText()` for responsive components with duplicate content (desktop + mobile)
- Use `findBy` queries for async elements instead of `getBy` with `waitFor`
- Test all states: loading, empty, error, success

**Running Tests**:
```bash
docker-compose exec frontend npm test
docker-compose exec frontend npm run test:coverage
```

#### Responsive Design

- Desktop: Table view with sortable columns
- Mobile: Card view with stacked information
- Breakpoint: `md:` (768px)
- Pattern: Render both views, hide/show with Tailwind classes

```tsx
{/* Desktop table - hidden on mobile */}
<div className="hidden md:block">
  <Table>...</Table>
</div>

{/* Mobile cards - hidden on desktop */}
<div className="md:hidden">
  {items.map(item => <Card>...</Card>)}
</div>
```

#### URL State Management

- Use `useSearchParams()` for reading URL params (requires Suspense)
- Use `useRouter()` from `next/navigation` for updating URL
- Only include non-default values in URL to keep URLs clean
- Pattern: `router.push()` for client-side navigation without page reload

#### Debouncing

Custom `useDebounce` hook for search inputs:
```typescript
const debouncedValue = useDebounce(value, 500); // 500ms delay
```

#### Toast Notifications

- Created using shadcn/ui Toast + Radix UI @radix-ui/react-toast
- Global state managed via reducer pattern with listeners
- Add `<Toaster />` to root layout (src/app/layout.tsx)
- Use `useToast()` hook in components
- Variants: 'default' and 'destructive' (for errors)

### Backend Patterns

#### .NET Version

**IMPORTANT**: This project uses .NET 10, not .NET 8 as originally specified in PRD.

- Target framework: `net10.0`
- Docker images: `mcr.microsoft.com/dotnet/sdk:10.0` and `mcr.microsoft.com/dotnet/aspnet:10.0`
- Entity Framework Core 9.0

#### Entity Framework Patterns

**Database Migrations**:
- Auto-applied on application startup (see Program.cs)
- Create migrations: `docker-compose exec backend dotnet ef migrations add MigrationName`
- Database seeding via migrations (see `SeedCustomers.cs`)

**DbContext**:
- Located in `Data/ApplicationDbContext.cs`
- Configured with Pomelo MySQL provider
- Connection string from environment variable

**Repository Pattern**:
- Interface: `ICustomerRepository`
- Implementation: `CustomerRepository`
- Registered as scoped service in DI container
- Handles all database operations with proper async/await

#### AutoMapper

- Profile located in `Mappings/CustomerProfile.cs`
- Maps between Entity models and DTOs
- Registered globally in Program.cs: `builder.Services.AddAutoMapper(typeof(Program).Assembly);`

#### API Conventions

**DTOs**:
- Request DTOs: `CreateCustomerDto`, `UpdateCustomerDto`
- Response DTOs: `CustomerResponseDto`, `PaginatedResponseDto`
- Located in `DTOs/` directory

**Pagination**:
- Default page size: 25
- Supported page sizes: 10, 25, 50, 100
- Response includes: `items`, `page`, `pageSize`, `totalPages`, `totalCount`

**Sorting**:
- Supported fields: Name, Email, CreatedAt
- Sort order: asc, desc
- Query parameters: `sortBy`, `sortOrder`

**CORS**:
- Configured in Program.cs for `http://localhost:3000`
- Policy name: "AllowFrontend"
- Allows credentials, all headers, all methods

#### Swagger Documentation

- Available at http://localhost:5000/swagger
- Configured with XML comments
- RoutePrefix: "swagger"

### Docker Patterns

#### Multi-Stage Dockerfiles

**Frontend Dockerfile Stages**:
1. `base` - Node.js base image
2. `deps` - Install dependencies
3. `dev` - Development with hot reload
4. `builder` - Production build
5. `production` - Optimized runtime

**Backend Dockerfile Stages**:
1. `build` - .NET SDK for compilation
2. `publish` - Create publish artifacts
3. `runtime` - Lightweight ASP.NET runtime

#### Docker Compose Service Dependencies

- `backend` depends on `mysql` (with health check condition)
- `frontend` depends on `backend` (basic dependency)
- Health checks ensure services start in correct order

#### Volume Mounts for Hot Reload

Frontend service uses volume mounts:
```yaml
volumes:
  - ./src/frontend:/app
  - /app/node_modules      # Exclude node_modules
  - /app/.next             # Exclude .next build artifacts
```

#### .dockerignore Files

Essential for reducing build context size:
- Frontend: Exclude `node_modules`, `.next`, `out`, `.git`
- Backend: Exclude `bin/`, `obj/`, `.vs/`, `.vscode/`

### Testing Patterns

#### Frontend Testing

- Framework: Jest + React Testing Library
- Coverage target: >80%
- All components have corresponding `.test.tsx` files
- API client has comprehensive unit tests mocking fetch

#### Backend Testing

- Framework: xUnit
- Tests organized by layer: Controllers, DTOs, Models, Repositories
- Uses in-memory database for repository tests
- Coverage target: >80%

## Common Gotchas

### Frontend

1. **ESLint HTML Entities**: Use `&apos;` instead of `'` in JSX text
2. **Responsive Testing**: Use `getAllByText()` when content appears in both desktop and mobile views
3. **Client Components**: Must use `'use client'` directive for hooks (useState, useEffect, useSearchParams, etc.)
4. **Suspense Required**: Always wrap `useSearchParams()` usage in Suspense boundary
5. **Toast Limit**: Maximum 5 toasts can be shown simultaneously (TOAST_LIMIT = 5)
6. **Date Formatting**: Use `toLocaleDateString()` or `toLocaleString()` with en-US locale for consistency

### Backend

1. **.NET Version**: Project uses .NET 10, not .NET 8
2. **Migration Timing**: Migrations auto-apply on startup, can take 30s for first run
3. **Health Checks**: Backend health check has 30s start_period - don't expect immediate readiness
4. **Connection String**: In Docker, use service name `mysql` not `localhost`
5. **CORS**: Frontend origin must be explicitly allowed in Program.cs

### Docker

1. **Build Context**: Always use .dockerignore to reduce build time
2. **Port Conflicts**: Ensure ports 3000, 5000, 3306 are available
3. **MySQL Startup**: Can take up to 30s for health check to pass
4. **Volume Permissions**: On Windows, ensure Docker has access to shared drives
5. **Hot Reload**: Changes to package.json or .csproj require container rebuild

## Development Workflow

### Working on New User Stories

1. **Read the PRD**: Check `prd.json` for next story with `passes: false`
2. **Read Progress Log**: Check `progress.txt` for context and learnings
3. **Check Out Branch**: Ensure you're on the correct branch from `prd.json.branchName`
4. **Implement Story**: Follow existing patterns and conventions
5. **Run Tests**: Ensure >80% coverage and all tests pass
6. **Update Documentation**: Add learnings to `progress.txt` and patterns to `CLAUDE.md`
7. **Commit**: Use format `feat: [Story ID] - [Story Title]`
8. **Update PRD**: Mark story as `passes: true` in `prd.json`

### Quality Checks Before Committing

**Frontend**:
```bash
docker-compose exec frontend npm run build      # Build check
docker-compose exec frontend npm run lint       # Lint check
docker-compose exec frontend npm test           # Test check
```

**Backend**:
```bash
docker-compose exec backend dotnet build        # Build check
docker-compose exec backend dotnet test         # Test check
```

### When to Update CLAUDE.md

Add to this file when you discover:
- New architectural patterns specific to this project
- Non-obvious dependencies between components
- Configuration requirements for new features
- Testing approaches that work well
- Gotchas that future developers should avoid

Do NOT add:
- Story-specific implementation details
- Temporary debugging notes
- Information already in progress.txt
- General knowledge about technologies used

## Key Learnings from Development

### Progress Tracking

- `progress.txt` contains detailed logs of all 11 user stories (US-001 through US-011)
- Each entry includes files created/modified and learnings for future iterations
- Check the "Codebase Patterns" section at the top for consolidated patterns

### Browser Verification

- Stories requiring UI verification use browser skill to confirm functionality
- Always verify responsive design at multiple breakpoints
- Check loading states, error states, and empty states

### Acceptance Criteria Pattern

All user stories require:
1. Feature implementation
2. Code builds successfully
3. Tests pass with >80% coverage
4. Browser verification (for UI features)

## Reference Documentation

- **Next.js**: https://nextjs.org/docs
- **shadcn/ui**: https://ui.shadcn.com/docs
- **Radix UI**: https://www.radix-ui.com/docs/primitives
- **Tailwind CSS**: https://tailwindcss.com/docs
- **.NET**: https://learn.microsoft.com/en-us/dotnet/
- **Entity Framework Core**: https://learn.microsoft.com/en-us/ef/core/
- **Docker Compose**: https://docs.docker.com/compose/

## Future Iterations

When working on this codebase:
1. Always check `progress.txt` first for context
2. Follow the established patterns documented here
3. Run all tests before committing
4. Update this file if you discover new patterns
5. Keep stories small and focused
6. Document your learnings for the next iteration