# Decision Log

Lightweight Architecture Decision Records (ADRs), based on Michael Nygard's format:
**Context** (the situation) → **Decision** (what we chose) → **Consequences** (what gets easier _and_ harder).

---

## ADR-001: MongoDB + Mongoose for data storage

**Status:** Accepted · 2026-11-05

**Context:** The brief requires one unfamiliar library/framework/tool. The data in scope is one entity (Candidate) with notes and an AI summary that are always read together. There are no relationships to other entities.

**Decision:** Use MongoDB (run locally with Docker Compose) with Mongoose as the ODM. This is my unfamiliar component. Notes and the summary are embedded in the candidate document.

**Consequences:**

- ➕ One read loads the whole detail page; append-only notes map naturally to `$push`.
- ➕ No migrations, so it's faster to iterate on the AI summary's shape.
- ➖ Weaker fit if this grew into a real ATS (jobs, interviewers, funnel reporting); those are relational problems where I'd move to PostgreSQL.
- ➖ Learning a new database inside a one-day timebox is a schedule risk.

---

## ADR-002: TypeScript across client and server

**Status:** Accepted · 2026-11-05 (replaces an earlier choice of plain JavaScript)

**Context:** One-day timebox. I first chose plain JavaScript to avoid configuration friction, but that friction came from Prisma 7, which is no longer in the stack. Vite, Vitest and the Anthropic SDK all support TypeScript out of the box.

**Decision:** TypeScript with `strict` mode. The server runs with `tsx` in development (no build step); `tsc --noEmit` is used only for type checking. Dependency contracts (e.g. `SummaryProvider`, `AppDependencies`) are TypeScript interfaces.

**Consequences:**

- ➕ SOLID contracts are enforced by the compiler instead of being comments.
- ➕ Type errors in my own or AI-generated code are caught before running.
- ➖ ~30–60 extra minutes in the timebox, mostly on types (Mongoose types in particular).
- ➖ Production would need a build step or `tsx` in the container (covered in the deployment design).

---

## ADR-003: Anthropic Claude Haiku for resume summaries

**Status:** Accepted · 2026-11-05

**Context:** Need an AI provider/model for short structured summaries. I already have an Anthropic API key.

**Decision:** Anthropic API via the official SDK, using a Haiku model with structured (JSON schema) output.

**Consequences:**

- ➕ Fast and low-cost; structured output makes the response shape predictable.
- ➕ Only one file knows about Anthropic, so the provider can be swapped.
- ➖ Requires an API key to run the AI feature; the rest of the app works without it.

---

## ADR-004: Local run + deployment design instead of deploying

**Status:** Accepted · 2026-11-05

**Context:** Deployment is optional; one-day timebox.

**Decision:** Run locally (Docker Compose for MongoDB, one `npm run dev`). Submit a one-page AWS deployment design instead.

**Consequences:**

- ➕ Time goes into the core pipeline and AI handling.
- ➖ Reviewers can't click a live link; screenshots/video cover this.

---

## Deliberately out of scope

- Authentication (out of scope per brief)
- PDF upload: `.txt` upload only
- Editing candidate details (not required)
- Pagination, UI polish, frontend tests

## What I'd build next

-
