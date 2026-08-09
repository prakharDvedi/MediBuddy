# Backend Engineering Guardrails

## Purpose

Apply these guardrails when modifying backend code.

The goal is to make changes that are:

* Minimal
* Correct
* Reusable
* Consistent
* Efficient
* Easy to maintain

Do not redesign the system unless the task requires it.

Prefer improving existing code over creating parallel implementations.

---

## Reuse Before Adding

Before creating a new:

* Function
* Helper
* Service
* Repository method
* Utility
* Validator
* Serializer
* Middleware
* Query helper
* Error type
* Constant
* Configuration value

search the existing codebase for similar behavior.

If an existing implementation can support the new use case with a small, safe modification, prefer extending it.

Do not create:

`getUserById()`

when an existing:

`getUser()`

can support the same behavior with a minor generalization.

Avoid near-duplicate functions that differ only by one argument or condition.

---

## Avoid Parallel Implementations

Do not introduce a second way to perform the same operation unless there is a clear reason.

Watch for duplicated logic around:

* Authentication
* Authorization
* Data fetching
* Pagination
* Validation
* Error mapping
* Retries
* API clients
* Serialization
* Database writes
* Logging

If two paths perform essentially the same operation, prefer one shared implementation.

---

## Modify the Right Abstraction

When behavior changes, modify the lowest appropriate shared abstraction.

Do not patch every caller if the behavior belongs in the shared function.

Do not modify a global/shared abstraction if only one caller needs special behavior.

Choose the narrowest level that correctly represents the behavior.

---

## Preserve Existing Contracts

Before changing shared code, check callers.

Avoid silently changing:

* Return types
* Error behavior
* Null handling
* Default behavior
* Side effects
* Transaction behavior
* Ordering
* Pagination
* Serialization

If an existing function is reused for a new case, make sure the modification does not break existing consumers.

---

## Keep Changes Scoped

Do not perform unrelated cleanup while implementing a task.

Avoid:

* Renaming unrelated code
* Moving unrelated files
* Reformatting large areas
* Rewriting stable abstractions
* Changing architecture without need

Small diffs are easier to verify and safer to deploy.

---

## Prefer Existing Patterns

Follow established repository patterns unless they are clearly unsuitable.

Reuse existing:

* Error handling
* Database access patterns
* Validation libraries
* Logging
* API clients
* Configuration
* Dependency injection
* Testing conventions

Do not introduce a new style because it is personally preferable.

---

## Avoid Over-Abstraction

Do not create an abstraction for a single trivial use case.

Avoid wrappers that only rename another function.

Avoid generic systems designed around hypothetical future requirements.

Introduce abstractions when they remove real duplication or isolate meaningful complexity.

---

## Avoid Under-Abstraction

If identical or nearly identical logic exists in multiple places, consider consolidating it.

Especially check repeated:

* Query construction
* Authorization checks
* Mapping logic
* Retry behavior
* Validation
* Normalization
* External API calls

Do not copy-paste behavior that should stay consistent.

---

## Check for Existing Helpers

Before manually implementing common behavior, search for existing helpers for:

* Date handling
* IDs
* Pagination
* Transactions
* Retries
* Logging
* Parsing
* Validation
* Authentication
* Authorization
* Cache access
* External clients

Do not recreate infrastructure already present in the project.

---

## Query Efficiency

When touching database code, check for:

* N+1 queries
* Repeated identical queries
* Queries inside loops
* Fetching unnecessary columns
* Loading unbounded result sets
* Missing pagination
* Missing useful indexes
* Multiple round trips that can be safely combined

Do not optimize blindly, but avoid obvious inefficiency.

---

## Avoid Work Inside Loops

Be suspicious of:

* Database calls inside loops
* Network calls inside loops
* Repeated parsing
* Repeated serialization
* Repeated configuration lookup
* Recomputing invariant values

Move invariant work outside loops where safe.

Batch operations when the system already supports batching.

---

## Avoid Unnecessary Sequential Work

