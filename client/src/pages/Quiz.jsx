import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import ProjectCard from '../components/ProjectCard.jsx';
import { ErrorState, Loading, Spinner } from '../components/States.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api';

const EXPERIENCE_HELP = {
  beginner: 'I can write basic JavaScript and follow a tutorial.',
  intermediate: 'I have built a full app or two on my own.',
  advanced: 'I am comfortable designing a system from scratch.',
};

const INITIAL_ANSWERS = {
  experience_level: '',
  career_goal: '',
  hours_available: '',
  interests: [],
  tech: [],
};

function Fieldset({ index, legend, hint, children }) {
  return (
    <fieldset className="panel p-6">
      <legend className="flex items-baseline gap-3 px-1">
        <span className="font-mono text-xs text-acid">{String(index).padStart(2, '0')}</span>
        <span className="font-display text-lg font-semibold text-ink">{legend}</span>
      </legend>
      {hint && <p className="mt-2 text-sm text-ink-faint">{hint}</p>}
      <div className="mt-5">{children}</div>
    </fieldset>
  );
}

function OptionButton({ selected, onClick, title, description }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`cursor-pointer rounded-lg border p-3.5 text-left transition-all duration-150 ${
        selected
          ? 'border-acid bg-acid/[0.07] text-ink'
          : 'border-line bg-sunken hover:border-line-bright hover:bg-raised'
      }`}
      style={selected ? { boxShadow: '0 0 0 1px var(--color-acid), 0 6px 20px -14px var(--color-acid)' } : undefined}
    >
      <span className={`block text-sm font-medium ${selected ? 'text-ink' : 'text-ink-dim'}`}>
        {title}
      </span>
      {description && <span className="mt-1 block text-xs text-ink-faint">{description}</span>}
    </button>
  );
}

