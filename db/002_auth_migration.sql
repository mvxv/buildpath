-- BuildPath — migrate from the original schema to the auth.users-backed one.
--
-- Resolves the open question in handoff section 4 / 8.1.
--
-- Original shape:  user_projects.user_id -> public.users(id)   (a standalone table
--                  with its own gen_random_uuid() default, never populated on signup,
--                  so no authenticated request could ever satisfy the foreign key).
-- New shape:       user_projects.user_id -> auth.users(id)     (the ids Supabase Auth
--                  actually issues), with extra profile fields moved to `profiles`.
--
-- Run db/001_init.sql FIRST (it creates `profiles`), then this file.
-- Every step is guarded, so this is a no-op on a database that is already migrated
-- or was created fresh from 001_init.sql.

BEGIN;

-- 1. Carry over any profile data that happens to line up with a real auth user.
--    (In practice the `users` table was never written to, so this moves 0 rows.)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    INSERT INTO public.profiles (id, email, name, experience_level, career_goal, created_at)
    SELECT u.id, u.email, u.name, u.experience_level, u.career_goal, u.created_at
    FROM public.users u
    JOIN auth.users au ON au.id = u.id
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 2. Drop every foreign key on user_projects.user_id, whatever it is currently named.
DO $$
DECLARE
  con RECORD;
BEGIN
  FOR con IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = tc.constraint_name
     AND kcu.table_schema    = tc.table_schema
    WHERE tc.table_schema    = 'public'
      AND tc.table_name      = 'user_projects'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name    = 'user_id'
  LOOP
    EXECUTE format('ALTER TABLE public.user_projects DROP CONSTRAINT %I', con.constraint_name);
  END LOOP;
END $$;

-- 3. Remove rows that point at ids Supabase Auth does not know about, so the new
--    foreign key can be created. These are unreachable records either way: no
--    authenticated request could ever match them.
DELETE FROM public.user_projects up
WHERE NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = up.user_id);

-- 4. Point user_id at auth.users and require it.
ALTER TABLE public.user_projects ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.user_projects
  ADD CONSTRAINT user_projects_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. The standalone users table is now redundant; `profiles` replaces it.
DROP TABLE IF EXISTS public.users;

COMMIT;
