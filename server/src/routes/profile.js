const express = require('express');
const db = require('../db');
const { asyncRoute } = require('../lib/http');
const { requireAuth } = require('../middleware/auth');
const { EXPERIENCE_LEVELS, CAREER_GOALS } = require('../lib/quiz');

const router = express.Router();

router.use(requireAuth);

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const { rows } = await db.query('SELECT * FROM profiles WHERE id = $1', [req.user.id]);
    res.json(rows[0] || null);
  })
);

/** Saves the profile fields the quiz collects, so answers can be pre-filled. */
router.put(
  '/',
  asyncRoute(async (req, res) => {
    const { name, experience_level: experienceLevel, career_goal: careerGoal } = req.body || {};

    if (experienceLevel && !EXPERIENCE_LEVELS.includes(experienceLevel)) {
      return res.status(400).json({ error: `experience_level must be one of: ${EXPERIENCE_LEVELS.join(', ')}` });
    }
    const goals = CAREER_GOALS.map((g) => g.value);
    if (careerGoal && !goals.includes(careerGoal)) {
      return res.status(400).json({ error: `career_goal must be one of: ${goals.join(', ')}` });
    }

    const { rows } = await db.query(
      `INSERT INTO profiles (id, email, name, experience_level, career_goal)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         name             = COALESCE(EXCLUDED.name, profiles.name),
         experience_level = COALESCE(EXCLUDED.experience_level, profiles.experience_level),
         career_goal      = COALESCE(EXCLUDED.career_goal, profiles.career_goal),
         updated_at       = now()
       RETURNING *`,
      [req.user.id, req.user.email, name || null, experienceLevel || null, careerGoal || null]
    );

    return res.json(rows[0]);
  })
);

module.exports = router;
