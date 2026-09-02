import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import ProjectCard from '../components/ProjectCard.jsx';
import { EmptyState, ErrorState, Loading } from '../components/States.jsx';
import { categoryLabel } from '../components/ui.jsx';
import { api } from '../lib/api';

const FILTER_KEYS = ['q', 'category', 'difficulty', 'career_goal'];

export default function Library() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [meta, setMeta] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, searchParams.get(key) || '']));
  const hasFilters = FILTER_KEYS.some((key) => filters[key]);

  useEffect(() => {
    api.getMeta().then(setMeta).catch(() => setMeta(null));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .getProjects(Object.fromEntries(searchParams))
      .then(setProjects)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [searchParams]);

  useEffect(load, [load]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  return (
    <div>
      <header className="mb-9">
        <p className="eyebrow">The library</p>
        <h1 className="mt-4 font-display text-4xl font-bold text-ink sm:text-5xl">
          Every project ships with a plan
        </h1>
        <p className="mt-4 max-w-xl leading-relaxed text-ink-dim">
          Roadmap, resources, and an honest time estimate on all of them. Narrow it down to what
          fits you right now.
        </p>
      </header>

      <div className="panel mb-8 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="label" htmlFor="filter-q">
            Search
          </label>
          <input
            id="filter-q"
            type="search"
            className="input"
            placeholder="chat app, dashboard…"
            value={filters.q}
            onChange={(event) => setFilter('q', event.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="filter-category">
            Category
          </label>
          <select
            id="filter-category"
            className="input"
            value={filters.category}
            onChange={(event) => setFilter('category', event.target.value)}
          >
            <option value="">All categories</option>
            {(meta?.categories || []).map((category) => (
              <option key={category.value} value={category.value}>
                {categoryLabel(category.value)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="filter-difficulty">
            Difficulty
          </label>
          <select
            id="filter-difficulty"
            className="input"
            value={filters.difficulty}
            onChange={(event) => setFilter('difficulty', event.target.value)}
          >
            <option value="">Any difficulty</option>
            {(meta?.difficulties || []).map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="filter-goal">
            Career goal
          </label>
          <select
            id="filter-goal"
            className="input"
            value={filters.career_goal}
            onChange={(event) => setFilter('career_goal', event.target.value)}
          >
            <option value="">Any goal</option>
            {(meta?.career_goals || []).map((goal) => (
              <option key={goal.value} value={goal.value}>
                {goal.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <Loading label="Loading projects" />}

      {!loading && error && <ErrorState error={error} onRetry={load} />}

      {!loading && !error && projects.length === 0 && (
        <EmptyState
          title={hasFilters ? 'Nothing matches those filters' : 'The library is empty'}
          description={
            hasFilters
              ? 'Try widening the search, or clear the filters to see everything.'
              : 'Run the seed script to populate the project library.'
          }
        />
      )}

      {!loading && !error && projects.length > 0 && (
        <>
          <div className="mb-5 flex items-center gap-4">
            <p className="meta">
              {projects.length} project{projects.length === 1 ? '' : 's'}
            </p>
            {hasFilters && (
              <button
                type="button"
                className="font-mono text-xs text-acid transition-opacity hover:opacity-70"
                onClick={() => setSearchParams({}, { replace: true })}
              >
                clear filters ✕
              </button>
            )}
          </div>

          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
