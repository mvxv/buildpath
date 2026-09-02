import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ErrorState, Loading } from '../components/States.jsx';
import { DifficultyTag, MetaDot, MetaRow, ResourceList, StepMeter, TechChips, categoryLabel } from '../components/ui.jsx';
import { api } from '../lib/api';

function CheckMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M3.5 8.4l3 3 6-6.8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SavedProject() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingStep, setPendingStep] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.getSavedProject(id).then(setData).catch(setError).finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  /**
   * Toggling is optimistic: the step flips immediately and rolls back if the
   * request fails, so working down a checklist never feels laggy.
   */
  const toggleStep = async (step) => {
    const completed = !step.completed;
    setPendingStep(step.id);
    setActionError(null);

    const apply = (value) =>
      setData((current) => {
        if (!current) return current;
        const steps = current.roadmap_steps.map((item) =>
          item.id === step.id ? { ...item, completed: value } : item
        );
        return {
          ...current,
          roadmap_steps: steps,
          completed_steps: steps.filter((item) => item.completed).length,
        };
      });

    apply(completed);

    try {
      await api.setStepProgress({ userProjectId: id, roadmapStepId: step.id, completed });
    } catch (err) {
      apply(step.completed);
      setActionError(err.message || 'Could not save that change.');
    } finally {
      setPendingStep(null);
    }
  };

  const handleRemove = async () => {
    const confirmed = window.confirm(
      'Remove this project from your list? Your checked-off steps will be deleted.'
    );
    if (!confirmed) return;

    setRemoving(true);
    setActionError(null);
    try {
      await api.unsaveProject(id);
      navigate('/my-projects');
    } catch (err) {
      setActionError(err.message || 'Could not remove this project.');
      setRemoving(false);
    }
  };

  if (loading) return <Loading label="Loading your checklist" />;
  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!data) return null;

  const { project, roadmap_steps: steps, resources, completed_steps: completed, total_steps: total } = data;
  const finished = total > 0 && completed === total;
  const nextStep = steps.find((step) => !step.completed);

  return (
    <article>
      <Link
        to="/my-projects"
        className="font-mono text-xs text-ink-faint transition-colors hover:text-acid"
      >
        ← my projects
      </Link>

      <header className="mt-6">
        <MetaRow>
          <DifficultyTag difficulty={project.difficulty} />
          <MetaDot />
          <span className="meta">{categoryLabel(project.category)}</span>
          {project.est_hours != null && (
            <>
              <MetaDot />
              <span className="meta">~{project.est_hours} hours</span>
            </>
          )}
        </MetaRow>
        <h1 className="mt-4 font-display text-4xl leading-[1.1] font-bold text-ink">
          {project.title}
        </h1>
      </header>

      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div>
          <div className="panel-raised p-5">
            <StepMeter completed={completed} total={total} />
            {!finished && nextStep && (
              <p className="mt-4 border-t border-line pt-4 text-sm text-ink-dim">
                <span className="font-mono text-xs text-ink-faint">up next — </span>
                <span className="text-ink">{nextStep.title}</span>
              </p>
            )}
          </div>

          {finished && (
            <div className="mt-5 rounded-xl border border-acid/30 bg-acid/[0.06] p-5">
              <p className="font-display font-semibold text-acid">Every step is done.</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">
                Write the README, deploy it, and put it in your portfolio — the{' '}
                <Link to="/deploy" className="text-acid underline underline-offset-2">
                  deployment guide
                </Link>{' '}
                walks through it.
              </p>
            </div>
          )}

          {actionError && (
            <p
              className="mt-5 rounded-xl border border-flag-rose/30 bg-flag-rose/[0.06] p-4 text-sm text-flag-rose"
              role="alert"
            >
              {actionError}
            </p>
          )}

          <ol className="spine mt-9">
            {steps.map((step) => (
              <li
                key={step.id}
                className={`spine-item pb-8 last:pb-0 ${step.completed ? 'is-done' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => toggleStep(step)}
                  disabled={pendingStep === step.id}
                  aria-pressed={step.completed}
                  aria-label={`Mark "${step.title}" ${step.completed ? 'incomplete' : 'complete'}`}
                  className="spine-node cursor-pointer hover:border-acid/60 disabled:opacity-60"
                >
                  {step.completed ? <CheckMark /> : String(step.step_order).padStart(2, '0')}
                </button>

                <button
                  type="button"
                  onClick={() => toggleStep(step)}
                  disabled={pendingStep === step.id}
                  tabIndex={-1}
                  className="block w-full cursor-pointer pt-3 text-left"
                >
                  <h3
                    className={`font-display text-lg font-semibold transition-colors ${
                      step.completed ? 'text-ink-faint line-through' : 'text-ink'
                    }`}
                  >
                    {step.title}
                  </h3>
                  {step.description && (
                    <p
                      className={`mt-2 max-w-xl text-sm leading-relaxed transition-colors ${
                        step.completed ? 'text-ink-faint/70' : 'text-ink-dim'
                      }`}
                    >
                      {step.description}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ol>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {project.prerequisites && (
            <div className="panel p-5">
              <h2 className="label mb-3">Before you start</h2>
              <p className="text-sm leading-relaxed text-ink-dim">{project.prerequisites}</p>
            </div>
          )}

          <div className="panel p-5">
            <h2 className="label mb-3">Stack</h2>
            <TechChips stack={project.tech_stack} />
          </div>

          <div className="panel p-5">
            <h2 className="label mb-2">Resources</h2>
            <ResourceList resources={resources} />
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="btn-danger w-full"
          >
            {removing ? 'Removing…' : 'Remove from my projects'}
          </button>
        </aside>
      </div>
    </article>
  );
}
