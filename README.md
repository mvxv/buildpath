# BuildPath

Most students learning to code get stuck in the same place: they know they need a
portfolio project, they just have no idea which one. So they pick something too
ambitious, stall three days in, and end up with another abandoned repo.

BuildPath fixes the picking part, then makes sure the project actually gets
finished.

- **A curated library.** 15 projects, each with a real time estimate, prerequisites,
  an ordered roadmap, and links worth reading.
- **A matching quiz.** Five questions — experience, career goal, time available,
  interests, familiar tech — scored against the whole library. You get a ranked
  shortlist and, for each one, the reason it scored well.
- **Progress tracking.** Save a project and its roadmap becomes a checklist. Tick
  steps off and the path fills in behind you.
- **A deployment guide**, because a project that only runs on your laptop is hard
  to show anyone.

## Built with

React (Vite) and Tailwind on the front, Express and PostgreSQL behind it, with
Supabase handling auth and hosting the database.

## Running it

You'll need Node 20+ and a Supabase project.

```bash
npm run install:all
```

Copy `server/.env.example` → `server/.env` and `client/.env.example` →
`client/.env`, then fill in your Supabase values. Use the **session pooler**
connection string, not the direct one — direct connections are IPv6-only on most
Supabase regions.

```bash
npm run migrate   # create the schema
npm run seed      # load the 15 projects
```

Then start both halves in separate terminals:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

The app runs at `localhost:5173`, the API at `localhost:5000`.

## Tests

```bash
npm test
```

69 tests covering every route, the quiz scoring rules, ownership isolation, and
the token cache. They run the real Express app against
[PGlite](https://pglite.dev), Postgres compiled to WebAssembly, with only the
database pool and Supabase token check swapped out — so they need no credentials,
no network, and no Supabase project. A fresh clone can run them immediately.

The schema and seed data they load are the real files, so a change that breaks an
assumption fails the suite rather than surfacing in production.

## A few decisions worth explaining

**Identity lives in `auth.users`.** An earlier version of the schema had its own
`users` table that nothing ever wrote to, so every save failed a foreign key
check. `user_projects` now references `auth.users` directly, and the extra profile
fields live in a `profiles` table keyed one-to-one against it.

**Token verification is cached for 60 seconds.** Checking a Supabase token is a
network round trip — about 186ms from this region, more than every database query
on the request put together. What's cached is the in-flight promise rather than
the result, so the handful of calls a page fires on load collapse into a single
verification instead of racing to make their own. The cost is that a revoked
session stays usable for up to a minute, comfortably inside the token's own
lifetime.

**The quiz weights answers, it doesn't filter on them.** Most people skip at least
one question, and filtering would quietly throw away good matches. Everything
scores instead: difficulty against experience, `est_hours` against the stated time
budget on a tolerance band, tech overlap against what you already know. Nothing is
excluded outright, it just ranks lower.

**Career goals are tagged, not derived.** There's no clean mapping from category to
career goal — a web app is frontend practice for one person and backend practice
for another — so each project carries its own list of goals it serves.

**Ownership is checked in the query, not around it.** Every authenticated route
filters on the user's id, and progress writes confirm in a single query that the
saved project belongs to the caller *and* that the step belongs to that project.
Row-level security is enabled as a second layer for anything reaching the database
another way.

## Layout

```
db/       schema and the migration runner
server/   Express API, plus the test suite
seed/     the project catalogue and its loader
client/   React frontend
```

## Adding projects

Adding to the library is content work, not code. Append an entry to
`seed/projects.js` — title, description, difficulty, hours, category, stack,
career goals, prerequisites, five roadmap steps, a couple of resources — and run
`npm run seed`. Titles already present are skipped, so only the new ones land.
