# [MedBud](https://www.medbud.space/)

MedBud is a healthcare transparency app that helps people understand hospital bills, medicine prices, procedures, and insurance policies.

The goal is simple: give patients enough context, evidence, and reference data to ask better questions about what they are being charged and what their insurance may cover.

MedBud does not diagnose patients or decide whether a hospital charge is illegal. It surfaces things worth checking, shows where the numbers came from, and helps users understand what to ask next.

## Core workflows

### Review a hospital bill

Users can upload a hospital bill or estimate.

MedBud can:

- extract text from the document
- identify medicines, procedures, tests, consumables, and charges
- normalize medicine identity, strength, dosage form, and unit
- compare compatible medicines against NPPA and Jan Aushadhi reference data
- compare supported procedures against CGHS reference rates
- detect duplicate, unclear, unusual, or potentially overlapping charges
- calculate potential price differences only when the comparison is safe
- show source and evidence behind each finding
- generate practical questions to ask the hospital

### Understand an insurance policy

Users can upload an insurance policy.

MedBud can:

- read the policy page by page
- split large policies into bounded sections
- extract structured policy facts
- summarize room-rent limits, co-pay, deductible, waiting periods, exclusions, and sub-limits
- retrieve relevant policy sections for user questions
- answer with page and section citations

### Compare a bill with a policy

Users can upload both a hospital estimate and an insurance policy.

MedBud calculates:

- applicable policy sub-limits
- deductible impact
- co-pay
- estimated insurer payment
- estimated patient responsibility

The calculation is deterministic. The language model explains results but does not calculate them.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Groq
- PostgreSQL full-text search
- Docker

The project runs as a single Next.js application. There is no separate backend service.

## Run locally

### Prerequisites

- Node.js 22.x
- A Supabase project, or Docker plus the Supabase CLI for a local Supabase instance
- A Groq API key

### Configure the environment

Create `healthcare-check/.env.local` with the following values:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_DB_URL=your-supabase-database-url
GROQ_API_KEY=your-groq-api-key
```

Create a private Supabase Storage bucket named `documents`. The application uses this bucket for uploaded bills and policies.

### Apply the database schema

From the repository root, link the Supabase CLI to a hosted project and apply the migrations:

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

For a local Supabase instance, start Supabase and reset the database so migrations and the demo seed data are applied:

```bash
npx supabase start
npx supabase db reset
```

Use the URLs and keys printed by `npx supabase status` in `.env.local` when running against local Supabase.

### Install and start the app

```bash
cd healthcare-check
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

### Run with Docker Compose

Alternatively, keep the environment variables in a `.env` file at the repository root and run:

```bash
docker compose up
```

Docker Compose installs dependencies and starts the Next.js development server on port 3000.

## Data flow

```text
User
  ↓
Authentication
  ↓
Document upload
  ↓
Private storage
  ↓
Page-level parsing
  ↓
Structured extraction
  ↓
Normalization
  ↓
Reference lookup or retrieval
  ↓
Deterministic audit
  ↓
Evidence-backed findings
  ↓
User-facing explanation
```

## Document handling

Uploaded files are stored in a private Supabase Storage bucket.

The browser uploads directly to Storage using signed upload URLs instead of routing the whole file through the application server.

Digital PDFs are parsed with `pdfjs-dist`.

Images and scanned documents use a vision-capable Groq model.

Extracted text is stored page by page so findings can point back to the original document.

## Structured extraction

The language model is used mainly for understanding messy document content.

It returns structured JSON rather than free-form prose.

For hospital documents, extracted fields include:

- item name
- item type
- quantity
- unit price
- total price
- source page
- raw text
- confidence

Medicine extraction also resolves:

- ingredient or salt
- strength
- dosage form
- route where available
- combination components
- pack or unit context

For insurance policies, extraction produces fields such as:

- sum insured
- room-rent limit
- ICU limit
- co-pay
- deductible
- waiting periods
- sub-limits
- exclusions
- consumables coverage

## Medicine identity and pricing

Medicine pricing is treated as a structured matching problem.

```text
raw medicine text
  ↓
structured identity
  ↓
normalization
  ↓
canonical medicine
  ↓
reference observations
  ↓
unit compatibility
  ↓
deterministic comparison
```

The medicine model includes canonical products, components, aliases, and price observations.

Important distinctions are preserved:

- 500 mg is not treated as 1 g
- tablet is not treated as injection
- per ml is not treated as per vial
- combination medicines are not matched to single ingredients

If medicine identity or unit cannot be verified, MedBud does not calculate a price difference.

## Reference sources

### NPPA

Used for medicine ceiling-price references.

NPPA values are treated as regulatory references, not as universal hospital billing caps.

### PMBI / Jan Aushadhi

Used for Jan Aushadhi product and MRP references.

