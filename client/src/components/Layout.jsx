import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_LINKS = [
  { to: '/projects', label: 'Library' },
  { to: '/quiz', label: 'Find my project' },
  { to: '/my-projects', label: 'My projects' },
  { to: '/deploy', label: 'Deploy' },
];

function navClass({ isActive }) {
  return [
    'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'text-ink' : 'text-ink-dim hover:text-ink',
  ].join(' ');
}

function Wordmark() {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      {/* Three nodes on a line — the same spine the roadmaps use. */}
      <span className="flex flex-col items-center gap-[3px]" aria-hidden="true">
        <span className="h-1.5 w-1.5 rounded-full bg-acid" />
        <span className="h-1.5 w-1.5 rounded-full bg-acid/50 transition-colors group-hover:bg-acid" />
        <span className="h-1.5 w-1.5 rounded-full bg-line-bright transition-colors group-hover:bg-acid/50" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-ink">BuildPath</span>
    </Link>
  );
}

export default function Layout() {
  const { user, signOut, isConfigured } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col">
      {!isConfigured && (
        <p className="border-b border-flag-amber/25 bg-flag-amber/10 px-4 py-2 text-center font-mono text-xs text-flag-amber">
          Supabase is not configured — accounts and progress tracking are off. See client/.env.example
        </p>
      )}

      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-4">
          <Wordmark />

          <nav className="hidden items-center gap-0.5 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={navClass}>
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && (
                      <span className="absolute inset-x-3 -bottom-[1.05rem] h-px bg-acid" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <span className="max-w-[14rem] truncate font-mono text-xs text-ink-faint">
                  {user.email}
                </span>
                <button type="button" onClick={handleSignOut} className="btn-secondary">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  Log in
                </Link>
                <Link to="/signup" className="btn-primary">
                  Get started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="btn-secondary ml-auto md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>

        {menuOpen && (
          <nav id="mobile-nav" className="border-t border-line bg-surface px-5 py-4 md:hidden">
            <div className="flex flex-col gap-0.5">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={navClass}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
              {user ? (
                <>
                  <span className="truncate px-1 font-mono text-xs text-ink-faint">{user.email}</span>
                  <button type="button" onClick={handleSignOut} className="btn-secondary">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary" onClick={() => setMenuOpen(false)}>
                    Log in
                  </Link>
                  <Link to="/signup" className="btn-primary" onClick={() => setMenuOpen(false)}>
                    Get started
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-ink-faint">
            BuildPath — pick it, plan it, finish it.
          </p>
          <Link
            to="/deploy"
            className="font-mono text-xs text-ink-dim transition-colors hover:text-acid"
          >
            Deployment guide →
          </Link>
        </div>
      </footer>
    </div>
  );
}
