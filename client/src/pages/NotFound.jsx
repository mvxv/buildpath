import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="font-mono text-7xl font-semibold text-line-bright sm:text-8xl">404</p>
      <h1 className="mt-6 font-display text-2xl font-bold text-ink">This path leads nowhere</h1>
      <p className="mx-auto mt-3 max-w-sm text-ink-dim">
        The page does not exist. The library is a better place to start.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/projects" className="btn-primary">
          Browse the library
        </Link>
        <Link to="/" className="btn-secondary">
          Go home
        </Link>
      </div>
    </div>
  );
}
