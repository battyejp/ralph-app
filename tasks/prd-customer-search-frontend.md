# PRD: Customer Search Web Frontend

## Introduction

Build a web-based frontend application using Next.js that provides an intuitive interface for searching and viewing customers via the existing Customer API. The application will support advanced search with filters for name, email, and phone, with pagination and sorting capabilities. All components (frontend, backend, database) will be orchestrated through Docker Compose for easy development setup with hot reload support.

## Goals

- Provide a user-friendly web interface for searching customers
- Support advanced filtering by name, email, and phone number
- Enable pagination and sorting of search results
- Display detailed customer information
- Ensure easy local development with Docker Compose
- Support hot reload for efficient frontend development
- Create a maintainable, modern frontend architecture with Next.js and shadcn/ui

## User Stories

### US-001: Initialize Next.js Frontend Project
**Description:** As a developer, I need a Next.js project structure so I can build the customer search interface.

**Acceptance Criteria:**
- [ ] Create Next.js project in `src/frontend` directory
- [ ] Configure TypeScript
- [ ] Install and configure shadcn/ui component library
- [ ] Set up project structure (components, lib, app directories)
- [ ] Configure environment variables for API URL
- [ ] Add .gitignore for frontend
- [ ] Project builds successfully with `npm run build`
- [ ] Development server runs with `npm run dev`

### US-002: Configure Docker Compose for All Services
**Description:** As a developer, I want all services running in Docker Compose so I can start the entire stack with one command.

**Acceptance Criteria:**
- [ ] Add backend API service to docker-compose.yml
- [ ] Add frontend service to docker-compose.yml with volume mounts for hot reload
- [ ] Configure service dependencies (frontend depends on backend, backend depends on mysql)
- [ ] Set environment variables for inter-service communication
- [ ] Frontend accessible at http://localhost:3000
- [ ] Backend accessible at http://localhost:5000 (or configured port)
- [ ] MySQL accessible at localhost:3306
- [ ] All services start successfully with `docker-compose up`
- [ ] Hot reload works when editing frontend code

### US-003: Create API Client Service Layer
**Description:** As a developer, I need a typed API client to communicate with the Customer API.

**Acceptance Criteria:**
- [ ] Create TypeScript interfaces matching API DTOs (Customer, PaginatedResponse)
- [ ] Implement API client service with methods: searchCustomers, getCustomerById
- [ ] Configure base URL from environment variables
- [ ] Add proper error handling for network failures
- [ ] Add request/response type safety
- [ ] Code builds successfully
- [ ] Verify API connectivity with test request

### US-004: Build Advanced Search Form
**Description:** As a user, I want to search for customers using multiple filters so I can find specific customers quickly.

**Acceptance Criteria:**
- [ ] Create search form component with shadcn/ui Input components
- [ ] Add filter fields: general search (name/email), email exact match, phone search
- [ ] Add clear/reset filters button
- [ ] Add search button that triggers API call
- [ ] Implement debounced search for better UX
- [ ] Form is responsive and works on mobile devices
- [ ] Code builds successfully
- [ ] Verify in browser using dev-browser skill

### US-005: Display Search Results Table
**Description:** As a user, I want to see search results in a clear table format so I can quickly scan customer information.

**Acceptance Criteria:**
- [ ] Create results table component using shadcn/ui Table
- [ ] Display columns: Name, Email, Phone, Created At
- [ ] Show loading state while fetching results
- [ ] Show empty state when no results found
- [ ] Show error state when API request fails
- [ ] Make customer rows clickable to view details
- [ ] Table is responsive on mobile (consider card view for small screens)
- [ ] Code builds successfully
- [ ] Verify in browser using dev-browser skill

### US-006: Implement Pagination Controls
**Description:** As a user, I want to navigate through pages of results so I can browse all customers without overwhelming the interface.

**Acceptance Criteria:**
- [ ] Create pagination component using shadcn/ui
- [ ] Display current page, total pages, and total count
- [ ] Add previous/next page buttons
- [ ] Add page size selector (10, 25, 50, 100)
- [ ] Disable previous on first page, next on last page
- [ ] Preserve search filters when changing pages
- [ ] Update URL with pagination parameters
- [ ] Code builds successfully
- [ ] Verify in browser using dev-browser skill

### US-007: Add Column Sorting
**Description:** As a user, I want to sort results by different columns so I can organize data according to my needs.

**Acceptance Criteria:**
- [ ] Add clickable column headers for Name, Email, Created At
- [ ] Show sort indicator (up/down arrow) on active column
- [ ] Toggle between ascending/descending on click
- [ ] Send sortBy and sortOrder parameters to API
- [ ] Preserve sort state when paginating or filtering
- [ ] Update URL with sort parameters
- [ ] Code builds successfully
- [ ] Verify in browser using dev-browser skill

### US-008: Customer Details View
**Description:** As a user, I want to view full customer details so I can see all available information about a customer.

**Acceptance Criteria:**
- [ ] Create customer details modal or page using shadcn/ui Dialog or Sheet
- [ ] Display all customer fields: Name, Email, Phone, Address, Created At, Updated At
- [ ] Handle optional fields gracefully (show "N/A" for null values)
- [ ] Add close/back button to return to search results
- [ ] Show loading state while fetching details
- [ ] Show error state if customer not found
- [ ] Code builds successfully
- [ ] Verify in browser using dev-browser skill

### US-009: Error Handling and User Feedback
**Description:** As a user, I want clear feedback when things go wrong so I understand what happened and what to do next.

