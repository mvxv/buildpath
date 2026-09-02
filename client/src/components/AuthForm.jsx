import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Spinner } from './States.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Shared shell for the login and signup pages. `mode` is 'login' or 'signup'.
 */
export default function AuthForm({ mode }) {
  const isSignup = mode === 'signup';
  const { signIn, signUp, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const redirectTo = location.state?.from?.pathname || '/my-projects';

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      if (isSignup) {
        const result = await signUp(form);
        // With email confirmation switched on, Supabase returns a user but no
        // session — the student has to confirm before they can sign in.
        if (!result.session) {
          setNotice('Check your inbox for a confirmation link, then log in.');
          return;
        }
      } else {
        await signIn(form);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-10">
      <p className="eyebrow">{isSignup ? 'Get started' : 'Welcome back'}</p>
      <h1 className="mt-4 font-display text-3xl font-bold text-ink">
        {isSignup ? 'Create your account' : 'Log in'}
      </h1>
      <p className="mt-3 leading-relaxed text-ink-dim">
        {isSignup
          ? 'An account lets you save projects and track every step to done.'
          : 'Pick up exactly where you left off.'}
      </p>

      {!isConfigured && (
        <p className="mt-6 rounded-xl border border-flag-amber/30 bg-flag-amber/[0.07] p-4 text-sm text-flag-amber">
          Supabase is not configured, so accounts are unavailable. Set{' '}
          <code className="font-mono text-acid">VITE_SUPABASE_URL</code> and{' '}
          <code className="font-mono text-acid">VITE_SUPABASE_ANON_KEY</code> in{' '}
          <code className="font-mono text-acid">client/.env</code>.
        </p>
      )}

      <form onSubmit={handleSubmit} className="panel mt-7 space-y-5 p-6">
        {isSignup && (
          <div>
            <label className="label" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              className="input"
              autoComplete="name"
              value={form.name}
              onChange={update('name')}
              placeholder="Optional"
            />
          </div>
        )}

        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            className="input"
            autoComplete="email"
            value={form.email}
            onChange={update('email')}
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            className="input"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={form.password}
            onChange={update('password')}
          />
          {isSignup && <p className="mt-2 font-mono text-[0.6875rem] text-ink-faint">minimum 6 characters</p>}
        </div>

        {error && (
          <p className="rounded-lg border border-flag-rose/30 bg-flag-rose/[0.07] p-3 text-sm text-flag-rose" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-lg border border-acid/30 bg-acid/[0.07] p-3 text-sm text-acid">
            {notice}
          </p>
        )}

        <button type="submit" disabled={submitting || !isConfigured} className="btn-primary w-full py-2.5">
          {submitting && <Spinner className="h-4 w-4" />}
          {isSignup ? 'Create account' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-dim">
        {isSignup ? 'Already have an account? ' : 'New here? '}
        <Link
          to={isSignup ? '/login' : '/signup'}
          state={location.state}
          className="font-semibold text-acid transition-opacity hover:opacity-75"
        >
          {isSignup ? 'Log in' : 'Create one'}
        </Link>
      </p>
    </div>
  );
}
