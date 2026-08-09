# Code Review Skill

## Purpose

Perform a focused, high-signal code review of the provided changes.

The review should identify real correctness, reliability, security, performance, maintainability, and compatibility issues. Avoid low-value style commentary unless it materially affects readability, safety, or future maintenance.

The goal is to help the author understand:

* **What** is wrong
* **Why** it matters
* **How** it can fail
* **How** to fix it

## Review Priorities

Classify every finding using one of the following severities.

### P0 — Critical

Issues that can cause catastrophic or immediate impact.

Examples include:

* Data loss or corruption
* Authentication or authorization bypass
* Remote code execution
* Secret or credential exposure
* Large-scale production outage
* Irreversible destructive behavior
* Severe security vulnerabilities exploitable in normal usage

P0 findings should be extremely rare and require strong evidence.

### P1 — High

Serious bugs likely to affect production behavior or users.

Examples include:

* Incorrect core business logic
* Requests consistently failing for common inputs
* Broken authentication or permissions for a meaningful subset of users
* Race conditions that can corrupt state
* Major backwards compatibility breaks
* Resource leaks that can cause outages
* Security vulnerabilities with meaningful impact
* Incorrect database writes or transactional behavior

### P2 — Medium

Real defects with limited scope or lower likelihood.

Examples include:

* Incorrect behavior for edge cases
* Missing error handling
* Partial failure scenarios handled incorrectly
* Performance regressions on realistic workloads
* Incorrect caching or stale state
* Validation gaps
* Retry or timeout problems
* Non-obvious maintainability problems likely to cause future defects

### P3 — Low

Minor but valid issues worth fixing.

Examples include:

* Misleading error messages
* Small robustness problems
* Weak defensive handling
* Minor performance inefficiencies
* Confusing implementation choices
* Tests missing for behavior introduced by the change

Do not use P3 for subjective style preferences.

## Review Rules

Only report an issue when you can explain a concrete failure mode.

Do not invent hypothetical problems without evidence from the code.

Do not report:

* Formatting preferences
* Naming preferences unless misleading or dangerous
* Missing comments unless the code is genuinely difficult to understand
* General refactoring opportunities with no correctness or maintenance impact
* Existing issues unrelated to the submitted changes
* Problems already handled elsewhere in the code
* Purely theoretical race conditions without a realistic execution path
* Speculative security concerns without a plausible attack path

Prefer fewer high-confidence findings over many weak findings.

## Review Process

First understand the intent of the change.

Determine:

* What behavior is being added or modified
* Which callers depend on the changed code
* What assumptions the new implementation makes
* What invariants must remain true
* What failure paths exist
* Whether behavior changed intentionally or accidentally

Then inspect the changes for:

* Correctness
* Error handling
* Boundary conditions
* Null, undefined, empty, and malformed inputs
* Concurrency and race conditions
* Transaction boundaries
* State consistency
* Security and permissions
* Input validation
* Resource cleanup
* Timeouts and retries
* Performance regressions
* API compatibility
* Schema compatibility
* Migration safety
* Caching behavior
* Idempotency
* Logging and observability
* Test coverage for newly introduced behavior

When possible, trace the surrounding code rather than reviewing the diff in isolation.

## Finding Requirements

Every finding must include:

### Severity

One of:

`P0`, `P1`, `P2`, or `P3`

### Title

A concise description of the issue.

The title should describe the actual bug, not the implementation detail.

Good:

`P1: Failed payment retries can create duplicate charges`

Bad:

`P1: Problem in retryPayment()`

### Location

Reference the smallest useful code range.

Include:

* File path
* Relevant line or line range
* Function or symbol when useful

Do not attach a finding to a large block when only a few lines are responsible.

### What

Explain the incorrect behavior.

### Why

Explain why it matters and who or what is affected.

### How It Fails

Describe a realistic execution path that triggers the issue.

Use concrete inputs or state when possible.

### Suggested Fix

Describe the expected correction.

Do not require the author to use your exact implementation if multiple valid fixes exist.

## Finding Format

Use this structure for each finding:

`[P1] Short descriptive title`

**Location:** `path/to/file.ts:42-48`

**What:**
Describe the bug.

**Why:**
Explain the impact.

**How it fails:**
Describe the concrete failure scenario.

**Suggested fix:**
Explain how the behavior should be corrected.

## Example Finding

