# BuildPath

A web platform that helps students pick a portfolio project worth building, gives
them a structured roadmap, and tracks their progress through it.

- **Curated project library** — 14 projects with descriptions, difficulty, time
  estimates, tech stacks, prerequisites, ordered roadmap steps, and vetted resources.
- **Matching quiz** — five questions (experience, career goal, time available,
  interests, familiar tech) scored against the whole library, returning ranked
  matches with the reason each one scored well.
- **Progress tracking** — save a project, work through its roadmap as a checklist,
  watch the progress bar move.
- **Deployment guidance** — a static page covering the path from localhost to a
  live link, and the mistakes that usually cost an afternoon.

## Stack

| Layer    | Choice                              |
| -------- | ----------------------------------- |
| Frontend | React (Vite) + Tailwind CSS v4      |
| Testing  | node:test + PGlite (no credentials needed) |
| Backend  | Node.js + Express                   |
| Database | PostgreSQL on Supabase              |
| Auth     | Supabase Auth                       |
| Hosting  | Vercel (client) + Render or Railway (server) |

## Layout

```
buildpath/
├── db/                   SQL you run against Supabase
│   ├── 001_init.sql          baseline schema (idempotent)
│   └── 002_auth_migration.sql moves user_projects onto auth.users
├── server/               Express API
│   ├── test/                 test suite — runs against in-process Postgres
│   └── src/
│       ├── index.js          app, CORS, error handling
│       ├── config.js         env loading and validation
│       ├── db/index.js       pg pool
│       ├── supabaseClient.js service-role client (token verification only)
│       ├── middleware/auth.js requireAuth + lazy profile creation
│       ├── lib/quiz.js       matching quiz scoring
│       └── routes/           projects, quiz, profile, user-projects, user-progress
├── seed/                 project catalog and seeding script
│   ├── projects.js           the 14 curated projects
│   └── seed.js               inserts them (idempotent)
└── client/               React frontend
    └── src/
        ├── pages/            Home, Library, ProjectDetail, Quiz, MyProjects,
        │                     SavedProject, Deploy, Login, Signup, NotFound
        ├── components/       Layout, ProjectCard, AuthForm, ProtectedRoute, ui
        ├── context/          AuthContext (Supabase session)
        └── lib/              supabase client, API wrapper
```

## Running it locally

### 1. Install

```bash
npm run install:all
```

### 2. Configure the server

Copy `server/.env.example` to `server/.env` and fill in the values from your
Supabase project (Project Settings → Database for the connection string, Project
Settings → API for the keys):

```
DATABASE_URL=postgresql://postgres:PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
PORT=5000
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
CORS_ORIGINS=http://localhost:5173
```

URL-encode any special characters in the database password.

### 3. Configure the client

Copy `client/.env.example` to `client/.env`:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_API_URL=http://localhost:5000
```

The anon key is designed to be public and is safe in the browser bundle. The
service role key never belongs here.

### 4. Set up the database

In the Supabase SQL editor, run in order:

1. `db/001_init.sql` — creates every table, index, and row-level-security policy.
2. `db/002_auth_migration.sql` — only needed if your database still has the older
   standalone `users` table. It is a no-op on a fresh database.

Both files are safe to re-run.

### 5. Seed the library

```bash
npm run seed
```

It reads `DATABASE_URL` from `server/.env` and skips projects already present.
Use `npm run seed:reset` to wipe the library and reinsert.

### 6. Start both halves

```bash
npm run dev:server
```

```bash
npm run dev:client
```

The API listens on `http://localhost:5000` and the app on
`http://localhost:5173`.

## API

Public:

| Method | Path                 | Purpose                                        |
| ------ | -------------------- | ---------------------------------------------- |
| GET    | `/health`            | Liveness check                                 |
| GET    | `/health/db`         | Confirms the database connection               |
| GET    | `/api/projects`      | List projects; filters `category`, `difficulty`, `career_goal`, `q` |
| GET    | `/api/projects/meta` | Filter options and the tech-stack vocabulary   |
| GET    | `/api/projects/:id`  | One project with roadmap steps and resources   |
| GET    | `/api/quiz/options`  | The quiz questions and their options           |
| POST   | `/api/quiz/match`    | Score answers against the library, ranked      |

Authenticated (send `Authorization: Bearer <supabase access token>`):