**Acceptance Criteria:**
- [ ] Show toast notifications for errors using shadcn/ui Toast
- [ ] Display user-friendly error messages (not technical stack traces)
- [ ] Handle network errors (API unreachable)
- [ ] Handle API errors (400, 404, 500)
- [ ] Add retry mechanism for failed requests
- [ ] Show validation errors for invalid search inputs
- [ ] Code builds successfully
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

**Frontend Architecture:**
- FR-1: Use Next.js 14+ with App Router
- FR-2: Use TypeScript for all code
- FR-3: Use shadcn/ui components (Table, Input, Button, Dialog, Toast, etc.)
- FR-4: Implement responsive design (mobile-first approach)
- FR-5: Use React Query or SWR for data fetching and caching (optional but recommended)

**Search & Filtering:**
- FR-6: Support general search that filters by name and email (uses API `search` param)
- FR-7: Support exact email match filter (uses API `email` param)
- FR-8: Support phone number search (requires filtering results client-side or API enhancement)
- FR-9: Display search results in paginated table with 10 items per page default
- FR-10: Support sorting by Name, Email, and Created At (ascending/descending)

**Customer Display:**
- FR-11: Show customer list with columns: Name, Email, Phone, Created At
- FR-12: Display full customer details including Address and timestamps
- FR-13: Format dates in user-friendly format (e.g., "Jan 15, 2026, 3:45 PM")
- FR-14: Handle empty/null optional fields gracefully

**Docker Compose:**
- FR-15: Frontend container must support hot module reload for development
- FR-16: Services must start in correct dependency order (mysql → backend → frontend)
- FR-17: Environment variables must configure API URLs and database connections
- FR-18: Single command (`docker-compose up`) starts entire stack

**Developer Experience:**
- FR-19: TypeScript type checking must pass without errors
- FR-20: Code must follow consistent formatting (use Prettier)
- FR-21: Environment variables documented in .env.example files

## Non-Goals (Out of Scope)

- Creating, editing, or deleting customers (read-only interface for now)
- User authentication or authorization
- Production-ready deployment configuration (production docker setup, CI/CD)
- Advanced analytics or reporting features
- Export functionality (CSV, PDF)
- Bulk operations
- Customer history or audit logs
- Real-time updates via WebSockets
- Unit or integration tests (focus on getting working MVP)

## Design Considerations

**Component Library:**
- Use shadcn/ui for consistent, accessible components
- Components to use: Table, Input, Button, Dialog/Sheet, Select, Toast, Card, Badge
- Follow shadcn/ui's composition patterns for flexibility

**UI/UX:**
- Clean, minimal interface focused on search functionality
- Responsive design that works on tablets and phones
- Loading states for all async operations
- Empty states with helpful messages ("No customers found. Try different filters.")
- Error states with actionable messages

**Layout:**
- Header with app title "Customer Search"
- Search form at top with filters in a row (responsive to column on mobile)
- Results table below with pagination controls at bottom
- Customer details in modal/drawer overlay

## Technical Considerations

**API Integration:**
- Backend API base URL: `http://backend:5000/api` (internal Docker) or `http://localhost:5000/api` (external)
- Existing GET /api/customers endpoint supports: page, pageSize, search, email, sortBy, sortOrder
- Phone filtering may need to be done client-side unless backend is extended
- All API responses use JSON
- Pagination response format: `{ items: [], totalCount: number, page: number, pageSize: number, totalPages: number }`

**Docker Configuration:**
- Frontend: Node.js 20+ Alpine image
- Backend: .NET 8 SDK image
- MySQL: MySQL 8.0 image (already configured)
- Use named volumes for MySQL data persistence
- Use bind mounts for frontend/backend source code (enables hot reload)
- Network: All services on same Docker network for internal communication
- Expose ports: 3000 (frontend), 5000 (backend), 3306 (MySQL)

**Environment Variables:**
- Frontend: `NEXT_PUBLIC_API_URL` for backend API base URL
- Backend: Connection string, port configuration (already exists)
- Docker: Use .env file for environment-specific values

**Dependencies:**
- Next.js 14+
- TypeScript 5+
- shadcn/ui (Radix UI primitives under the hood)
- Tailwind CSS (required by shadcn/ui)
- Optional: @tanstack/react-query for data fetching
- Optional: axios or fetch API for HTTP requests

## Success Metrics

- Developers can start entire stack with `docker-compose up` in under 2 minutes
- Frontend hot reload reflects changes in under 3 seconds
- Search results display in under 1 second for typical queries (< 1000 results)
- All filters work correctly and match expected API behavior
- Application is fully functional without any authentication
- Search interface is intuitive enough for non-technical users

## Open Questions

1. Should phone search be implemented client-side (filter API results) or should we enhance the backend API to support phone filtering?
   - **Recommendation:** Start with client-side filtering if result sets are small (< 100 items), otherwise enhance backend API later

2. Should we use React Query/SWR for data fetching, or just plain fetch/axios?
   - **Recommendation:** Use @tanstack/react-query for automatic caching and refetching

3. What port should the backend API run on in Docker?
   - **Recommendation:** Use 5000 for consistency with common .NET API conventions

4. Should customer details be a modal or a separate page route?
   - **Recommendation:** Use modal (Dialog/Sheet) for simpler UX, can migrate to route later if needed

5. Do we need a backend Dockerfile or can we build it during docker-compose?
   - **Recommendation:** Create dedicated Dockerfiles for both frontend and backend for clarity and reusability
