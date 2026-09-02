import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState, ErrorState, Loading } from '../components/States.jsx';
import { DifficultyTag, MetaDot, MetaRow, StepMeter, categoryLabel } from '../components/ui.jsx';
import { api } from '../lib/api';

export default function MyProjects() {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.getSavedProjects().then(setSaved).catch(setError).finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  if (loading) return <Loading label="Loading your projects" />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  const inProgress = saved.filter((entry) => entry.completed_steps < entry.total_steps).length;
  const done = saved.length - inProgress;

  return (
    <div>
      <header className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Your work</p>
          <h1 className="mt-4 font-display text-4xl font-bold text-ink">My projects</h1>
          {saved.length > 0 && (
            <p className="mt-3 font-mono text-xs text-ink-faint">
              {inProgress} in progress
              {done > 0 && ` · ${done} finished`}
            </p>
          )}
        </div>
        {saved.length > 0 && (
          <Link to="/projects" className="btn-secondary">
            Add another
          </Link>
        )}
      </header>

      {saved.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          description="Save a project and its roadmap becomes a checklist you can work through, step by step."
          actionLabel="Find my project"
          actionTo="/quiz"
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((entry) => {
            const complete = entry.total_steps > 0 && entry.completed_steps === entry.total_steps;

            return (
              <li key={entry.id} className="card-interactive group flex flex-col p-5">
                <MetaRow>
                  <DifficultyTag difficulty={entry.difficulty} />
                  <MetaDot />
                  <span className="meta">{categoryLabel(entry.category)}</span>
                </MetaRow>

                <h2 className="mt-3 font-display text-lg leading-snug font-semibold text-ink">
                  <Link
                    to={`/my-projects/${entry.id}`}
                    className="transition-colors group-hover:text-acid"
                  >
                    {entry.title}
                  </Link>
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-dim">
                  {entry.description}
                </p>

                <div className="mt-auto pt-6">
                  <StepMeter completed={entry.completed_steps} total={entry.total_steps} />
                  <Link
                    to={`/my-projects/${entry.id}`}
                    className="mt-4 block font-display text-sm font-semibold text-ink-dim transition-colors group-hover:text-acid"
                  >
                    {complete
                      ? 'Review →'
                      : entry.completed_steps === 0
                        ? 'Start building →'
                        : 'Continue →'}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
