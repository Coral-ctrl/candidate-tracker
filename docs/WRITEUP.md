# Write-up

## Design choices

**Feature folders, with dependencies passed in.** The controller handles HTTP, the service holds the business rules, and the repository handles data access, with a Mongoose version and an in-memory version for tests.

- ➕ Most tests don't need a database.
- ➖ More files than an app this small strictly needs.

**MongoDB + Mongoose.** A candidate's notes and summary are read together, and this was my unfamiliar component. I'd normally use PostgreSQL with Prisma.

- ➕ One read loads the whole detail page.
- ➖ MongoDB sorts stage names alphabetically, so stage sorting lives in the service. I'd move to PostgreSQL if this grew into a full tracking system with jobs and reporting.

**Archive flag instead of delete.**

- ➕ No data is lost.
- ➖ Every list query must filter out archived candidates.

**React state instead of a router library.** Three screens didn't justify a new dependency.

- ➖ The browser's back button doesn't work.

## AI feature

**Separate module, using Claude Haiku 5.5.** `backend/src/summary/` knows nothing about candidates: text goes in, and a validated summary comes out. Haiku suits a simple extraction task.

- ➕ Only one file imports the SDK, so the provider can be swapped.
- ➖ Summaries need an API key, though the rest of the app works without one.

**Generate on first open, then save.** The detail page calls `POST /api/candidates/:id/summary` when a candidate has no summary.

- ➕ Adding a candidate doesn't depend on the AI service, and a saved summary can't go stale because resume text can't be edited.
- ➖ The first viewer waits a few seconds.

**Treat resume text as untrusted.** I assumed someone could hide instructions in it and that the model could sometimes be fooled, so I added layers:

- **Prompt:** treats the resume as data and tells the model not to rate candidates or recommend hiring. Randomly generated tags around the resume stop a fake closing tag from ending it early.
- **Structured output:** the reply must fit a fixed format, and the model has no tools, so the worst outcome is misleading text.
- **Backend checks:** plain code validates the reply, removes skills not found in the resume, skips the AI call for garbled text, and shows a warning for phrases that look like injection.
- **Frontend:** React escapes displayed text, so HTML or scripts can't run.
- ➖ The skill check can't catch a skill named inside an injection, because that word is in the resume, and the phrase check misses reworded attacks. So the panel tells the recruiter to check the original.

**Testing.** The tests fake the model, because no test can promise how a real model behaves, and prove the app stays safe when the model is fooled or returns bad output. I also ran the seed resumes, including two injection attempts, through the real model with `npm run summary:try`. The injected claims didn't appear in any run, which is evidence rather than proof.

## Deliberately left out

- **Authentication:** anyone who can reach the API could trigger paid AI requests. That's fine locally, but would need fixing before going public.
- **PDF upload:** `.txt` only, because parsing PDFs needs a new library.
- **Candidate editing, pagination, frontend tests and UI polish:** to spend the time on the core pipeline and AI safety.
- **Deploying:** I wrote a deployment design instead, so reviewers rely on screenshots rather than a live link.
- **A retry button:** reopening a candidate tries again.

## What I'd build next

1. Authentication and rate limiting.
2. PDF upload, the more common resume format.
3. Matching candidates against a job description.
4. A larger set of malicious resumes, run regularly against the real model.
