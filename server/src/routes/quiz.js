const express = require('express');
const db = require('../db');
const { asyncRoute } = require('../lib/http');
const { matchProjects, CAREER_GOALS, CATEGORIES, TIME_BUDGETS, EXPERIENCE_LEVELS } = require('../lib/quiz');

const router = express.Router();

/** The questions the client renders, so the options live in one place. */
router.get('/options', (_req, res) => {
  res.json({
    experience_levels: EXPERIENCE_LEVELS,
    career_goals: CAREER_GOALS,
    categories: CATEGORIES,
    time_budgets: TIME_BUDGETS,
  });
});

/**
 * Score the whole library against the student's answers and return the best few.
 *
 * Scoring lives on the server rather than in the browser so the rules stay in one
 * place as the library grows, and so the client never has to download every
 * project just to rank them.
 */
router.post(
  '/match',
  asyncRoute(async (req, res) => {
    const answers = req.body || {};
    const limit = Math.min(Math.max(Number(answers.limit) || 5, 1), 20);

    const { rows } = await db.query(`
      SELECT p.*,
             (SELECT COUNT(*) FROM roadmap_steps rs WHERE rs.project_id = p.id) AS step_count
        FROM projects p
    `);

    if (rows.length === 0) {
      return res.json({ matches: [], answers, message: 'No projects in the library yet.' });
    }

    const matches = matchProjects(rows, answers, limit).map((row) => ({
      ...row,
      step_count: Number(row.step_count),
    }));

    return res.json({ matches, answers });
  })
);

module.exports = router;
