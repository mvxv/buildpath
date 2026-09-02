import { Link } from 'react-router-dom';

export function Spinner({ className = 'h-4 w-4' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
    </svg>
  );
}

export function Loading({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-24 text-ink-faint" role="status">
      <Spinner className="h-4 w-4 text-acid" />
      <span className="font-mono text-xs tracking-wider">{label}…</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const message = typeof error === 'string' ? error : error?.message || 'Something went wrong.';

  return (
    <div className="panel border-flag-rose/30 p-8 text-center" role="alert">
      <p className="eyebrow text-flag-rose">Error</p>
      <p className="mt-3 font-display text-lg font-semibold text-ink">That did not work</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-dim">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-6">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, actionLabel, actionTo }) {
  return (
    <div className="panel p-14 text-center">
      {/* An empty spine: the shape of what will be here once there is something. */}
      <div className="mx-auto mb-8 flex w-fit flex-col items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex flex-col items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-line-bright" />
            {index < 2 && <span className="h-4 w-px bg-line" />}
          </div>
        ))}
      </div>

      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-dim">{description}</p>
      )}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary mt-7">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
