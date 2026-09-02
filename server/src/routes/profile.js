const express = require('express');

const db = require('../db');
const { asyncRoute } = require('../lib/http');
const { requireAuth } = require('../middleware/auth');
const { EXPERIENCE_LEVELS, CAREER_GOALS } = require('../lib/quiz');

const router = express.Router();
const GOAL_VALUES = CAREER_GOALS.map((goal) => goal.value);

router.use(requireAuth);

/**
 * Profiles hold the extras Supabase Auth does not: experience level and career
 * goal, which the quiz uses to pre-fill answers on a return visit.
 *
 * Rows are created here on demand rather than by a trigger on auth.users, which
 * would mean owning DDL in Supabase's schema. Nothing else needs a profile —
 * user_projects keys off auth.users directly — so these two routes are the only
 * places that have to care.
 */
const upsertProfile = (user, fields = {}) =>
  db.query(
    `INSERT INTO profiles (id, email, name, experience_level, career_goal)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       name             = COALESCE(EXCLUDED.name, profiles.name),
       experience_level = COALESCE(EXCLUDED.experience_level, profiles.experience_level),
       career_goal      = COALESCE(EXCLUDED.career_goal, profiles.career_goal),
       updated_at       = now()
     RETURNING *`,
    [
      user.id,
      user.email,
      fields.name ?? user.user_metadata?.name ?? null,
      fields.experienceLevel ?? null,
      fields.careerGoal ?? null,
    ]
  );

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const existing = await db.query('SELECT * FROM profiles WHERE id = $1', [req.user.id]);
    if (existing.rowCount > 0) {
      return res.json(existing.rows[0]);
    }

    const created = await upsertProfile(req.user);
    return res.json(created.rows[0]);
  })
);

router.put(
  '/',
  asyncRoute(async (req, res) => {
    const { name, experience_level: experienceLevel, career_goal: careerGoal } = req.body || {};

    if (experienceLevel && !EXPERIENCE_LEVELS.includes(experienceLevel)) {
      return res
        .status(400)
        .json({ error: `experience_level must be one of: ${EXPERIENCE_LEVELS.join(', ')}` });
    }
    if (careerGoal && !GOAL_VALUES.includes(careerGoal)) {
      return res.status(400).json({ error: `career_goal must be one of: ${GOAL_VALUES.join(', ')}` });
    }

    const { rows } = await upsertProfile(req.user, { name, experienceLevel, careerGoal });
    return res.json(rows[0]);
  })
);

module.exports = router;