If independent operations can safely run concurrently, avoid unnecessary serialization.

Do not parallelize blindly.

Check:

* Ordering requirements
* Shared state
* Rate limits
* Database pressure
* External API limits

Parallelism should improve meaningful latency without introducing correctness issues.

---

## Avoid Unbounded Work

Do not introduce operations whose cost grows without a practical bound.

Watch for:

* Fetch-all endpoints
* Unlimited loops
* Entire-table scans
* Huge in-memory collections
* Unbounded queue consumption
* Large file buffering

Use pagination, batching, streaming, or limits where appropriate.

---

## Avoid Duplicate Side Effects

When modifying retryable or asynchronous code, make sure repeated execution does not accidentally:

* Insert duplicate rows
* Send duplicate emails
* Charge twice
* Publish duplicate events
* Trigger duplicate jobs

Reuse existing idempotency mechanisms where available.

---

## Do Not Add Retries Casually

Before adding a retry, check:

* Whether the failure is transient
* Whether the operation is safe to repeat
* Whether retries already exist at another layer
* Whether retry multiplication can occur

Avoid nested retry layers unless deliberate.

---

## Transaction Awareness

When modifying multiple related writes, check whether they should be atomic.

Do not add a transaction automatically.

Do not remove an existing transaction without understanding why it exists.

Avoid holding transactions open during slow external calls where possible.

---

## Concurrency Awareness

When modifying shared mutable state or read-modify-write flows, consider concurrent execution.

Watch for:

* Duplicate creation
* Lost updates
* Check-then-write races
* Concurrent workers
* Parallel requests
* Retry races

Prefer existing database constraints or atomic primitives over process-local locking.

---

## Cache Awareness

When modifying cached behavior, verify:

* Key uniqueness
* Tenant/user scoping
* Invalidation
* Expiration
* Behavior after writes

Do not create a second cache path for the same data unless necessary.

Do not cache before determining that caching is useful.

---

## Avoid Redundant Validation

Do not scatter identical validation across several layers unless each layer protects a meaningful boundary.

Prefer one clear source of truth for domain validation.

Boundary validation may still be duplicated intentionally for safety or user experience.

---

## Authorization Must Stay Central

Do not duplicate slightly different authorization logic across endpoints.

Reuse established permission checks.

If authorization logic is changing, prefer modifying the shared policy when the rule is truly global.

Do not weaken a shared authorization function to accommodate one exceptional endpoint.

---

## Error Consistency

Reuse existing error types and mappings.

Do not create new error shapes for behavior already represented in the system.

Avoid catching errors just to return a slightly different equivalent error.

Preserve useful diagnostic context.

---

## Avoid Silent Fallbacks

Do not add fallbacks that hide failures unless degraded behavior is intentional.

Examples to question:

* Returning empty arrays after database errors
* Ignoring failed writes
* Swallowing queue failures
* Defaulting malformed values silently
* Falling back to insecure behavior

Failures should remain visible when correctness depends on them.

---

## Avoid Duplicate Configuration

Before adding a new environment variable or config option, check whether an existing setting already represents the same concept.

Do not create:

`API_TIMEOUT_MS`

and:

`HTTP_REQUEST_TIMEOUT_MS`

for effectively the same behavior unless separate control is genuinely needed.

---

## Dependency Discipline

Do not add a dependency for functionality already provided by:

* The language runtime
* The framework
* Existing project dependencies
* A small amount of straightforward code

When adding a dependency, ensure it solves a real problem.

---

## Do Not Bypass Existing Layers

Avoid direct database or network access from arbitrary locations when the project already has an established boundary.

Do not bypass shared abstractions merely because it is quicker.

Bypassing existing layers often creates:

* Duplicate logic
* Missing authorization
* Missing retries
* Missing observability
* Inconsistent behavior

---

## Naming Should Reflect Existing Concepts

Do not invent new terminology for concepts already present in the project.

If the codebase calls something a `workspace`, do not introduce `tenant` for the same entity unless intentionally migrating terminology.

