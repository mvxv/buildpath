/**
 * Scoring for the matching quiz.
 *
 * Answers are weighted, not filtered: a project is never excluded outright, it
 * just ranks lower. That matters because most students skip at least one
 * question, and a filter would quietly throw away good matches.
 *
 * Two of the five answers have no column to compare against directly:
 *
 *   career goal — matched against the project's `career_goals` tags
 *   time        — matched against `est_hours` on a tolerance band, so a project
 *                 slightly over budget still places, and one far over is
 *                 penalised rather than dropped
 */

const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'];

const CAREER_GOALS = [
  { value: 'frontend', label: 'Frontend engineer' },
  { value: 'backend', label: 'Backend engineer' },
  { value: 'fullstack', label: 'Full-stack engineer' },
  { value: 'data', label: 'Data / analytics' },
  { value: 'devops', label: 'DevOps / platform' },
];

const CATEGORIES = [
  { value: 'web-app', label: 'Web apps' },
  { value: 'productivity', label: 'Productivity tools' },
  { value: 'data-viz', label: 'Data & visualisation' },
  { value: 'dev-tools', label: 'Developer tools' },
];

// Total hours the student expects to spend on the whole project.
const TIME_BUDGETS = [
  { value: 12, label: 'A weekend (~12 hours)' },
  { value: 20, label: 'About a week (~20 hours)' },
  { value: 30, label: 'A couple of weeks (~30 hours)' },
  { value: 60, label: 'However long it takes' },
];

// Max attainable score, used to present a friendlier 0-100 match percentage.
const MAX_SCORE = 30 + 25 + 20 + 18 + 12;

const normalise = (value) => String(value || '').trim().toLowerCase();

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return [value];
}

function scoreDifficulty(project, answers, reasons) {
  const userIdx = EXPERIENCE_LEVELS.indexOf(normalise(answers.experience_level));
  const projIdx = EXPERIENCE_LEVELS.indexOf(normalise(project.difficulty));
  if (userIdx === -1 || projIdx === -1) return 0;

  const distance = Math.abs(projIdx - userIdx);
  if (distance === 0) {
    reasons.push(`Pitched at your ${project.difficulty} level`);
    return 30;
  }
  if (distance === 1) {
    reasons.push(
      projIdx > userIdx
        ? 'A step up from where you are now'
        : 'An easier build you can finish quickly'
    );
    return 12;
  }
  return -12;
}

function scoreCareerGoal(project, answers, reasons) {
  const goal = normalise(answers.career_goal);
  if (!goal) return 0;

  const tags = toArray(project.career_goals).map(normalise);
  if (!tags.includes(goal)) return 0;

  const label = CAREER_GOALS.find((g) => g.value === goal)?.label || goal;
  reasons.push(`Builds skills for ${label.toLowerCase()} roles`);
  return 25;
}

function scoreInterest(project, answers, reasons) {
  const interests = toArray(answers.interests).map(normalise);
  if (!interests.length) return 0;
  if (!interests.includes(normalise(project.category))) return 0;

  const label = CATEGORIES.find((c) => c.value === normalise(project.category))?.label;
  reasons.push(`In a category you picked: ${label || project.category}`);
  return 20;
}

function scoreTech(project, answers, reasons) {
  const known = toArray(answers.tech).map(normalise).filter(Boolean);
  if (!known.length) return 0;

  const stack = toArray(project.tech_stack);
  const overlap = stack.filter((tech) => known.includes(normalise(tech)));
  if (!overlap.length) return 0;

  reasons.push(`Uses ${overlap.join(', ')}, which you already know`);
  return Math.min(overlap.length * 6, 18);
}

function scoreTime(project, answers, reasons) {
  const budget = Number(answers.hours_available);
  const estimate = Number(project.est_hours);
  if (!budget || !estimate) return 0;

  const ratio = estimate / budget;
  if (ratio <= 1) {
    reasons.push(`Fits your ~${budget}h budget (about ${estimate}h)`);
    return 12;
  }
  if (ratio <= 1.5) {
    reasons.push(`Slightly over your budget at about ${estimate}h`);
    return 5;
  }
  if (ratio <= 2) return -5;
  return -15;
}

/** Score a single project against quiz answers. Higher is better. */
function scoreProject(project, answers) {
  const reasons = [];
  const score =
    scoreDifficulty(project, answers, reasons) +
    scoreCareerGoal(project, answers, reasons) +
    scoreInterest(project, answers, reasons) +
    scoreTech(project, answers, reasons) +
    scoreTime(project, answers, reasons);

  return {
    score,
    reasons,
    match_percent: Math.max(0, Math.min(100, Math.round((score / MAX_SCORE) * 100))),
  };
}

/**
 * Rank projects best-first. Ties break toward the shorter project, so a student
 * who is otherwise indifferent gets the one they are likelier to finish.
 */
function matchProjects(projects, answers, limit = 5) {
  return projects
    .map((project) => ({ ...project, ...scoreProject(project, answers) }))
    .sort((a, b) => b.score - a.score || (a.est_hours || 0) - (b.est_hours || 0))
    .slice(0, limit);
}

module.exports = {
  EXPERIENCE_LEVELS,
  CAREER_GOALS,
  CATEGORIES,
  TIME_BUDGETS,
  scoreProject,
  matchProjects,
};
