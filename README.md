# Customer Search Application

A full-stack web application for searching and managing customer data, built with Next.js frontend and .NET backend, orchestrated with Docker Compose.

## Project Overview

This application provides a modern customer search interface with advanced filtering, sorting, pagination, and detailed customer views. It was developed using the Ralph autonomous agent pattern, completing 11 user stories from initial setup to production-ready features.

## Architecture

- **Frontend**: Next.js 14 (TypeScript, App Router, Tailwind CSS, shadcn/ui)
- **Backend**: .NET 10 Web API (C#, Entity Framework Core, AutoMapper)
- **Database**: MySQL 8.0
- **Infrastructure**: Docker Compose for orchestration

## Features

- Advanced customer search with multiple filters (name, email, phone)
- Sortable data table with columns: Name, Email, Phone, Created At
- Pagination controls with configurable page sizes (10, 25, 50, 100)
- Customer details modal with full information display
- Responsive design (desktop table view, mobile card view)
- Comprehensive error handling with toast notifications
- Retry mechanism for transient failures (exponential backoff)
- Email validation with inline error display

## Prerequisites

- Docker and Docker Compose
- Git

**Note**: Node.js and .NET SDK are not required on the host machine - all development happens in Docker containers.

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ralph-app
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Default values:
   - MySQL Root Password: `password`
   - MySQL Database: `customerdb`

3. **Start all services**
   ```bash
   docker-compose up
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Swagger Documentation: http://localhost:5000/swagger
   - MySQL: localhost:3306

The backend automatically applies database migrations and seeds sample customer data on startup.

## Development

### Project Structure

```
ralph-app/
├── src/
│   ├── frontend/              # Next.js application
│   │   ├── src/
│   │   │   ├── app/          # Next.js App Router pages
│   │   │   ├── components/   # React components
│   │   │   │   └── ui/       # shadcn/ui components
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   └── lib/          # Utilities and API client
│   │   ├── Dockerfile        # Multi-stage Docker build
│   │   └── package.json
│   │
│   └── backend/
│       ├── CustomerApi/       # .NET Web API
│       │   ├── Controllers/  # API endpoints
│       │   ├── DTOs/         # Data transfer objects
│       │   ├── Models/       # Entity models
│       │   ├── Repositories/ # Data access layer
│       │   ├── Data/         # DbContext
│       │   └── Dockerfile    # Multi-stage Docker build
│       │
│       └── CustomerApi.Tests/ # xUnit tests
│
├── docker-compose.yml         # Service orchestration
├── prd.json                   # Product requirements (user stories)
├── progress.txt               # Development log
└── CLAUDE.md                  # AI agent instructions
```

### Running Tests

**Frontend Tests**
```bash
# Run all tests
docker-compose exec frontend npm test

# Run with coverage
docker-compose exec frontend npm run test:coverage

# Watch mode
docker-compose exec frontend npm run test:watch
```

**Backend Tests**
```bash
# Run all tests
docker-compose exec backend dotnet test

# Run with coverage
docker-compose exec backend dotnet test /p:CollectCoverage=true
```

### Frontend Development

The frontend uses hot module reload - code changes are reflected immediately without rebuilding the container.

Key technologies:
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality component library built on Radix UI
- **Jest**: Testing framework with 95%+ code coverage

Available scripts (run inside container):
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm test           # Run Jest tests
```

### Backend Development

The backend is a .NET 10 Web API with Entity Framework Core for database access.

Key technologies:
- **.NET 10**: Latest .NET runtime
- **Entity Framework Core**: ORM with code-first migrations
- **AutoMapper**: Object-to-object mapping
- **Swagger/OpenAPI**: API documentation
- **Pomelo.EntityFrameworkCore.MySql**: MySQL provider

Database migrations:
```bash
# Create new migration
docker-compose exec backend dotnet ef migrations add MigrationName

# Apply migrations (automatic on startup)
docker-compose exec backend dotnet ef database update
```

### API Endpoints

All endpoints support CORS for frontend communication.

**GET /api/customers**
- Search customers with filters
- Query parameters: `search`, `email`, `phone`, `page`, `pageSize`, `sortBy`, `sortOrder`
- Returns: Paginated customer list

**GET /api/customers/{id}**
- Get customer by ID
- Returns: Customer details

**POST /api/customers**
- Create new customer
- Body: `{ name, email, phone?, address? }`

**PUT /api/customers/{id}**
- Update customer
- Body: `{ name, email, phone?, address? }`

**DELETE /api/customers/{id}**
- Delete customer

## Environment Variables

### Root (.env)
```bash
MYSQL_ROOT_PASSWORD=password
MYSQL_DATABASE=customerdb
```

### Frontend (src/frontend/.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Note**: The `NEXT_PUBLIC_` prefix makes the variable available in the browser.

## Docker Services

### mysql
- Image: mysql:8.0
- Port: 3306
- Persistent volume: mysql-data

### backend
- Build: src/backend/CustomerApi
- Port: 5000
- Depends on: mysql (with health check)
- Auto-applies migrations on startup

### frontend
- Build: src/frontend (development target)
- Port: 3000
- Depends on: backend
- Hot reload via volume mounts

## Testing & Quality

All user stories include acceptance criteria requiring:
- Successful builds
- Test coverage greater than 80%
- Browser verification for UI features

Current test coverage:
- **Frontend**: 95%+ statement coverage (134 tests)
- **Backend**: Comprehensive unit tests for all layers

## Production Deployment

To build for production:

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Run in production mode
docker-compose -f docker-compose.prod.yml up -d
```

**Note**: A production compose file (docker-compose.prod.yml) would need to be created using the production stages from the Dockerfiles.

## Troubleshooting

**Services won't start**
- Check Docker Desktop is running
- Verify ports 3000, 5000, 3306 are available
- Check logs: `docker-compose logs -f [service-name]`

**Frontend can't connect to backend**
- Verify backend is healthy: http://localhost:5000/health
- Check NEXT_PUBLIC_API_URL in frontend environment
- Check CORS settings in backend Program.cs

**Database connection errors**
- Wait for MySQL health check to pass (can take 30s)
- Check MySQL credentials in .env match docker-compose.yml
- Verify connection string in backend environment

**Hot reload not working**
- Ensure volume mounts are configured in docker-compose.yml
- Restart frontend container: `docker-compose restart frontend`

## Development Workflow (Ralph Agent)

This project was built using the Ralph autonomous agent pattern:

1. User stories defined in `prd.json`
2. Each story implemented by a fresh Claude instance
3. Progress tracked in `progress.txt`
4. Patterns documented in `CLAUDE.md`

See `CLAUDE.md` for AI agent-specific instructions and discovered patterns.

## Contributing

1. Create a new branch from `main`
2. Update `prd.json` with new user stories
3. Implement features following existing patterns
4. Ensure tests pass with >80% coverage
5. Update `progress.txt` with learnings
6. Submit pull request to `main`

## License

[Your License Here]

## Support

For issues or questions, please open a GitHub issue.
