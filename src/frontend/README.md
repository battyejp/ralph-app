# Customer Search Frontend

Next.js web application for searching and viewing customers via the Customer API.

## Prerequisites

- Docker and Docker Compose (recommended)
- OR Node.js 20+ and npm (for local development)

## Getting Started with Docker (Recommended)

The easiest way to run the frontend is with Docker Compose from the project root:

1. Start all services (from project root):
```bash
docker-compose up
```

2. Access the application at [http://localhost:3000](http://localhost:3000)

The frontend automatically connects to the backend API and includes hot reload for development.

## Local Development (Without Docker)

If you prefer to run Node.js directly on your host:

1. Install dependencies:
```bash
npm install
```

2. Copy the environment file:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your API URL if different from default:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

**With Docker:**
```bash
docker build --target production -t customer-search-frontend .
docker run -p 3000:3000 customer-search-frontend
```

**Without Docker:**
```bash
npm run build
npm start
```

## Available Scripts

```bash
npm run dev              # Start development server (port 3000)
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

## Running Tests

**With Docker:**
```bash
docker-compose exec frontend npm test
docker-compose exec frontend npm run test:coverage
```

**Without Docker:**
```bash
npm test
npm run test:coverage
```

All tests must pass with >80% coverage before committing changes.

## Project Structure

```
src/
  app/              # Next.js app router pages
  components/       # React components
    ui/             # shadcn/ui components (Button, Input, Dialog, etc.)
  hooks/            # Custom React hooks (useDebounce, useToast)
  lib/              # Utility functions and API client
    api/            # Customer API client with TypeScript types
```

## Technologies

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Radix UI primitives
- Jest + React Testing Library

## Features

- Advanced search with multiple filters (name, email, phone)
- Sortable data table (Name, Email, Created At)
- Pagination with configurable page sizes
- Customer details modal
- Responsive design (desktop table, mobile cards)
- Toast notifications for errors
- Email validation
- Retry mechanism for failed requests

## Development Notes

- Uses Next.js 14 App Router (not Pages Router)
- Components with React hooks require `'use client'` directive
- `useSearchParams()` must be wrapped in Suspense boundary
- shadcn/ui components manually created in `src/components/ui/`
- Environment variables with `NEXT_PUBLIC_` prefix are accessible in browser
- Hot reload works automatically when running via Docker Compose
