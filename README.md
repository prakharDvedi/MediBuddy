# [MedBud](https://www.medbud.space/)

MedBud is a healthcare transparency app that helps people understand hospital bills, medicine prices, procedures, and insurance policies.

It gives patients evidence and context to ask better questions about what they are being charged and what their insurance may cover. MedBud does not diagnose patients or decide whether a charge is illegal.

## What it does

### Review hospital bills

- Upload a hospital bill or estimate.
- Extract medicines, procedures, tests, consumables, and charges.
- Compare supported medicines with NPPA and Jan Aushadhi reference data.
- Compare supported procedures with CGHS reference rates.
- Identify duplicate, unclear, unusual, or overlapping charges.
- Show evidence and suggest questions to ask the hospital.

### Understand insurance policies

- Upload an insurance policy.
- Summarize room-rent limits, co-pay, deductibles, waiting periods, exclusions, and sub-limits.
- Ask questions about the policy and receive page-level citations.

#### Multilingual policy questions

Policy Q&A supports English and Hindi answers, including Hindi and Hinglish questions. The user
selects the answer language explicitly. MedBud keeps the original question separate from a compact
English retrieval query, retrieves the original English policy text, and answers in the selected
language without changing policy values or citations.

```text
Hindi / Hinglish question
  ↓
compact English retrieval terms
  ↓
English policy clause + deterministic facts
  ↓
Hindi or English explanation with the same page citation
```

Example: `Meri policy mein room rent ka limit kya hai?` can return a Hindi explanation grounded in
the English policy clause, with the original section and page shown as the source.

![Hindi policy Q&A showing grounded answer and citation](docs/multilingual-policy-qa.png)

### Compare a bill with a policy

When both documents are available, MedBud estimates:

- applicable policy limits
- deductible and co-pay impact
- insurer payment
- patient responsibility

The calculations are performed deterministically in code. AI is used to understand documents and explain results.

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, and Storage
- Groq
- PostgreSQL full-text search
- Docker

The project is a single Next.js application. There is no separate backend service.

## Run locally

### Prerequisites

- Node.js 22.x
- A Supabase project, or Docker and the Supabase CLI for local Supabase
- A Groq API key

### Configure environment variables

Create `healthcare-check/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_DB_URL=your-supabase-database-url
GROQ_API_KEY=your-groq-api-key
```

Create a private Supabase Storage bucket named `documents` for uploaded bills and policies.

### Set up Supabase

Run these commands from the `healthcare-check` directory.

For a hosted Supabase project:

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

For local Supabase:

```bash
npx supabase start
npx supabase db reset
npx supabase status
```

Use the local URLs and keys printed by `npx supabase status` in `.env.local`.

### Start the app

From the repository root:

```bash
cd healthcare-check
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Docker Compose

Alternatively, put the environment variables in a `.env` file at the repository root and run:

```bash
docker compose up
```

## Testing

From the repository root:

```bash
cd healthcare-check
npm run lint
npm test
```

Tests cover medicine matching, policy extraction, insurance calculations, reference ingestion, CGHS behavior, and evidence handling.

## Product scope

MedBud is designed to surface items worth checking, show where information came from, and explain what to ask next. It is not a medical diagnosis tool, legal determination, or substitute for an insurer's final claim decision.
