# Candidate Tracker: project rules

- TypeScript with `strict` everywhere. No `any`, no `@ts-ignore`; fix types properly.
- Backend: Express 5 + Mongoose (MongoDB), run with tsx. Frontend: React + Vite. Tests: Vitest.
- Do not add new libraries without asking.
- Structure is by feature: backend/src/candidates/ (model, repository, service, controller, routes)
  and backend/src/summary/ (AI). Shared code only in config/, middleware/, utils/. Do not restructure.
- Pass dependencies in via interfaces (e.g. createApp({ ... })); controllers/services must not import Mongoose or the Anthropic SDK.
- Only backend/src/summary/anthropicSummaryProvider.ts may import the Anthropic SDK.
- Business logic goes in plain functions testable without the database.
