# PRD: Bulk Random Customer Creation

## Introduction

Add the ability for users to generate and create multiple random customers at once for testing and demo purposes. This feature enables quick population of the database with realistic sample data, using a performant bulk API endpoint to minimize network overhead when creating large batches of customers.

## Goals

- Allow users to create 1-1000 random customers in a single operation
- Provide a performant bulk create endpoint to reduce API calls (single request instead of N requests)
- Generate realistic random customer data automatically
- Give users clear feedback on creation progress and results
- Handle partial failures gracefully by reporting successes and failures separately

## User Stories

### US-001: Bulk Create Customers API Endpoint
**Description:** As a developer, I need a bulk create endpoint so that the frontend can create many customers in a single API call.

**Acceptance Criteria:**
- [ ] POST `/api/customers/bulk` endpoint accepts array of customer objects
- [ ] Endpoint accepts 1-1000 customers per request
- [ ] Returns 400 Bad Request if count exceeds 1000 or is less than 1
- [ ] Response includes: `successCount`, `failureCount`, `createdCustomers[]`, `errors[]`
- [ ] Each error in `errors[]` includes index and error message
- [ ] Successfully created customers are committed even if some fail
- [ ] Endpoint completes within acceptable time (<5s for 1000 customers)
- [ ] Code builds successfully
- [ ] All tests pass with code coverage greater than 80%

### US-002: Random Customer Data Generator (Backend)
**Description:** As a developer, I need a service that generates realistic random customer data so that the bulk endpoint can create varied test data.

**Acceptance Criteria:**
- [ ] `IRandomCustomerGenerator` service interface created
- [ ] Generates realistic random names (first + last name combinations)
- [ ] Generates valid random email addresses (based on generated name)
- [ ] Generates random phone numbers in valid format
- [ ] Generates random addresses (street, city, state/region, postal code, country)
- [ ] All generated emails are unique within a batch
- [ ] Service is registered in DI container
- [ ] Code builds successfully
- [ ] All tests pass with code coverage greater than 80%

### US-003: Bulk Create Customer UI Component
**Description:** As a user, I want a UI control to specify how many random customers to create so that I can quickly populate the database for testing.

**Acceptance Criteria:**
- [ ] "Generate Random Customers" button visible on customer list page
- [ ] Clicking button opens a dialog/modal
- [ ] Dialog contains number input for customer count (1-1000)
- [ ] Input validates range and shows error for invalid values
- [ ] "Generate" button is disabled when input is invalid
- [ ] Dialog has cancel button to close without action
- [ ] Code builds successfully
- [ ] All tests pass with code coverage greater than 80%
- [ ] Verify in browser using manual testing

### US-004: Bulk Creation Progress and Results Feedback
**Description:** As a user, I want to see progress and results when creating random customers so that I know the operation status and outcome.

**Acceptance Criteria:**
- [ ] Loading state shown while bulk creation is in progress
- [ ] Loading indicator shows "Creating X customers..." message
- [ ] Success toast shows count of successfully created customers
- [ ] If partial failure, toast shows both success and failure counts
- [ ] Error toast shown if entire operation fails
- [ ] Customer list refreshes automatically after successful creation
- [ ] Dialog closes automatically on completion
- [ ] Code builds successfully
- [ ] All tests pass with code coverage greater than 80%
- [ ] Verify in browser using manual testing

### US-005: API Client Bulk Create Method
**Description:** As a frontend developer, I need an API client method to call the bulk create endpoint so that UI components can trigger bulk creation.

**Acceptance Criteria:**
- [ ] `customerApi.bulkCreate(count: number)` method added
- [ ] Method calls POST `/api/customers/bulk` with generated customer data
- [ ] Returns typed response with success/failure counts and details
- [ ] Handles API errors appropriately with ApiError
- [ ] TypeScript types defined for request and response
- [ ] Code builds successfully
- [ ] All tests pass with code coverage greater than 80%

## Functional Requirements

- FR-1: Backend must expose `POST /api/customers/bulk` endpoint accepting array of `CreateCustomerDto` objects
- FR-2: Bulk endpoint must validate total count is between 1 and 1000 inclusive
- FR-3: Bulk endpoint must process all valid customers even if some fail validation
- FR-4: Bulk endpoint must return detailed response with success count, failure count, created customers, and error details
- FR-5: Random data generator must produce unique email addresses within each batch
- FR-6: Random data generator must create realistic-looking names, emails, phone numbers, and addresses
- FR-7: Frontend must provide UI to specify desired customer count (1-1000)
- FR-8: Frontend must validate input before enabling the generate button
- FR-9: Frontend must show appropriate loading state during bulk creation
- FR-10: Frontend must display success/failure results via toast notifications
- FR-11: Frontend must refresh customer list after successful bulk creation

## Non-Goals

- No progress bar showing individual customer creation (batch is atomic from UI perspective)
- No ability to customize generated data fields (fully random)
- No ability to preview generated data before creation
- No undo/rollback functionality for created customers
- No rate limiting or daily limits on bulk creation
- No background job processing (synchronous operation only)

## Design Considerations

- Use existing Dialog component from shadcn/ui for the bulk create modal
- Use existing Input component for the count input with type="number"
- Use existing Button component with loading state
- Use existing Toast system for success/failure notifications
- Place "Generate Random Customers" button near existing customer actions
- Consider using a secondary/outline button style to differentiate from primary actions

## Technical Considerations

### Backend
- Create `BulkCreateCustomersDto` for the request body containing array of customers
- Create `BulkCreateResponseDto` for detailed response with success/failure breakdown
- Use Entity Framework `AddRange()` and `SaveChangesAsync()` for batch insert performance
- Consider using transactions to ensure atomicity of successful inserts
- Random data generation should happen on backend to ensure consistency and reduce payload size
- Add endpoint to Swagger documentation

### Frontend
- API client should handle the potentially longer response time for large batches
- Consider increasing timeout for bulk operations
- Input should use HTML5 number input with min/max attributes
- Debounce is not needed since this is a button-triggered action, not search

### Performance
- Target: 1000 customers created in under 5 seconds
- Single database round-trip for all inserts where possible
- Minimal payload: frontend sends only count, backend generates data

## Success Metrics

- Users can create 1000 random customers in a single operation
- Bulk creation completes in under 5 seconds for 1000 customers
- UI clearly indicates progress and results
- Partial failures are reported without losing successful creates

## Open Questions

- Should we add a "clear all test data" feature to complement this? (Out of scope for this PRD)
- Should generated data be marked somehow as test data? (Decided: No, treat as regular customers)