export default function Quiz() {
  const { user } = useAuth();

  const [options, setOptions] = useState(null);
  const [techOptions, setTechOptions] = useState([]);
  const [optionsError, setOptionsError] = useState(null);

  const [answers, setAnswers] = useState(INITIAL_ANSWERS);
  const [matches, setMatches] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    Promise.all([api.getQuizOptions(), api.getMeta()])
      .then(([quizOptions, meta]) => {
        setOptions(quizOptions);
        setTechOptions(meta.tech_stack || []);
      })
      .catch(setOptionsError);
  }, []);

  // Pre-fill from the saved profile so returning students do not re-answer
  // questions the app already knows.
  useEffect(() => {
    if (!user) return;
    api
      .getProfile()
      .then((profile) => {
        if (!profile) return;
        setAnswers((current) => ({
          ...current,
          experience_level: current.experience_level || profile.experience_level || '',
          career_goal: current.career_goal || profile.career_goal || '',
        }));
      })
      .catch(() => {
        // A missing profile just means nothing to pre-fill.
      });
  }, [user]);

  const toggleInList = (key, value) =>
    setAnswers((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setMatches(null);

    try {
      const result = await api.matchProjects({
        ...answers,
        hours_available: Number(answers.hours_available) || undefined,
      });
      setMatches(result.matches);

      // Remember the two answers that are really profile facts, not quiz inputs.
      if (user && (answers.experience_level || answers.career_goal)) {
        api
          .updateProfile({
            experience_level: answers.experience_level || undefined,
            career_goal: answers.career_goal || undefined,
          })
          .catch(() => {
            // Saving the profile is a convenience; never block results on it.
          });
      }
    } catch (err) {
      setSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setAnswers(INITIAL_ANSWERS);
    setMatches(null);
  };

  if (optionsError) {
    return <ErrorState error={optionsError} onRetry={() => window.location.reload()} />;
  }
  if (!options) return <Loading label="Loading the quiz…" />;

  return (
    <div>
      <header className="mb-9">
        <p className="eyebrow">The quiz</p>
        <h1 className="mt-4 font-display text-4xl font-bold text-ink sm:text-5xl">
          Find my project
        </h1>
        <p className="mt-4 max-w-xl leading-relaxed text-ink-dim">
          Five questions, none of them required. Answer what you know, skip the rest, and the
          ranking works with whatever you give it.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <Fieldset index={1} legend="How much have you built before?">
          <div className="grid gap-2 sm:grid-cols-3">
            {options.experience_levels.map((level) => (
              <OptionButton
                key={level}
                selected={answers.experience_level === level}
                onClick={() =>
                  setAnswers((current) => ({
                    ...current,
                    experience_level: current.experience_level === level ? '' : level,
                  }))
                }
                title={level[0].toUpperCase() + level.slice(1)}
                description={EXPERIENCE_HELP[level]}
              />
            ))}
          </div>
        </Fieldset>

        <Fieldset index={2} legend="What kind of role are you aiming for?">
          <div className="grid gap-2 sm:grid-cols-3">
            {options.career_goals.map((goal) => (
              <OptionButton
                key={goal.value}
                selected={answers.career_goal === goal.value}
                onClick={() =>
                  setAnswers((current) => ({
                    ...current,
                    career_goal: current.career_goal === goal.value ? '' : goal.value,
                  }))
                }
                title={goal.label}
              />
            ))}
          </div>
        </Fieldset>

        <Fieldset
          index={3}
          legend="How much time do you have in total?"
          hint="Be honest — a project you finish beats a bigger one you abandon."
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {options.time_budgets.map((budget) => (
              <OptionButton
                key={budget.value}
                selected={Number(answers.hours_available) === budget.value}
                onClick={() =>
                  setAnswers((current) => ({
                    ...current,
                    hours_available:
                      Number(current.hours_available) === budget.value ? '' : budget.value,
                  }))
                }
                title={budget.label}
              />
            ))}
          </div>
        </Fieldset>

        <Fieldset index={4} legend="What are you interested in building?" hint="Pick as many as you like.">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {options.categories.map((category) => (
              <OptionButton
                key={category.value}
                selected={answers.interests.includes(category.value)}
                onClick={() => toggleInList('interests', category.value)}
                title={category.label}
              />
            ))}
          </div>
        </Fieldset>

        {techOptions.length > 0 && (
          <Fieldset
            index={5}
            legend="Which of these have you used?"
            hint="Projects that build on what you already know score higher."
          >
            <div className="flex flex-wrap gap-2">
              {techOptions.map((tech) => {
                const selected = answers.tech.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleInList('tech', tech)}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 font-mono text-xs transition-all ${
                      selected
                        ? 'border-acid bg-acid/10 text-acid'
                        : 'border-line bg-sunken text-ink-dim hover:border-line-bright hover:text-ink'
                    }`}
                  >
                    {tech}
                  </button>
                );
              })}
            </div>
          </Fieldset>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={submitting} className="btn-primary px-6 py-3 text-base">
            {submitting && <Spinner className="h-4 w-4" />}
            {submitting ? 'Matching…' : 'Show my matches'}
          </button>
          <button type="button" onClick={reset} className="btn-ghost">
            Start over
          </button>
        </div>
      </form>

      {submitError && (
        <div className="mt-6">
          <ErrorState error={submitError} />
        </div>
      )}

      {matches && (
        <section className="mt-16 border-t border-line pt-12">
          <p className="eyebrow">Results</p>
          <h2 className="mt-4 font-display text-3xl font-bold text-ink">Your matches</h2>
          {matches.length === 0 ? (
            <p className="mt-3 text-ink-dim">
              No projects to rank yet — the library looks empty.{' '}
              <Link to="/projects" className="text-acid underline underline-offset-2">
                Check the library
              </Link>
              .
            </p>
          ) : (
            <>
              <p className="mt-3 text-ink-dim">
                Ranked best-first, with the reason behind every score.
              </p>
              <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {matches.map((match) => (
                  <ProjectCard
                    key={match.id}
                    project={match}
                    matchPercent={match.match_percent}
                    reasons={match.reasons}
                  />
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  );
}
