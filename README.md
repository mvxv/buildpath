# BuildPath — Portfolio Project Planner

This repository contains the frontend, backend, and database implementation for the
BuildPath project.

BuildPath is a student-focused web platform that helps learners choose a portfolio
project worth building, follow a structured roadmap, and track their progress to
completion. It provides a curated project library, a matching quiz that ranks
projects against a student's experience and goals, per-step progress tracking tied
to a user account, and a deployment guidance page.

## Repository Structure

```
Bulidpath/
├── client/          React frontend (Vite)
├── server/          Express REST API and test suite
├── db/              SQL schema, migration, and migration runner
├── seed/            Curated project catalogue and seeding script
├── package.json     Root scripts (install, migrate, seed, dev, test, build)
├── .gitignore
└── README.md
```

## Frontend Index Table

### Pages

| Module Name | Frontend Script |
| --- | --- |
| Landing / Home Page | `client/src/pages/Home.jsx` |
| Project Library and Filters | `client/src/pages/Library.jsx` |
| Project Detail and Roadmap | `client/src/pages/ProjectDetail.jsx` |
| Matching Quiz and Results | `client/src/pages/Quiz.jsx` |
| Saved Projects Dashboard | `client/src/pages/MyProjects.jsx` |
| Progress Checklist Page | `client/src/pages/SavedProject.jsx` |
| Deployment Guidance Page | `client/src/pages/Deploy.jsx` |
| User Login Page | `client/src/pages/Login.jsx` |
| User Registration Page | `client/src/pages/Signup.jsx` |
| Not Found Page | `client/src/pages/NotFound.jsx` |

### Components and Shared Logic

| Module Name | Frontend Script |
| --- | --- |
| Application Router | `client/src/App.jsx` |
| Application Entry Point | `client/src/main.jsx` |
| Layout, Navigation and Footer | `client/src/components/Layout.jsx` |
| Project Card | `client/src/components/ProjectCard.jsx` |
| Login and Signup Form | `client/src/components/AuthForm.jsx` |
| Protected Route Guard | `client/src/components/ProtectedRoute.jsx` |
| Loading, Error and Empty States | `client/src/components/States.jsx` |
| Shared UI Elements (tags, meter, chips) | `client/src/components/ui.jsx` |
| Authentication Session Context | `client/src/context/AuthContext.jsx` |
| API Client | `client/src/lib/api.js` |
| Supabase Browser Client | `client/src/lib/supabase.js` |
| Debounce Hook | `client/src/lib/useDebounced.js` |
| Shared Styling and Design Tokens | `client/src/index.css` |
| HTML Template | `client/index.html` |
| Build Configuration | `client/vite.config.js` |
| Frontend Environment Example | `client/.env.example` |

## Backend API Index

| Backend Module | Backend Script |
| --- | --- |
| Express Server Setup, CORS, Error Handling | `server/src/index.js` |
| Environment Loading and Validation | `server/src/config.js` |
| PostgreSQL Connection Pool | `server/src/db/index.js` |
| Supabase Service-Role Client | `server/src/supabaseClient.js` |
| Authentication Middleware and Token Cache | `server/src/middleware/auth.js` |
| Quiz Scoring Logic | `server/src/lib/quiz.js` |
| Request Helpers (UUID check, async wrapper) | `server/src/lib/http.js` |
| Project Library Routes | `server/src/routes/projects.js` |
| Matching Quiz Routes | `server/src/routes/quiz.js` |
| User Profile Routes | `server/src/routes/profile.js` |
| Saved Project Routes | `server/src/routes/userProjects.js` |
| Progress Tracking Routes | `server/src/routes/userProgress.js` |
| Backend Package Configuration | `server/package.json` |
| Backend Environment Example | `server/.env.example` |

## Database and Seed Index

| Module | Script |
| --- | --- |
| Baseline Schema, Indexes and RLS Policies | `db/001_init.sql` |
| Auth Identity Migration | `db/002_auth_migration.sql` |
| Migration Runner | `db/migrate.js` |
| Curated Project Catalogue (15 projects) | `seed/projects.js` |
| Seeding Script | `seed/seed.js` |

## Test Suite Index

| Test Module | Test Script |
| --- | --- |
| Test Harness (in-process Postgres, stubbed auth) | `server/test/helpers/harness.js` |
| Health, Library, Detail and Quiz Route Tests | `server/test/api.test.js` |
| Authentication, Profile and Progress Tests | `server/test/auth.test.js` |
| Token Verification Cache Tests | `server/test/token-cache.test.js` |
| Quiz Scoring Unit Tests | `server/test/quiz.test.js` |
| CORS and 404 Handling Tests | `server/test/cors.test.js` |

