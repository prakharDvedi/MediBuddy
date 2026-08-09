# Frontend Skill

## Purpose

Use this skill when designing or implementing frontend UI for Prakhar's projects, especially product dashboards, user flows, hackathon demos, and presentable MVPs.

The goal is to produce interfaces that are clear, compact, trustworthy, modular, and easy to demo. Prefer useful product structure over decorative styling.

---

## Core Design Principles

### 1. Function before decoration

Start with:
- user intent
- primary action
- information hierarchy
- clear next steps
- obvious state and feedback

Do not add visual effects to compensate for weak structure.

Avoid:
- decorative AI imagery
- unnecessary illustrations
- excessive gradients
- glassmorphism
- giant rounded cards
- gimmicky animations
- emojis in product UI
- empty dashboard analytics
- generic SaaS filler

---

### 2. Design around the user's mental model

Do not expose internal implementation concepts unless genuinely useful.

Avoid user-facing language like:
- RAG
- embeddings
- vector search
- audit engine
- normalized entities
- confidence schema
- reference observations
- extraction pipeline

Translate backend concepts into user questions:

- What am I paying?
- What looks unusual?
- How much could be worth questioning?
- Why was this flagged?
- Where did this number come from?
- What should I ask?
- What does my insurance cover?
- How much might I need to pay?

The frontend should bridge system logic and human decisions.

---

### 3. Intent-led navigation

Prefer action-oriented entry points over generic CRUD language.

Better:
- Check a hospital bill or estimate
- Understand my insurance policy
- Check what insurance may pay

Worse:
- New case
- Create record
- Upload document
- Start analysis

Internal entities such as `Case` may exist in the backend, but the interface should begin with what the user wants to accomplish.

---

### 4. Keep dashboards useful, not decorative

A dashboard should answer:
- What can I do here?
- What needs my attention?
- What did the system find?
- Where do I continue?

Recommended hierarchy:

```text
Primary user actions

Recent / active work

Important results or status
```

Avoid filling dashboards with meaningless charts, totals, activity counters, or widgets just to make them look more "dashboard-like".

Compact case rows are generally preferred over tall cards with empty space.

---

### 5. Information density should be deliberate

Avoid excessive whitespace that makes a functional app feel like a landing page.

Use enough spacing for readability, but keep related information visually grouped.

Prefer:
- compact cards
- short descriptions
- clear section spacing
- concise metadata
- visible actions

Avoid:
- oversized card heights
- giant empty areas
- excessive top/bottom padding
- repeated labels that add no information

---

## Visual Direction

### General tone

Interfaces should feel:
- serious
- modern
- calm
- trustworthy
- consumer-friendly
- polished without looking over-designed

For healthcare / financial products, prioritize clarity and credibility over novelty.

---

### Color

Default structural design can remain grayscale.

Introduce color only when it communicates meaning:
- positive / verified
- warning / needs review
- error / failed
- active / primary
- informational

Do not add color merely to make the page "pop".

Avoid turning every card into a different color.

Use subtle shades, accents, borders, and glows only after the underlying layout is solid.

---

### Typography

Use clear hierarchy.

Typical structure:

```text
Page title
Primary result / important number
Section heading
Card title
Body copy
Metadata / source / secondary text
```

Prioritize readability over stylistic display fonts.

Avoid jargon-heavy labels and uppercase overload.

Use short, direct copy.

---

### Cards and surfaces

Cards should have a reason to exist.

Use them for:
- separate actions
- findings
- evidence
- coverage summaries
- recent cases
- comparison results

Avoid nesting cards inside cards unless the hierarchy genuinely requires it.

Prefer:
- subtle borders
- restrained radius
- mild background contrast
- minimal shadow

Do not make every surface float dramatically.

---

## Interaction Principles

### Loading states

Do not show a generic spinner for long multi-stage operations when meaningful stages are available.

Prefer step-based feedback such as:

```text
Uploading
Reading document
Understanding charges
Checking references
Preparing questions
```

Use:
- done
- active
- pending
- error

Keep deterministic processing as stage updates.

Use token streaming only for genuinely natural-language responses such as:
- policy Q&A
- explanations
- generated questions

Do not stream raw JSON or structured extraction output.

---

### Progressive disclosure

Show the important conclusion first, detail second.

For example:

```text
Potential savings to investigate: ₹3,120

4 things worth checking

[Finding summary]

Why this was flagged
Evidence
Source
What to ask
```

Do not lead with raw technical metadata.

Allow evidence and source details to expand when needed.

---

### Status clarity

Statuses must represent actual state, not vague labels.

Examples:
- Processing
- Ready to review
- 2 things worth checking
- Nothing flagged
- Needs attention
- Failed

Avoid displaying redundant status text next to a result that already communicates the state.

---

### Empty states

Empty states should tell the user what to do next.

Bad:
> No cases found.

Better:
> No healthcare checks yet. Start by uploading a hospital bill or insurance policy.

Keep them concise.

---

### Error states

Errors should:
- explain what failed
- preserve user context
- offer the next action
- avoid exposing raw backend errors

Do not hide failures behind endless loading.

---

## Findings and Evidence UX