Parallel terminology often leads to parallel abstractions.

---

## Data Shape Reuse

Before creating a new DTO, schema, interface, or response type, check whether an existing type already matches or can be safely extended.

Avoid multiple nearly identical representations of the same domain object.

Do not reuse a type if doing so couples unrelated contracts.

---

## Avoid Conversion Chains

Watch for unnecessary transformations such as:

`DB model → internal model → helper model → DTO → serializer model`

Each representation should have a clear purpose.

Remove redundant mapping layers when modifying the relevant code.

---

## Avoid Re-fetching Known Data

If required data is already available in the execution path, do not query it again without reason.

Pass data through when appropriate.

Do not turn everything into parameters either; keep interfaces reasonable.

---

## Avoid Passing Entire Objects Needlessly

If a function only requires an identifier or small subset of data, avoid coupling it to a large object without reason.

Conversely, do not repeatedly fetch pieces that are already available on an existing object.

Choose the interface that avoids unnecessary coupling and work.

---

## Check Hot Paths

Be more careful with code executed:

* On every request
* In middleware
* Inside loops
* During authentication
* In frequently executed jobs
* On large datasets

Small inefficiencies in hot paths can become meaningful.

---

## Logging Discipline

Do not add duplicate logs at every layer for the same failure.

Prefer one useful log with enough context.

Avoid noisy logs inside high-frequency loops unless needed.

Do not log sensitive payloads.

---

## Test Reuse

Before adding new test utilities, fixtures, factories, mocks, or helpers, search for existing equivalents.

Avoid creating a second testing framework inside the same repository.

Use existing fixtures and helpers when practical.

---

## Test the Behavior That Changed

Add or modify tests around the changed behavior.

Avoid adding broad unrelated tests just because the area is touched.

When extending an existing shared function, test both:

* The new behavior
* Existing behavior that could regress

---

## Remove Dead Paths

If a modification makes an old helper or branch truly unused, remove it when safe.

Do not leave duplicate old/new implementations indefinitely without a migration reason.

Before removal, verify there are no remaining callers.

---

## Do Not Preserve Duplication Accidentally

When replacing logic, search for other copies of the same old behavior.

A fix applied in only one of several duplicate implementations can create inconsistent behavior.

If duplication exists, decide whether the change should be shared.

---

## Prefer Deleting Over Adding

When a requirement can be met by simplifying existing code, prefer that over introducing new machinery.

Good backend changes often result in:

* Fewer branches
* Fewer helpers
* Fewer queries
* Fewer abstractions
* Fewer states

Do not force deletion, but treat simplification as a valid optimization.

---

## Avoid Cleverness

Prefer straightforward code over:

* Dense one-liners
* Deep generic abstractions
* Hidden metaprogramming
* Implicit side effects
* Complex inheritance
* Non-obvious control flow

Backend code is maintained longer than it is written.

---

## Before Writing New Code

Check:

1. Does this already exist?
2. Is there a similar implementation?
3. Can an existing function be safely extended?
4. Is this behavior already centralized elsewhere?
5. Will this create two ways to do the same thing?
6. Is the new abstraction actually needed?
7. Am I adding work to a hot path?
8. Am I introducing extra database or network calls?
9. Does this affect shared callers?
10. Can the requirement be solved with less code?

---

## Before Finishing

Review the diff and check:

1. Did I duplicate existing behavior?
2. Did I add a function that is almost the same as another?
3. Did I introduce a second abstraction for the same concept?
4. Did I add unnecessary queries or API calls?
5. Did I add work inside a loop?
6. Did I create unbounded behavior?
7. Did I modify shared behavior without checking callers?
8. Did I add configuration or dependencies unnecessarily?
9. Can any new code be removed or simplified?
10. Is there a smaller, clearer implementation?

---

## Primary Rule

Before adding code, search.

Before duplicating behavior, reuse.

Before abstracting, prove the abstraction is useful.

Before optimizing, identify the actual cost.

Before finishing, look for code that no longer needs to exist.
