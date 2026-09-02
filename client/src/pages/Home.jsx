import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

const STEPS = [
  {
    kicker: '01',
    title: 'Pick something worth building',
    body: 'Every project is chosen to be finishable and to prove a real skill to whoever reads your portfolio.',
  },
  {
    kicker: '02',
    title: 'Follow the roadmap',
    body: 'Each one breaks into ordered steps with a short brief, so you always know exactly what comes next.',
  },
  {
    kicker: '03',
    title: 'Track it to done',
    body: 'Tick off steps and watch the path light up. Half-finished projects are the default. This is how you avoid one.',
  },
];

/** A miniature of the roadmap UI, used as the hero's visual. */
function SpinePreview() {
  const steps = [
    { label: 'Set up the project', done: true },
    { label: 'Design the schema', done: true },
    { label: 'Build the CRUD API', done: true },
    { label: 'Build the list view', done: false },
    { label: 'Add spending charts', done: false },
  ];

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-raised px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-flag-rose/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-flag-amber/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-flag-teal/70" />
        <span className="ml-2 font-mono text-xs text-ink-faint">personal-budget-tracker</span>
      </div>

      <div className="p-5">
        <div className="mb-5 flex gap-1">
          {steps.map((step, index) => (
            <span
              key={index}
              className={`h-1.5 flex-1 rounded-full ${step.done ? 'bg-acid' : 'bg-line'}`}
              style={step.done ? { boxShadow: '0 0 12px -2px var(--color-acid)' } : undefined}
            />
          ))}
        </div>

        <ul>
          {steps.map((step, index) => (
            <li key={step.label} className="relative flex items-center gap-3 pb-4 pl-8 last:pb-0">
              {index < steps.length - 1 && (
                <span
                  className={`absolute top-5 left-[0.4375rem] h-full w-px ${
                    step.done ? 'bg-acid/40' : 'bg-line'
                  }`}
                />
              )}
              <span
                className={`absolute top-1 left-0 grid h-3.5 w-3.5 place-items-center rounded-full border ${
                  step.done ? 'border-acid bg-acid' : 'border-line-bright bg-surface'
                }`}
              >
                {step.done && (
                  <svg viewBox="0 0 12 12" className="h-2 w-2 text-canvas" fill="none">
                    <path
                      d="M2.5 6.2l2.4 2.4L9.5 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className={`text-sm ${step.done ? 'text-ink-faint line-through' : 'text-ink'}`}>
                {step.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Home() {
  const [total, setTotal] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getMeta()
      .then((meta) => {
        if (!cancelled) setTotal(meta.total);
      })
      .catch(() => {
        // The count is decoration; the page reads fine without it.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <section className="grid items-center gap-12 py-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-16">
        <div>
          <p className="eyebrow">Stop staring at a blank repo</p>

          <h1 className="mt-5 font-display text-[2.75rem] leading-[1.05] font-bold text-ink sm:text-6xl">
            Build something
            <br />
            worth{' '}
            <span className="relative whitespace-nowrap text-acid">
              showing
              <svg
                className="absolute -bottom-1 left-0 w-full text-acid/40"
                height="10"
                viewBox="0 0 200 10"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M2 7c40-5 90-6 196-2"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="mt-7 max-w-lg text-lg leading-relaxed text-ink-dim">
            BuildPath matches you with a portfolio project that fits your level, your goals, and the
            time you actually have — then hands you the roadmap and tracks you to the finish.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/quiz" className="btn-primary px-6 py-3 text-base">
              Find my project
            </Link>
            <Link to="/projects" className="btn-secondary px-6 py-3 text-base">
              {total ? `Browse ${total} projects` : 'Browse the library'}
            </Link>
          </div>

          <p className="mt-6 font-mono text-xs text-ink-faint">
            No account needed to browse or take the quiz.
          </p>
        </div>

        <div className="relative">
          <div
            className="pointer-events-none absolute -inset-10 opacity-40 blur-3xl"
            style={{
              background: 'radial-gradient(closest-side, var(--color-acid-shadow), transparent 70%)',
            }}
            aria-hidden="true"
          />
          <div className="relative">
            <SpinePreview />
          </div>
        </div>
      </section>

      <section className="border-t border-line py-16">
        <ol className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.kicker} className="bg-surface p-7">
              <span className="font-mono text-xs tracking-widest text-acid">{step.kicker}</span>
              <h2 className="mt-4 font-display text-lg font-semibold text-ink">{step.title}</h2>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-dim">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-line bg-surface px-6 py-16 text-center sm:px-12">
        <div
          className="pointer-events-none absolute inset-x-0 -top-24 h-48 opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(closest-side, var(--color-acid-shadow), transparent)',
          }}
          aria-hidden="true"
        />
        <div className="relative">
          <h2 className="font-display text-3xl font-bold text-ink">One minute to a decision</h2>
          <p className="mx-auto mt-4 max-w-lg leading-relaxed text-ink-dim">
            Five questions, then a ranked shortlist with the reason behind every match. You only
            need an account once you want to save one and start ticking steps off.
          </p>
          <Link to="/quiz" className="btn-primary mt-8 px-7 py-3 text-base">
            Take the quiz
          </Link>
        </div>
      </section>
    </div>
  );
}