`[P1] Retry path can charge the customer twice`

**Location:** `src/payments/charge.ts:88-103`

**What:**
The retry path creates a new charge without reusing an idempotency key from the original attempt.

**Why:**
If the first request succeeds at the payment provider but the response is lost, retrying this code can create a second successful charge.

**How it fails:**
A network timeout occurs after the provider processes the first charge. The application treats the attempt as failed and retries, creating another charge with a new request identifier.

**Suggested fix:**
Generate an idempotency key before the first attempt and reuse it across all retries for the same logical payment.

## Confidence

Only include findings you believe are actionable.

Use the following internal confidence guideline:

* **High confidence:** clear defect with a reproducible or directly traceable failure path
* **Medium confidence:** strong evidence but depends on behavior outside the visible change
* **Low confidence:** speculative

Do not include low-confidence findings.

If context outside the diff is required to verify a finding, inspect that context when available.

## Tests

Check whether tests cover the behavior introduced by the change.

Report missing tests only when the missing coverage creates a meaningful regression risk.

A missing test should usually be P2 or P3 unless the untested behavior is especially critical.

When reporting a test gap, state exactly which behavior or failure path is not covered.

Avoid generic findings such as:

`Add more tests.`

Prefer:

`[P2] Retry test does not cover a successful upstream request followed by a local timeout.`

## Security Review

Pay special attention to:

* Authentication
* Authorization
* Tenant isolation
* SQL injection
* Command injection
* Path traversal
* SSRF
* XSS
* CSRF
* Unsafe deserialization
* Secrets exposure
* Cryptographic misuse
* Untrusted redirects
* User-controlled URLs
* File uploads
* Privilege escalation

Only report security findings with a concrete attack or abuse path.

## Database Changes

For schema or database changes, check:

* Backwards compatibility during rollout
* Nullability changes
* Default values
* Existing row behavior
* Locking implications
* Index requirements
* Long-running migrations
* Transaction correctness
* Foreign key behavior
* Data backfills
* Read/write compatibility between old and new application versions

## API Changes

For API changes, check:

* Backwards compatibility
* Required versus optional fields
* Response shape changes
* HTTP status behavior
* Pagination
* Error contracts
* Authentication requirements
* Validation
* Retry and idempotency behavior

## Concurrency

When code modifies shared state, check:

* Read-modify-write races
* Lost updates
* Duplicate processing
* Missing locks
* Incorrect transaction isolation
* Non-atomic operations
* Reentrant execution
* Parallel retries
* Worker duplication

Do not report concurrency bugs unless you can explain the interleaving that causes failure.

## Performance

Report performance findings only when there is a meaningful likely impact.

Examples:

* N+1 queries
* Unbounded loops over user-controlled data
* Loading entire datasets into memory unnecessarily
* Repeated expensive work inside hot paths
* Missing indexes for newly introduced query patterns
* Blocking operations in latency-sensitive paths

Avoid micro-optimizations.

## Output

Start with a short summary of the review.

Then list findings ordered by severity:

`P0 → P1 → P2 → P3`

Within each severity, put the highest-impact and highest-confidence findings first.

End with a verdict:

* **Block** — P0 or significant P1 findings exist
* **Needs fixes** — actionable P1/P2 findings exist
* **Looks good with minor issues** — only P3 findings exist
* **Looks good** — no actionable findings found

If there are no findings, say so clearly.

Do not manufacture findings just to produce output.

## Output Example

### Summary

The change is generally sound, but the retry implementation can duplicate writes and the new cache key does not include tenant identity.

### Findings

#### [P1] Retry can create duplicate records

**Location:** `src/jobs/process.ts:71-89`

**What:**
...

**Why:**
...

**How it fails:**
...

**Suggested fix:**
...

#### [P2] Cache entries leak across tenants

**Location:** `src/cache/user.ts:24`

**What:**
...

### Verdict

**Needs fixes**

## Communication Style

Be concise, technical, and specific.

Do not be hostile or sarcastic.

Do not praise the code unnecessarily.

Do not use vague phrases such as:

* "This could potentially cause issues."
* "You might want to consider..."
* "It may be better to..."

State the concrete behavior instead.

Do not add trailing generated-by, AI attribution, signature, or promotional lines.

Never include:

`Generated by ...`

`Reviewed by AI`

`Created with ...`

or equivalent attribution unless explicitly requested.
