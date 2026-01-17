# PRD: Customer Creation via Web UI

## Introduction

Add the ability to create new customers through the web interface. Users will be able to access a customer creation form via a button on the search page (opening a modal) or through a dedicated creation page. The feature will include comprehensive validation with inline field errors and toast notifications, enforce email uniqueness, and navigate to the newly created customer's details upon success.

## Goals

- Enable users to create new customers directly through the web UI
- Provide intuitive form with clear validation feedback (inline + toast)
- Ensure data integrity by enforcing unique email addresses
- Offer multiple access points: modal from search page and dedicated page
- Maintain consistent UX with existing application patterns (shadcn/ui, responsive design)

## User Stories

### US-001: Add createCustomer method to frontend API client
**Description:** As a developer, I need a frontend API method to create customers so the UI can communicate with the backend.

**Acceptance Criteria:**
- [ ] Add `createCustomer(data: CreateCustomerData)` method to `CustomerApiClient` class
- [ ] Method sends POST request to `/api/customers` with JSON body
- [ ] Returns the created `Customer` object on success
- [ ] Handles validation errors (400) and extracts field-level error messages
- [ ] Handles duplicate email error (409 Conflict) with user-friendly message
- [ ] Add `CreateCustomerData` type to `types.ts` matching backend DTO
- [ ] Code builds successfully
- [ ] All tests pass with code coverage greater than 80%

### US-002: Create CustomerForm component
**Description:** As a user, I want a form to enter customer details so I can create new customers.

**Acceptance Criteria:**
- [ ] Create `CustomerForm.tsx` component with fields: Name (required), Email (required), Phone (optional), Address (optional)
- [ ] Use existing shadcn/ui components (Input, Label, Button)
- [ ] Form is responsive (stacked on mobile, can be wider on desktop)
- [ ] Submit button shows loading state during API call
- [ ] Form can be used in both modal and standalone page contexts
- [ ] Code builds successfully
- [ ] All tests pass with code coverage greater than 80%
- [ ] Verify in browser using dev-browser skill

### US-003: Implement inline field validation
**Description:** As a user, I want to see validation errors next to the relevant fields so I know exactly what to fix.

**Acceptance Criteria:**
- [ ] Display error message beneath each invalid field
- [ ] Show client-side validation errors on blur/submit (required fields, email format)
- [ ] Show server-side validation errors after failed submission
- [ ] Error styling consistent with application design (red text, error border)
- [ ] Errors clear when user corrects the field
- [ ] Code builds successfully
- [ ] All tests pass with code coverage greater than 80%
- [ ] Verify in browser using dev-browser skill

### US-004: Add toast notifications for form submission
**Description:** As a user, I want toast notifications for submission results so I have clear feedback on success or failure.

**Acceptance Criteria:**
- [ ] Show success toast when customer is created: "Customer created successfully"
- [ ] Show error toast on submission failure with summary message
- [ ] Use existing toast system (destructive variant for errors)
- [ ] Toast appears in addition to inline validation errors
- [ ] Code builds successfully
- [ ] All tests pass with code coverage greater than 80%
- [ ] Verify in browser using dev-browser skill

### US-005: Add Create Customer button and modal to search page
**Description:** As a user, I want a "Create Customer" button on the search page so I can quickly add new customers without leaving the page.

**Acceptance Criteria:**
- [ ] Add "Create Customer" button in search page header (next to search form)
- [ ] Button opens a modal dialog containing the CustomerForm
- [ ] Modal has appropriate title: "Create New Customer"
- [ ] Modal can be closed via X button or clicking outside
- [ ] On successful creation, modal closes and navigates to customer details
- [ ] Button is visible on both desktop and mobile layouts
- [ ] Code builds successfully
- [ ] All tests pass with code coverage greater than 80%
- [ ] Verify in browser using dev-browser skill

### US-006: Create dedicated customer creation page
**Description:** As a user, I want a dedicated page for creating customers so I have a full-screen experience when needed.

