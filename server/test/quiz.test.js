const test = require('node:test');
const assert = require('node:assert/strict');

const { scoreProject, matchProjects } = require('../src/lib/quiz');

const project = {
  title: 'Example',
  difficulty: 'beginner',
  est_hours: 15,
  category: 'web-app',
  tech_stack: ['React', 'Node.js'],
  career_goals: ['fullstack'],
};

test('scoring rules', async (t) => {
  await t.test('rewards a matching experience level', () => {
    const exact = scoreProject(project, { experience_level: 'beginner' });
    const distant = scoreProject(project, { experience_level: 'advanced' });
    assert.ok(exact.score > distant.score);
    assert.ok(exact.reasons.some((r) => r.includes('beginner')));
  });

  await t.test('rewards a matching career goal', () => {
    const hit = scoreProject(project, { career_goal: 'fullstack' });
    const miss = scoreProject(project, { career_goal: 'devops' });
    assert.equal(hit.score - miss.score, 25);
  });

  await t.test('rewards a stated interest in the category', () => {
    const hit = scoreProject(project, { interests: ['web-app'] });
    assert.equal(hit.score, 20);
  });

  await t.test('caps the reward for tech overlap', () => {
    const many = { ...project, tech_stack: ['React', 'Node.js', 'Express', 'PostgreSQL', 'D3'] };
    const result = scoreProject(many, {
      tech: ['react', 'node.js', 'express', 'postgresql', 'd3'],
    });
    assert.equal(result.score, 18);
  });

  await t.test('matches tech case-insensitively', () => {
    const result = scoreProject(project, { tech: ['REACT'] });
    assert.ok(result.score > 0);
  });

  await t.test('scores time as a band rather than an exact match', () => {
    const comfortable = scoreProject(project, { hours_available: 20 });
    const tight = scoreProject(project, { hours_available: 12 });
    const impossible = scoreProject(project, { hours_available: 4 });
    assert.ok(comfortable.score > tight.score);
    assert.ok(tight.score > impossible.score);
  });

  await t.test('ignores answers that were skipped', () => {
    assert.equal(scoreProject(project, {}).score, 0);
    assert.deepEqual(scoreProject(project, {}).reasons, []);
  });

  await t.test('keeps match_percent within 0 and 100', () => {
    const best = scoreProject(project, {
      experience_level: 'beginner',
      career_goal: 'fullstack',
      interests: ['web-app'],
      tech: ['React', 'Node.js'],
      hours_available: 20,
    });
    const worst = scoreProject(project, { experience_level: 'advanced', hours_available: 2 });
    assert.ok(best.match_percent <= 100);
    assert.equal(worst.match_percent, 0);
  });
});

test('ranking', async (t) => {
  await t.test('breaks ties toward the shorter project', () => {
    const long = { ...project, title: 'Long', est_hours: 30 };
    const short = { ...project, title: 'Short', est_hours: 10 };
    const ranked = matchProjects([long, short], { experience_level: 'beginner' });
    assert.equal(ranked[0].title, 'Short');
  });

  await t.test('honours the requested limit', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ ...project, title: `P${i}` }));
    assert.equal(matchProjects(many, {}, 3).length, 3);
  });
});