## Database Schema

The database is PostgreSQL, hosted on Supabase. Six tables are used.

| Table | Purpose |
| --- | --- |
| `projects` | Curated project entries: title, description, difficulty, estimated hours, category, tech stack, career goal tags, prerequisites |
| `roadmap_steps` | Ordered steps belonging to a project |
| `resources` | Documentation and reference links belonging to a project |
| `profiles` | Extra student fields (name, experience level, career goal), keyed one-to-one on `auth.users` |
| `user_projects` | Projects a student has saved, keyed on `auth.users` |
| `user_progress` | Completion state for each roadmap step within a saved project |

Row Level Security is enabled on all six tables. Content tables are publicly
readable; the three user tables restrict rows to the owning student.

## How to Run

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Set up environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Fill both files with the values from your Supabase project. `DATABASE_URL` comes
from **Connect → Session pooler**, and the API keys from **Settings → API Keys**.
The session pooler must be used rather than the direct connection, because direct
connections are IPv6-only on most Supabase regions.

### 3. Create the schema and load the data

```bash
npm run migrate
npm run seed
```

`npm run migrate` applies every file in `db/` in order and prints what changed.
Both SQL files are idempotent, so the command is also how an existing database is
brought up to date. `npm run seed` inserts the 15 curated projects along with
their roadmap steps and resources, skipping any title already present.

### 4. Run the servers

```bash
npm run dev:server
```

```bash
npm run dev:client
```

The backend runs on `http://localhost:5000` and the frontend on
`http://localhost:5173`. Visiting `http://localhost:5000/health/db` should return
`{"status":"ok","database":"connected"}` if the database connection works.

### 5. Run the tests

```bash
npm test
```

## Backend API Endpoints

### Health Check

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | Check if the backend server is running |
| GET | `/health/db` | Check the database connection |

### Project Library APIs

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/projects` | Get all projects; supports `?category=`, `?difficulty=`, `?career_goal=` and `?q=` search |
| GET | `/api/projects/meta` | Get filter options, career goals, time budgets and the tech stack vocabulary |
| GET | `/api/projects/:id` | Get one project with its ordered roadmap steps and resources |

### Matching Quiz APIs

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/quiz/options` | Get the quiz questions and their available answers |
| POST | `/api/quiz/match` | Score quiz answers against the library and return ranked matches with reasons |

### User Profile APIs (authenticated)

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/profile` | Get the signed-in student's profile, creating it on first read |
| PUT | `/api/profile` | Update name, experience level and career goal |

### Saved Project APIs (authenticated)

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/user-projects` | Get saved projects with progress totals; `?project_id=` narrows to one |
| GET | `/api/user-projects/:id` | Get one saved project with its roadmap, resources and per-step completion |
| POST | `/api/user-projects` | Save a project to the student's list |
| DELETE | `/api/user-projects/:id` | Remove a saved project and its progress |

