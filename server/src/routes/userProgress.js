const express = require('express');
const db = require('../db');
const { isUuid, asyncRoute } = require('../lib/http');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

/**
 * Mark a roadmap step complete or incomplete.
 *
 * Body: { user_project_id, roadmap_step_id, completed }
 *
 * The row is kept either way and `completed_at` carries the state, so unchecking a
 * step does not lose the fact that it was worked on, and the UNIQUE constraint
 * keeps one row per (saved project, step).
 */
router.post(
  '/',
  asyncRoute(async (req, res) => {
    const {
      user_project_id: userProjectId,
      roadmap_step_id: roadmapStepId,
      completed = true,
    } = req.body || {};

    if (!isUuid(userProjectId) || !isUuid(roadmapStepId)) {
      return res
        .status(400)
        .json({ error: 'user_project_id and roadmap_step_id must be valid uuids' });
    }

    // Ownership check and step-belongs-to-project check in one query, so a user
    // cannot tick a step on someone else's saved project or on an unrelated one.
    const owned = await db.query(
      `SELECT up.id
         FROM user_projects up
         JOIN roadmap_steps rs ON rs.project_id = up.project_id
        WHERE up.id = $1 AND up.user_id = $2 AND rs.id = $3`,
      [userProjectId, req.user.id, roadmapStepId]
    );
    if (owned.rowCount === 0) {
      return res
        .status(404)
        .json({ error: 'Saved project not found, or that step does not belong to it' });
    }

    const completedAt = completed ? new Date() : null;

    const { rows } = await db.query(
      `INSERT INTO user_progress (user_project_id, roadmap_step_id, completed_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_project_id, roadmap_step_id)
       DO UPDATE SET completed_at = EXCLUDED.completed_at
       RETURNING id, user_project_id, roadmap_step_id, completed_at`,
      [userProjectId, roadmapStepId, completedAt]
    );

    const totals = await db.query(
      `SELECT (SELECT COUNT(*) FROM roadmap_steps rs
                 JOIN user_projects up ON up.project_id = rs.project_id
                WHERE up.id = $1)                                   AS total_steps,
              (SELECT COUNT(*) FROM user_progress pr
                WHERE pr.user_project_id = $1
                  AND pr.completed_at IS NOT NULL)                  AS completed_steps`,
      [userProjectId]
    );

    return res.json({
      ...rows[0],
      completed: rows[0].completed_at !== null,
      total_steps: Number(totals.rows[0].total_steps),
      completed_steps: Number(totals.rows[0].completed_steps),
    });
  })
);

module.exports = router;
