import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ErrorState, Loading, Spinner } from '../components/States.jsx';
import { DifficultyTag, MetaDot, MetaRow, ResourceList, TechChips, categoryLabel } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ApiError, api } from '../lib/api';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [savedId, setSavedId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.getProject(id).then(setProject).catch(setError).finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  // Tells the user this project is already on their list, instead of letting them
  // click Save and get a no-op.
  useEffect(() => {
    if (!user) {
      setSavedId(null);
      return undefined;
    }

    let cancelled = false;
    api
      .getSavedProjectFor(id)
      .then((saved) => {
        if (!cancelled) setSavedId(saved?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setSavedId(null);
      });

    return () => {
      cancelled = true;
    };
  }, [user, id]);

  const handleSave = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/projects/${id}` } } });
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const saved = await api.saveProject(id);
      navigate(`/my-projects/${saved.id}`);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save this project.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading label="Loading project" />;
  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!project) return null;

  return (
    <article>
      <Link
        to="/projects"
        className="font-mono text-xs text-ink-faint transition-colors hover:text-acid"
      >
        ← library
      </Link>

      <header className="mt-6 border-b border-line pb-9">
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
          <MetaDot />
          <span className="meta">{project.roadmap_steps.length} steps</span>
        </MetaRow>

        <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.1] font-bold text-ink sm:text-5xl">
          {project.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-dim">{project.description}</p>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div>
          <h2 className="eyebrow">The roadmap</h2>
          <p className="mt-3 text-sm text-ink-faint">
            Save the project to turn this into a checklist you can tick off.
          </p>

          <ol className="spine mt-8">
            {project.roadmap_steps.map((step) => (
              <li key={step.id} className="spine-item pb-8 last:pb-0">
                <span className="spine-node">{String(step.step_order).padStart(2, '0')}</span>
                <h3 className="pt-3 font-display text-lg font-semibold text-ink">{step.title}</h3>
                {step.description && (
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-dim">
                    {step.description}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="panel-raised p-5">
            {savedId ? (
              <>
                <p className="mb-4 font-mono text-xs text-acid">✓ on your list</p>
                <Link to={`/my-projects/${savedId}`} className="btn-primary w-full">
                  Open my checklist
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary w-full py-2.5"
                >
                  {saving && <Spinner />}
                  {saving ? 'Saving' : 'Start this project'}
                </button>
                {!user && (
                  <p className="mt-3 text-center font-mono text-[0.6875rem] text-ink-faint">
                    you will be asked to log in
                  </p>
                )}
              </>
            )}
            {saveError && <p className="mt-3 text-sm text-flag-rose">{saveError}</p>}
          </div>

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
            <ResourceList resources={project.resources} />
          </div>
        </aside>
      </div>
    </article>
  );
}