These are shown separately from NPPA because they represent a different kind of price information.

### CGHS

Used for a narrow set of procedure and package reference rates.

Only unambiguous rate contexts are used for automatic comparison.

Context-specific records are stored but skipped when applicability is unclear.

## Reference ingestion and versioning

Reference data is versioned instead of overwritten in place.

The ingestion layer supports:

- source adapters
- normalization
- validation
- content hashing
- retrieval timestamps
- effective dates
- accepted or rejected snapshots
- historical observation versions
- provenance

Audits use the latest accepted reference snapshot rather than blindly using the newest imported data.

This helps prevent malformed source updates from replacing valid production data.

## Policy retrieval

Insurance policy questions use retrieval before generation.

The current retrieval system uses PostgreSQL full-text search.

```text
User question
  ↓
search policy chunks
  ↓
retrieve relevant sections
  ↓
send only those sections to Groq
  ↓
answer with citations
```

This is used for long, unstructured policy documents.

Medicine and procedure pricing do not use RAG because they are better handled through structured database lookup.

## Large policy handling

Large policies are split into bounded page and section chunks.

Each chunk is processed separately and the extracted policy facts are merged deterministically.

Merge behavior includes:

- missing values do not overwrite known values
- equal values merge cleanly
- conflicting values are not silently resolved
- conflicts can be marked for confirmation
- arrays are deduplicated

This avoids sending an entire long policy to the model in one request.

## Deterministic audit engine

The audit engine is implemented in TypeScript.

The language model does not decide whether a charge should be flagged.

Checks include:

- medicine price comparison
- procedure reference comparison
- duplicate charges
- quantity checks
- unit mismatch
- package overlap
- unexplained charges
- insurance coverage limits
- deductible and co-pay calculations

Where exact arithmetic is possible, the calculation is done in code.

## Evidence lineage

Important findings preserve the path from the original document to the final result.

```text
original document
  ↓
page and quote
  ↓
extracted item or policy fact
  ↓
normalized or canonical entity
  ↓
reference observation
  ↓
rule and calculation
  ↓
final finding
```

Evidence can include:

- document ID
- source page
- source quote
- extracted item ID
- canonical medicine ID
- reference observation ID
- source URL
- rule ID and version
- calculation inputs
- calculation output

This makes findings easier to explain, debug, and verify.

## Security

User data is isolated using Supabase Row Level Security.

Cases, documents, findings, and policy data are scoped to the authenticated user.

Uploaded documents are private and accessed through controlled Storage paths and signed URLs.

## Testing

The project includes regression tests around the deterministic parts of the pipeline.

Coverage includes:

- medicine normalization
- medicine matching
- unit safety
- audit rules
- policy chunking
- policy merging
- insurance calculations
- reference ingestion and versioning
- CGHS behavior
- evidence lineage

The goal is to catch regressions when prompts, rules, matching logic, or reference data change.

## Engineering decisions

### AI is used only where it helps

```text
Document understanding
→ LLM

Structured reference lookup
→ SQL

Medicine matching
→ normalization and deterministic rules

Policy search
→ full-text retrieval

Financial calculations
→ TypeScript

Natural-language explanation
→ LLM
```

The system avoids using a language model for exact calculations, identity matching, or structured price lookup.

### Why not a vector database?

Medicine and procedure prices are structured records and are more safely queried with SQL.

Insurance policies are long unstructured documents, so retrieval is useful there.

The current policy retrieval uses PostgreSQL full-text search. Vector or hybrid retrieval can be added later if evaluation shows it is needed.

### Why Supabase?

Supabase provides authentication, PostgreSQL, Row Level Security, and private object storage in one system.

This keeps the MVP simple and avoids unnecessary infrastructure.

### Why not S3 yet?

Supabase Storage already supports the current private upload model.

S3 becomes more useful later if the product needs larger-scale object storage, event-driven processing, more advanced lifecycle policies, or deeper cloud infrastructure controls.

## Future targets

The next useful improvements are depth and reliability rather than unrelated features.

Possible directions:

- expand NPPA and PMBI coverage
- expand CGHS procedure coverage
- add PM-JAY package references
- automate reference-source refreshes
- add human correction for extracted fields
- improve procedure normalization and alias matching
- build a larger real-world evaluation corpus
- add hybrid full-text and vector retrieval if policy retrieval needs it
- add reranking for larger reference corpora
- move long-running document processing to background jobs if usage grows
- add stronger access and audit logging
- expose source freshness and version history more clearly

## Product principle

MedBud is not intended to tell a patient that a hospital or insurer is wrong.

It is intended to answer:

- What am I being charged?
- What looks worth checking?
- What reference was used?
- Why was this flagged?
- What does my policy say?
- How much might insurance cover?
- What should I ask next?

The product is built around evidence, traceability, conservative comparisons, and deterministic calculations where possible.