For audit-style products, findings should be immediately understandable.

Recommended order:

1. What was found
2. Relevant amount / impact
3. Why it matters
4. Evidence
5. Source
6. What the user can ask or do

Example:

```text
Medicine price worth checking

Hospital charge
₹480 / vial

NPPA ceiling price
₹63.88 / vial

Potential price difference
₹416.12

Why this was flagged
The medicine identity and unit matched the available reference.

Ask the hospital
Could you explain the pricing basis for this medicine?

Source
NPPA, SO 1575(E), 25 Mar 2026
```

Do not frame uncertain comparisons as definitive wrongdoing.

Prefer:
- worth checking
- potential price difference
- requires clarification
- estimated
- could not be verified

Avoid:
- overcharged
- fraudulent
- definitely incorrect
- guaranteed savings

---

## Frontend Engineering Principles

### 1. Modularity

Do not place an entire screen in one giant component.

Split by responsibility.

Examples:
- `ActionCard`
- `RecentCaseCard`
- `FindingCard`
- `EvidencePanel`
- `CoverageSummary`
- `ProcessingSteps`
- `MedicinePriceEvidence`

A component should generally have one clear reason to change.

---

### 2. Reusability

Reuse components and utilities when the UX pattern is genuinely shared.

Do not duplicate:
- status rendering
- intent labels
- evidence presentation
- money formatting
- date formatting
- confidence labels
- route construction

Do not force abstraction where only one use case exists.

---

### 3. File size and responsibility

Keep files reasonably small and focused.

If a page/component starts handling:
- data fetching
- transformations
- business rules
- routing
- presentation
- multiple unrelated sections

split it.

Pages should mostly orchestrate.

Business logic should not live inside presentation components.

---

### 4. TypeScript quality

Use explicit, reusable types for:
- intents
- workflow states
- findings
- evidence
- cases
- price observations
- API responses

Avoid `any`.

Prefer discriminated unions where states differ meaningfully.

---

### 5. Separate data from presentation

Where practical:
- fetch / load data in server or data-layer code
- normalize it before rendering
- pass presentation-ready props to components

Do not make UI components responsible for reconstructing business logic.

---

### 6. Avoid unnecessary dependencies

Before adding a package, ask:
- Does the existing stack already solve this?
- Is the package justified by repeated use?
- Does it increase bundle complexity for little value?

Do not add a UI library just for one component.

---

### 7. Preserve existing architecture

When polishing frontend:
- do not redesign backend flows without a real need
- do not create new database concepts to support cosmetic changes
- do not duplicate API logic
- do not break existing authenticated flows

Prefer adapting copy, routing intent, and presentation around existing functionality.

---

## Responsive Design

Always verify:
- desktop
- laptop
- 390px mobile width

Check for:
- horizontal overflow
- text wrapping
- compact card behavior
- button reachability
- table overflow
- evidence readability
- long hospital / medicine / policy names

On mobile:
- stack primary actions
- keep important numbers visible
- collapse secondary metadata where useful
- avoid dense multi-column tables if cards or rows read better

Do not make mobile an afterthought.

---

## Demo-Oriented Design

For hackathon or product demos, optimize the experience for comprehension in seconds.

The demo should clearly communicate:

```text
Input
↓
System understanding
↓
Evidence-backed finding
↓
Financial / practical impact
↓
Next action
```

The frontend should make the "wow" come from product utility, not animation.

Strong demo moments include:
- upload → structured understanding
- potential savings to investigate
- source-backed medicine comparison
- policy question answered with citation
- insurer vs patient payment estimate
- practical question generated for hospital/insurer

Do not bury the strongest result below technical detail.

---

## Preferred Workflow for Frontend Changes

Before coding:

1. Inspect the existing page and reusable components.
2. Identify the user's primary goal.
3. Define hierarchy and CTA.
4. Decide what should be visible vs progressively disclosed.
5. Confirm whether the change is structural or merely decorative.

During coding:

1. Keep components modular.
2. Reuse existing types/utilities.
3. Avoid unrelated refactors.
4. Keep responsive behavior in mind from the start.
5. Type-check and lint incrementally.

After coding:

1. Run TypeScript checks.
2. Run ESLint.
3. Verify desktop.
4. Verify 390px mobile.
5. Test meaningful UI states.
6. Confirm no existing flow regressed.
7. Report design decisions and tradeoffs.

---

## Review Checklist

Before calling a frontend task complete, ask:

- Is the user's primary action obvious?
- Does the page explain value without jargon?
- Is important information visible first?
- Is there unnecessary empty space?
- Are cards compact enough?
- Are statuses truthful and clear?
- Are actions phrased around user intent?
- Are important results easy to scan?
- Are evidence and sources accessible?
- Is uncertainty represented honestly?
- Does mobile work?
- Are components modular?
- Is business logic kept out of UI components?
- Did we avoid adding unnecessary dependencies?
- Did we preserve existing functionality?

---

## Default Bias

When choosing between two frontend solutions, prefer the one that is:

- simpler
- clearer
- more compact
- easier to explain
- easier to maintain
- more honest about system state
- more useful to the user

Do not optimize for visual novelty.