| Method | Path                     | Purpose                                   |
| ------ | ------------------------ | ----------------------------------------- |
| GET    | `/api/profile`           | The signed-in user's profile              |
| PUT    | `/api/profile`           | Update experience level and career goal   |
| GET    | `/api/user-projects`     | Saved projects with progress totals       |
| POST   | `/api/user-projects`     | Save a project                            |
| GET    | `/api/user-projects/:id` | One saved project, its roadmap, and which steps are done |
| DELETE | `/api/user-projects/:id` | Remove a saved project                    |
| POST   | `/api/user-progress`     | Mark a roadmap step complete or incomplete |

## The interface

The visual system is built around one idea, because the product is: **a path you
walk to the end**.

- **The spine.** Roadmap steps hang off a vertical line. On a saved project the
  nodes and the connector between them light up as steps are completed, so
  progress is something you can see at a glance rather than a number you read.
  It is the same shape in the wordmark, in the hero preview, and in the empty
  state.
- **Acid green means done.** The accent is used only for completion, the active
  route, and the primary action, so it never reads as decoration.
- **Three typefaces with three jobs.** Space Grotesk for headings, Inter for
  reading, JetBrains Mono for anything the machine knows — hours, counts,
  difficulty, step numbers. The mono metadata is what makes it read as a tool
  rather than a brochure.
- **Segments, not a bar.** Progress is one segment per step. At five steps a
  percentage bar barely moves; discrete segments make each tick feel earned.
- **Dark by design.** Students screenshot portfolio projects. A near-black canvas
  with a faint dot grid photographs better than another white SaaS template.

## Testing

```bash
npm test
```

61 tests covering every route, the quiz scoring rules, ownership isolation,
cascade deletes, and CORS. They run the real Express app against
[PGlite](https://pglite.dev) — Postgres compiled to WebAssembly — with the
database pool and Supabase token verification swapped out. **No credentials, no
network, and no Supabase project required**, so they work on a fresh clone and in
CI.

`db/001_init.sql` and `seed/projects.js` are the real ones, so a schema or seed
change that breaks an assumption fails the suite.

## Design decisions

**Auth identity.** `user_projects.user_id` references `auth.users(id)` directly.
There is no standalone application `users` table — extra profile fields live in
`profiles`, keyed one-to-one on `auth.users(id)`. Profile rows are created lazily
by `requireAuth` on a user's first authenticated request, so no trigger on
Supabase's `auth` schema is needed. `db/002_auth_migration.sql` performs this
change on a database created from the original schema.

**Quiz scoring lives on the server.** `server/src/lib/quiz.js` scores difficulty
against experience, career goal against a project's `career_goals` tags, category
against stated interests, tech-stack overlap against familiar tools, and
`est_hours` against the stated time budget using a tolerance band rather than an
exact match. Keeping it server-side means the rules stay in one place as the
library grows and the browser never downloads every project just to rank them.

**`career_goals` on the project.** The original schema had no way to connect a
project to a career goal. Tagging each project with an array of goals beats
deriving one from `category`, since a single category serves several goals.

**CORS is configuration, not a deploy-day fix.** Allowed origins come from
`CORS_ORIGINS`, with the Vite dev server always permitted. An unlisted origin
simply receives no `Access-Control-Allow-Origin` header rather than an error, so
stray traffic does not turn into 500s in the logs.

**Ownership is enforced per query.** Every authenticated route filters on
`req.user.id`, and progress writes verify in a single query that the saved project
belongs to the caller *and* that the step belongs to that project. RLS policies
are also enabled as a second layer for anything talking to PostgREST directly.

## Growing the library

Adding projects is content work, not code. Append entries to
`seed/projects.js` — each needs a title, description, difficulty, `est_hours`,
`category` (`web-app`, `productivity`, `data-viz`, `dev-tools`), `tech_stack`,
`career_goals` (`frontend`, `backend`, `fullstack`, `data`, `devops`),
prerequisites, roadmap steps, and resources — then run `npm run seed`. Existing
titles are skipped, so only the new ones are inserted.

## Deploying

The app's own `/deploy` page covers this in detail. In short:

**Backend (Render or Railway):** root directory `server`, build `npm install`,
start `npm start`. Set `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
and `CORS_ORIGINS` (your deployed frontend origin, no trailing slash). The app
already listens on `process.env.PORT`.

**Frontend (Vercel):** root directory `client`, build `npm run build`, output
`dist`. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL`
pointing at the deployed API. Redeploy after changing any variable — Vite inlines
them at build time.

**Supabase:** add the deployed frontend URL to the auth redirect allow-list and
set it as the site URL, or confirmation emails will point at localhost.
