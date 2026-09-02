const DIFFICULTY = {
  beginner: { dot: 'bg-flag-teal', text: 'text-flag-teal' },
  intermediate: { dot: 'bg-flag-amber', text: 'text-flag-amber' },
  advanced: { dot: 'bg-flag-rose', text: 'text-flag-rose' },
};

const CATEGORY_LABELS = {
  'web-app': 'Web app',
  productivity: 'Productivity',
  'data-viz': 'Data & viz',
  'dev-tools': 'Dev tools',
};

export const categoryLabel = (value) => CATEGORY_LABELS[value] || value;

/**
 * Difficulty reads as a coloured dot plus a word rather than another pill, so a
 * card's metadata row stays scannable instead of turning into pill soup.
 */
export function DifficultyTag({ difficulty }) {
  if (!difficulty) return null;
  const style = DIFFICULTY[difficulty] || { dot: 'bg-ink-faint', text: 'text-ink-dim' };

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-xs ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {difficulty}
    </span>
  );
}

export function MetaRow({ children }) {
  return <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">{children}</div>;
}

export function MetaDot() {
  return (
    <span className="text-ink-faint/50" aria-hidden="true">
      /
    </span>
  );
}

export function TechChips({ stack, limit }) {
  const items = Array.isArray(stack) ? stack : [];
  if (items.length === 0) return null;

  const shown = limit ? items.slice(0, limit) : items;
  const hidden = items.length - shown.length;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {shown.map((tech) => (
        <li
          key={tech}
          className="rounded-md border border-line bg-sunken px-2 py-1 font-mono text-[0.6875rem] text-ink-dim"
        >
          {tech}
        </li>
      ))}
      {hidden > 0 && (
        <li className="px-1 py-1 font-mono text-[0.6875rem] text-ink-faint">+{hidden}</li>
      )}
    </ul>
  );
}

/**
 * Progress as one segment per step rather than a continuous bar. At five steps a
 * percentage bar barely moves; discrete segments make each tick feel earned and
 * show at a glance how much is actually left.
 */
export function StepMeter({ completed, total, className = '' }) {
  const done = total > 0 && completed === total;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-xs text-ink-dim">
          <span className={done ? 'text-acid' : 'text-ink'}>{completed}</span>
          <span className="text-ink-faint">/{total} steps</span>
        </span>
        <span className={`font-mono text-xs ${done ? 'text-acid' : 'text-ink-faint'}`}>
          {done ? 'complete' : `${percent}%`}
        </span>
      </div>

      <div
        className="flex gap-1"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Roadmap progress"
      >
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              index < completed ? 'bg-acid' : 'bg-line'
            }`}
            style={index < completed ? { boxShadow: '0 0 12px -2px var(--color-acid)' } : undefined}
          />
        ))}
      </div>
    </div>
  );
}

const RESOURCE_LABELS = { doc: 'DOC', video: 'VID', article: 'ART', repo: 'REPO' };

export function ResourceList({ resources }) {
  if (!resources?.length) {
    return <p className="text-sm text-ink-faint">No resources listed yet.</p>;
  }

  return (
    <ul className="space-y-1.5">
      {resources.map((resource) => (
        <li key={resource.id}>
          <a
            href={resource.url}
            target="_blank"
            rel="noreferrer noopener"
            className="group flex items-start gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-line hover:bg-raised"
          >
            <span className="mt-0.5 shrink-0 font-mono text-[0.625rem] tracking-wider text-ink-faint transition-colors group-hover:text-acid">
              {RESOURCE_LABELS[resource.type] || resource.type}
            </span>
            <span className="text-sm leading-snug text-ink-dim transition-colors group-hover:text-ink">
              {resource.label || resource.url}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