**Acceptance Criteria:**
- [ ] Create new page at `/customers/new`
- [ ] Page contains CustomerForm component with appropriate heading
- [ ] Include "Back to Search" link/button for navigation
- [ ] On successful creation, navigate to customer details page
- [ ] Page is responsive and follows existing layout patterns
- [ ] Code builds successfully
- [ ] All tests pass with code coverage greater than 80%
- [ ] Verify in browser using dev-browser skill

### US-007: Enforce unique email validation
**Description:** As a user, I want to be informed if an email is already in use so I can correct it before submission.

**Acceptance Criteria:**
- [ ] Backend returns 409 Conflict when email already exists
- [ ] Frontend displays user-friendly message: "A customer with this email already exists"
- [ ] Error is shown both as inline error on email field and in toast
- [ ] User can correct email and resubmit without refreshing
- [ ] Code builds successfully
- [ ] All tests pass with code coverage greater than 80%
- [ ] Verify in browser using dev-browser skill

### US-008: Navigate to customer details after creation
**Description:** As a user, I want to see the newly created customer's details immediately so I can verify the information.

**Acceptance Criteria:**
- [ ] After successful creation, automatically navigate to `/customers/[id]` or open customer details
- [ ] If using modal on search page, close modal and show CustomerDetailsDialog for new customer
- [ ] If using dedicated page, navigate to customer details view
- [ ] Customer details show all entered information
- [ ] Code builds successfully
- [ ] All tests pass with code coverage greater than 80%
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: The system must provide a `createCustomer` API method in the frontend client that sends POST requests to `/api/customers`
- FR-2: The CustomerForm component must include fields for Name (required, max 100 chars), Email (required, valid format), Phone (optional, max 20 chars), and Address (optional, max 500 chars)
- FR-3: The system must display inline validation errors beneath each invalid field
- FR-4: The system must display toast notifications for both successful creation and submission failures
- FR-5: The search page must include a "Create Customer" button that opens a modal with the CustomerForm
- FR-6: The system must provide a dedicated creation page at `/customers/new`
- FR-7: The system must reject customer creation if the email already exists (409 Conflict) and display appropriate error messaging
- FR-8: The system must navigate to the customer details view after successful creation
- FR-9: All form interactions must be responsive and work on both desktop and mobile devices
- FR-10: The submit button must show a loading/disabled state during API calls to prevent double submission

## Non-Goals

- No bulk customer import functionality
- No customer avatar or profile image upload
- No integration with external CRM systems
- No auto-complete or address lookup for the address field
- No draft saving or form persistence across sessions
- No customer creation via API keys or external authentication

## Design Considerations

- Reuse existing shadcn/ui components: Dialog, Input, Label, Button, Toast
- Follow existing responsive patterns (mobile-first, `md:` breakpoint)
- Modal should match styling of existing CustomerDetailsDialog
- Form layout: single column on mobile, potentially two columns on larger screens for optional fields
- Loading state should use existing Button loading pattern if available, or add spinner

## Technical Considerations

- Backend POST `/api/customers` endpoint already exists and accepts `CreateCustomerDto`
- Need to add POST support to `CustomerApiClient` (currently only has GET methods)
- Validation errors from backend come in `errors` object with field names as keys
- Email uniqueness check should be performed at database level (existing constraint or add one)
- Use existing `useToast` hook for notifications
- Client-side validation should mirror backend validation rules for immediate feedback

## Success Metrics

- Users can create a new customer in under 30 seconds
- Form validation prevents submission of invalid data
- Zero duplicate email entries in database
- Error messages are clear and actionable
- Feature works consistently across desktop and mobile

## Open Questions

- Should there be a confirmation step before final submission?
- Should the form remember previously entered values for rapid entry of multiple customers?
- Should there be keyboard shortcuts (e.g., Ctrl+Enter to submit)?
