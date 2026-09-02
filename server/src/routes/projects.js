const express = require('express');
const db = require('../db');
const { isUuid, asyncRoute } = require('../lib/http');
const { CAREER_GOALS, CATEGORIES, TIME_BUDGETS, EXPERIENCE_LEVELS } = require('../lib/quiz');

const router = express.Router();

/** Options the library filters and the quiz form are built from. */
router.get(
  '/meta',
  asyncRoute(async (_req, res) => {
    const { rows } = await db.query(`
      SELECT
        (SELECT COALESCE(json_agg(DISTINCT category), '[]'::json)
           FROM projects WHERE category IS NOT NULL)                       AS categories,
        (SELECT COALESCE(json_agg(DISTINCT tech ORDER BY tech), '[]'::json)
           FROM projects, jsonb_array_elements_text(COALESCE(tech_stack, '[]'::jsonb)) AS tech)
                                                                            AS tech_stack,
        (SELECT COUNT(*) FROM projects)                                     AS total
    `);

    const row = rows[0] || {};
    res.json({
      categories: CATEGORIES.filter((c) => (row.categories || []).includes(c.value)),
      difficulties: EXPERIENCE_LEVELS,
      career_goals: CAREER_GOALS,
      time_budgets: TIME_BUDGETS,
      tech_stack: row.tech_stack || [],
      total: Number(row.total || 0),
    });
  })
);

/** Browse the library. All filters are optional and combine with AND. */
router.get(
  '/',
  asyncRoute(async (req, res) => {
    const { category, difficulty, career_goal: careerGoal, q } = req.query;

    const conditions = [];
    const params = [];

    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    if (difficulty) {
      params.push(difficulty);
      conditions.push(`difficulty = $${params.length}`);
    }
    if (careerGoal) {
      params.push(JSON.stringify([careerGoal]));
      conditions.push(`COALESCE(career_goals, '[]'::jsonb) @> $${params.length}::jsonb`);
    }
    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM roadmap_steps rs WHERE rs.project_id = p.id) AS step_count
         FROM projects p
         ${where}
         ORDER BY
           CASE p.difficulty
             WHEN 'beginner' THEN 1
             WHEN 'intermediate' THEN 2
             WHEN 'advanced' THEN 3
             ELSE 4
           END,
           p.est_hours NULLS LAST,
           p.title`,
      params
    );

    res.json(rows.map((row) => ({ ...row, step_count: Number(row.step_count) })));
  })
);

/** A single project with its roadmap and resources. */
router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: 'Invalid project id' });
    }

    const projectResult = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projectResult.rowCount === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const [steps, resources] = await Promise.all([
      db.query(
        `SELECT id, step_order, title, description
           FROM roadmap_steps WHERE project_id = $1 ORDER BY step_order`,
        [id]
      ),
      db.query(
        `SELECT id, type, url, label FROM resources WHERE project_id = $1 ORDER BY type, label`,
        [id]
      ),
    ]);

    return res.json({
      ...projectResult.rows[0],
      roadmap_steps: steps.rows,
      resources: resources.rows,
    });
  })
);

module.exports = router;
