-- BuildPath — baseline schema (end state)
--
-- Safe to run on a fresh Supabase project. Every statement is idempotent, so it
-- is also safe to re-run. If your database already has the ORIGINAL schema (with
-- the standalone `users` table), run db/002_auth_migration.sql AFTER this file to
-- move `user_projects` over to auth.users.
--
-- Identity model:
--   * There is no standalone application `users` table.
--   * `user_projects.user_id` references auth.users(id) directly.
--   * Extra profile fields live in `profiles`, keyed 1:1 on auth.users(id).
--   * `profiles` rows are created lazily by the API on the first authenticated
--     request (see server/src/middleware/auth.js), so no trigger on the `auth`
--     schema is required. A trigger alternative is sketched at the bottom.

-- ---------------------------------------------------------------------------
-- Content tables (public read)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(150) NOT NULL,
  description   TEXT NOT NULL,
  difficulty    VARCHAR(20) CHECK (difficulty IN ('beginner','intermediate','advanced')),
  est_hours     INT,
  category      VARCHAR(50),
  tech_stack    JSONB,
  -- Career-goal tags the quiz scores against, e.g. ["frontend","fullstack"].
  -- Kept on the project rather than derived from `category`, because one category
  -- serves several goals: a web app is frontend practice for one student and
  -- backend practice for another.
  career_goals  JSONB DEFAULT '[]'::jsonb,
  prerequisites TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Additive column for databases created from the original schema.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS career_goals JSONB DEFAULT '[]'::jsonb;

-- Seeding is idempotent by title, and the quiz never wants two identical entries.
CREATE UNIQUE INDEX IF NOT EXISTS projects_title_key ON projects (title);
CREATE INDEX IF NOT EXISTS projects_category_idx   ON projects (category);
CREATE INDEX IF NOT EXISTS projects_difficulty_idx ON projects (difficulty);

CREATE TABLE IF NOT EXISTS roadmap_steps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  step_order  INT NOT NULL,
  title       VARCHAR(150) NOT NULL,
  description TEXT
);

CREATE INDEX IF NOT EXISTS roadmap_steps_project_idx ON roadmap_steps (project_id, step_order);

CREATE TABLE IF NOT EXISTS resources (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type       VARCHAR(20) CHECK (type IN ('doc','video','article','repo')),
  url        TEXT NOT NULL,
  label      VARCHAR(150)
);

CREATE INDEX IF NOT EXISTS resources_project_idx ON resources (project_id);

-- ---------------------------------------------------------------------------
-- User tables (keyed on Supabase Auth)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            VARCHAR(255),
  name             VARCHAR(100),
  experience_level VARCHAR(20) CHECK (experience_level IN ('beginner','intermediate','advanced')),
  career_goal      VARCHAR(50),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_projects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, project_id)
);

CREATE INDEX IF NOT EXISTS user_projects_user_idx ON user_projects (user_id);

CREATE TABLE IF NOT EXISTS user_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_project_id UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
  roadmap_step_id UUID NOT NULL REFERENCES roadmap_steps(id) ON DELETE CASCADE,
  completed_at    TIMESTAMPTZ,
  UNIQUE (user_project_id, roadmap_step_id)
);

CREATE INDEX IF NOT EXISTS user_progress_user_project_idx ON user_progress (user_project_id);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
--
-- The Express API connects over DATABASE_URL as the table owner, so RLS does not
-- restrict it — the API does its own per-user filtering on req.user.id. These
-- policies exist so that anyone holding only the public anon key (which ships in
-- the browser bundle) cannot read or write another user's rows if they query
-- PostgREST directly.

ALTER TABLE projects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources     ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS projects_public_read      ON projects;
DROP POLICY IF EXISTS roadmap_steps_public_read ON roadmap_steps;
DROP POLICY IF EXISTS resources_public_read     ON resources;

CREATE POLICY projects_public_read      ON projects      FOR SELECT USING (true);
CREATE POLICY roadmap_steps_public_read ON roadmap_steps FOR SELECT USING (true);
CREATE POLICY resources_public_read     ON resources     FOR SELECT USING (true);

DROP POLICY IF EXISTS profiles_own_row      ON profiles;
DROP POLICY IF EXISTS user_projects_own_row ON user_projects;
DROP POLICY IF EXISTS user_progress_own_row ON user_progress;

CREATE POLICY profiles_own_row ON profiles
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY user_projects_own_row ON user_projects
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY user_progress_own_row ON user_progress
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.id = user_progress.user_project_id AND up.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.id = user_progress.user_project_id AND up.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Optional: create profiles via trigger instead of lazily in the API
-- ---------------------------------------------------------------------------
--
-- The API already inserts a profile row on the first authenticated request, so
-- this is not needed. Uncomment it if you would rather have profiles exist the
-- moment a user signs up (e.g. for SQL reporting before a user's first API call).
--
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
-- BEGIN
--   INSERT INTO public.profiles (id, email, name)
--   VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name')
--   ON CONFLICT (id) DO NOTHING;
--   RETURN NEW;
-- END;
-- $$;
--
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
