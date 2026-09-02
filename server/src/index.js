const express = require('express');
const cors = require('cors');

const config = require('./config');
const db = require('./db');

const projectsRouter = require('./routes/projects');
const quizRouter = require('./routes/quiz');
const profileRouter = require('./routes/profile');
const userProjectsRouter = require('./routes/userProjects');
const userProgressRouter = require('./routes/userProgress');

const app = express();

// CORS is configured here rather than at deploy time (handoff section 8.2).
// Requests without an Origin header (curl, health checks, server-to-server) pass
// through; browser origins must be listed in CORS_ORIGINS.
//
// An unlisted origin gets `false` rather than an error: the response simply carries
// no Access-Control-Allow-Origin header and the browser blocks it, which is what
// CORS is for. Rejecting with an error instead would turn every stray crawler into
// a 500 and a stack trace in the logs.
app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || config.corsOrigins.includes(origin));
    },
    credentials: true,
  })
);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/health/db', async (_req, res) => {
  try {
    const { rows } = await db.query('SELECT now() AS now');
    res.json({ status: 'ok', database: 'connected', now: rows[0].now });
  } catch (err) {
    console.error('Database health check failed:', err.message);
    res.status(503).json({ status: 'error', database: 'unreachable', message: err.message });
  }
});

app.use('/api/projects', projectsRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/profile', profileRouter);
app.use('/api/user-projects', userProjectsRouter);
app.use('/api/user-progress', userProgressRouter);

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity.
app.use((err, req, res, next) => {
  console.error(`${req.method} ${req.path} failed:`, err);
  const status = err.status || 500;
  res.status(status).json({
    error: config.isProduction && status === 500 ? 'Internal server error' : err.message,
  });
});

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`BuildPath API listening on http://localhost:${config.port}`);
    console.log(`CORS origins allowed: ${config.corsOrigins.join(', ')}`);
  });
}

module.exports = app;