### Progress Tracking APIs (authenticated)

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/user-progress` | Mark a roadmap step complete or incomplete and return updated totals |

Authenticated endpoints require a Supabase access token in the request header:

```
Authorization: Bearer <access_token>
```

## POST Quiz Match Example

Endpoint:

```
POST /api/quiz/match
```

Request body:

```json
{
  "experience_level": "beginner",
  "career_goal": "frontend",
  "hours_available": 12,
  "interests": ["data-viz"],
  "tech": ["React"],
  "limit": 5
}
```

Every field is optional. Answers that are omitted simply contribute nothing to the
score rather than filtering results out. `limit` defaults to 5.

Response:

```json
{
  "matches": [
    {
      "id": "…",
      "title": "Weather Dashboard with Saved Locations",
      "difficulty": "beginner",
      "est_hours": 12,
      "category": "data-viz",
      "score": 93,
      "match_percent": 89,
      "reasons": [
        "Pitched at your beginner level",
        "Builds skills for frontend engineer roles",
        "In a category you picked: Data & visualisation",
        "Uses React, which you already know",
        "Fits your ~12h budget (about 12h)"
      ]
    }
  ],
  "answers": { … }
}
```

## Technologies Used

- HTML
- CSS
- JavaScript
- React 18
- React Router 6
- Vite 5
- Tailwind CSS v4
- Node.js
- Express.js 4
- PostgreSQL 17
- Supabase (database hosting and authentication)
- `@supabase/supabase-js`
- `pg` (node-postgres)
- CORS
- dotenv
- `node:test`
- PGlite (in-process PostgreSQL for testing)

## Project Notes

BuildPath is implemented as three connected parts: a React frontend, an Express
REST API, and a PostgreSQL database hosted on Supabase. All application data —
projects, roadmap steps, resources, student profiles, saved projects and per-step
progress — is read from and written to real database tables rather than prototype
data held in the browser. The project library and matching quiz are publicly
accessible without an account; saving a project and tracking progress require a
signed-in student.

The **project library** provides 15 curated entries across four categories
(`web-app`, `productivity`, `data-viz`, `dev-tools`) and three difficulty levels.
Each entry carries a description, difficulty, estimated hours, tech stack,
prerequisites, five ordered roadmap steps, and two to three reference links.
Filtering by category, difficulty, career goal and free-text search is performed
in SQL on the server rather than in the browser, so the client never downloads the
whole catalogue in order to narrow it. The search field is debounced, so typing a
query issues one request rather than one per keystroke.

The **matching quiz** collects five answers — experience level, career goal, time
available, interests, and familiar technologies — and scores every project in the
library against them. Scoring is weighted rather than filtered: no project is
excluded outright, it simply ranks lower, which matters because most students skip
at least one question and a filter would silently discard good matches. Difficulty
is scored against experience level, estimated hours against the stated time budget
on a tolerance band, and tech stack against technologies the student already knows.
Each result is returned with a match percentage and the specific reasons it scored
well, so the recommendation is explainable rather than opaque. Scoring runs on the
server so the rules stay in one place as the library grows.

Because the `projects` table has no natural link to a career goal, a `career_goals`
JSONB column was added and each project is tagged with the goals it serves. Tagging
was chosen over deriving a goal from `category`, since one category serves several
goals: a web application is frontend practice for one student and backend practice
for another.

**Progress tracking** turns a saved project's roadmap into a checklist. Completion
state is stored per step in `user_progress`, and unchecking a step keeps the row
and clears its timestamp rather than deleting it. Checklist updates are applied
optimistically in the interface and rolled back if the request fails, so working
down a list does not feel laggy.

**Authentication** uses Supabase Auth. An earlier version of the schema included a
standalone `users` table that was never populated on signup, which meant every save
failed a foreign key check. This was resolved by pointing `user_projects.user_id`
at `auth.users` directly and moving the additional profile fields into a `profiles`
table keyed one-to-one against it (`db/002_auth_migration.sql`). Profile rows are
created on first read of `/api/profile` rather than by a trigger on the `auth`
schema, which avoids owning DDL inside Supabase's own tables.

Verifying a Supabase access token is a network round trip, measured at roughly
186 ms from the deployment region — more than every database query on the request
combined. Verified tokens are therefore cached for 60 seconds, and it is the
in-flight promise that is cached rather than the resolved result, so the several
authenticated calls a page fires on load collapse into a single verification
instead of each making its own. The trade-off is that a revoked session remains
usable for up to a minute, which sits well inside the token's own lifetime.

Ownership is enforced inside the queries themselves rather than around them. Every
authenticated route filters on the signed-in student's ID, and progress writes
confirm in a single query both that the saved project belongs to the caller and
that the step belongs to that project. Row Level Security policies are enabled as a
second layer, so a client holding only the public key cannot read another student's
rows by querying the database directly.

The **test suite** contains 69 tests covering every route, the quiz scoring rules,
ownership isolation between students, cascade deletion, CORS behaviour and the
token cache. The tests run the real Express application against PGlite, PostgreSQL
compiled to WebAssembly, with only the database pool and the Supabase token check
substituted. They require no credentials, no network access and no Supabase
project, so a fresh clone can run them immediately. The schema and seed files they
load are the real ones, so a change that breaks an assumption fails the suite
rather than surfacing later in production.

The **deployment guidance page** is static content covering the path from a local
development setup to a deployed application, including hosting the API on Render or
Railway, the frontend on Vercel, which environment variables are safe to expose in
a browser bundle, and the failure modes students most often hit — CORS errors after
deployment, missing environment variables in production, single-page app routing
returning 404 on refresh, and authentication redirects pointing back at localhost.

Adding to the project library is content work rather than code. A new entry is
appended to `seed/projects.js` with its title, description, difficulty, estimated
hours, category, tech stack, career goals, prerequisites, roadmap steps and
resources, and `npm run seed` inserts it. Titles already present are skipped, so
re-running the script only adds what is new.
