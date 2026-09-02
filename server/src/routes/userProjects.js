const express = require('express');
const db = require('../db');
const { isUuid, asyncRoute } = require('../lib/http');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

/** Saved projects with enough progress detail to render the "My Projects" cards. */
router.get(
  '/',
  asyncRoute(async (req, res) => {
    const { rows } = await db.query(
      `SELECT up.id,
              up.created_at,
              p.id            AS project_id,
              p.title,
              p.description,
              p.difficulty,
              p.est_hours,
              p.category,
              p.tech_stack,
              (SELECT COUNT(*) FROM roadmap_steps rs WHERE rs.project_id = p.id) AS total_steps,
              (SELECT COUNT(*) FROM user_progress pr
                 WHERE pr.user_project_id = up.id AND pr.completed_at IS NOT NULL) AS completed_steps
         FROM user_projects up
         JOIN projects p ON p.id = up.project_id
        WHERE up.user_id = $1
        ORDER BY up.created_at DESC`,
      [req.user.id]
    );

    res.json(
      rows.map((row) => ({
        ...row,
        total_steps: Number(row.total_steps),
        completed_steps: Number(row.completed_steps),
      }))
    );
  })
);

/** One saved project with its roadmap, resources, and per-step completion state. */
router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: 'Invalid saved project id' });
    }

    const saved = await db.query(
      `SELECT up.id, up.created_at, up.project_id
         FROM user_projects up
        WHERE up.id = $1 AND up.user_id = $2`,
      [id, req.user.id]
    );
    if (saved.rowCount === 0) {
      return res.status(404).json({ error: 'Saved project not found' });
    }

    const { project_id: projectId } = saved.rows[0];

    const [project, steps, resources] = await Promise.all([
      db.query('SELECT * FROM projects WHERE id = $1', [projectId]),
      db.query(
        `SELECT rs.id, rs.step_order, rs.title, rs.description,
                pr.completed_at
           FROM roadmap_steps rs
           LEFT JOIN user_progress pr
             ON pr.roadmap_step_id = rs.id AND pr.user_project_id = $1
          WHERE rs.project_id = $2
          ORDER BY rs.step_order`,
        [id, projectId]
      ),
      db.query(
        `SELECT id, type, url, label FROM resources WHERE project_id = $1 ORDER BY type, label`,
        [projectId]
      ),
    ]);

    const roadmapSteps = steps.rows.map((step) => ({
      ...step,
      completed: step.completed_at !== null,
    }));

    return res.json({
      id: saved.rows[0].id,
      created_at: saved.rows[0].created_at,
      project: project.rows[0],
      roadmap_steps: roadmapSteps,
      resources: resources.rows,
      total_steps: roadmapSteps.length,
      completed_steps: roadmapSteps.filter((step) => step.completed).length,
    });
  })
);

/** Save a project to the current user's list. Saving twice is not an error. */
router.post(
  '/',
  asyncRoute(async (req, res) => {
    const projectId = req.body?.project_id;
    if (!isUuid(projectId)) {
      return res.status(400).json({ error: 'project_id must be a valid project uuid' });
    }

    const project = await db.query('SELECT id FROM projects WHERE id = $1', [projectId]);
    if (project.rowCount === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { rows } = await db.query(
      `INSERT INTO user_projects (user_id, project_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, project_id) DO UPDATE SET user_id = EXCLUDED.user_id
       RETURNING id, project_id, created_at`,
      [req.user.id, projectId]
    );

    return res.status(201).json(rows[0]);
  })
);

/** Un-save a project. Progress rows cascade away with it. */
router.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: 'Invalid saved project id' });
    }

    const { rowCount } = await db.query(
      'DELETE FROM user_projects WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Saved project not found' });
    }

    return res.status(204).end();
  })
);

module.exports = router;
