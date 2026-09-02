const SECTIONS = [
  { id: 'before', label: 'Before you deploy' },
  { id: 'database', label: 'Database' },
  { id: 'backend', label: 'Backend' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'env', label: 'Environment variables' },
  { id: 'pitfalls', label: 'Common pitfalls' },
];

export default function Deploy() {
  return (
    <div>
      <header className="mb-12 border-b border-line pb-10">
        <p className="eyebrow">Guide</p>
        <h1 className="mt-4 font-display text-4xl font-bold text-ink sm:text-5xl">
          Ship it, or it never happened
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-dim">
          A finished project that only runs on your laptop is hard to show anyone. This is the
          shortest reliable path from <code className="font-mono text-sm text-acid">localhost</code>{' '}
          to a link you can put on your CV.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav className="lg:sticky lg:top-24 lg:self-start" aria-label="On this page">
          <p className="label mb-3">On this page</p>
          <ul className="space-y-1">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="block rounded-lg border-l border-line py-1.5 pl-4 text-sm text-ink-dim transition-colors hover:border-acid hover:text-acid"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="prose-page max-w-3xl">
          <section id="before" className="scroll-mt-24">
            <h2>Before you deploy</h2>
            <p>Three things will save you an hour of confusion later:</p>
            <ul>
              <li>
                <strong>Nothing secret in the repo.</strong> Add <code>.env</code> to{' '}
                <code>.gitignore</code> before your first commit. If a key has ever been pushed,
                rotate it — deleting the commit is not enough.
              </li>
              <li>
                <strong>Read config from the environment.</strong> Every hostname, port, and key
                should come from an environment variable with a sensible local default. A hard-coded{' '}
                <code>localhost</code> is the single most common reason a deploy fails.
              </li>
              <li>
                <strong>Check the production build locally.</strong> Run{' '}
                <code>npm run build</code> and then <code>npm run preview</code>. Bundlers surface
                errors that the dev server hides.
              </li>
            </ul>
          </section>

          <section id="database" className="scroll-mt-24">
            <h2>Database</h2>
            <p>
              A hosted Postgres database such as Supabase is already production-ready, so there is
              usually nothing to deploy — you point your backend at the same database it used in
              development, or create a second project for production.
            </p>
            <ul>
              <li>Use the connection string from the project dashboard, not one you assembled by hand.</li>
              <li>
                URL-encode special characters in the password. An <code>@</code> or <code>#</code> in
                a raw password silently breaks the connection string.
              </li>
              <li>
                Run your schema and seed scripts against the production database once, before the
                first deploy.
              </li>
            </ul>
          </section>

          <section id="backend" className="scroll-mt-24">
            <h2>Backend — Render or Railway</h2>
            <p>
              Both deploy a Node service straight from a GitHub repository, and the setup is much the
              same on either:
            </p>
            <ul>
              <li>Connect the repo and set the root directory to your server folder.</li>
              <li>
                Build command <code>npm install</code>, start command <code>npm start</code>.
              </li>
              <li>
                Listen on <code>process.env.PORT</code>. The platform assigns the port; a hard-coded
                one means the health check never passes.
              </li>
              <li>Add every environment variable from your local file, then deploy.</li>
              <li>
                Hit your health endpoint once it is live, and confirm the database check passes
                before touching the frontend.
              </li>
            </ul>
            <p>
              On a free tier the service sleeps when idle, so the first request after a quiet period
              can take many seconds. That is expected, not a bug in your code.
            </p>
          </section>

          <section id="frontend" className="scroll-mt-24">
            <h2>Frontend — Vercel</h2>
            <ul>
              <li>Import the repository and set the root directory to your client folder.</li>
              <li>
                Vercel detects Vite automatically: build <code>npm run build</code>, output{' '}
                <code>dist</code>.
              </li>
              <li>
                Add your <code>VITE_</code> variables in the project settings, including the public
                URL of the deployed API.
              </li>
              <li>
                Redeploy after changing any variable. Vite inlines these at build time, so a running
                deployment will not pick up a new value on its own.
              </li>
            </ul>
          </section>

          <section id="env" className="scroll-mt-24">
            <h2>Environment variables</h2>
            <p>
              Variables prefixed <code>VITE_</code> are compiled into the JavaScript that ships to
              the browser. Anyone can read them.
            </p>
            <ul>
              <li>
                <strong>Safe in the frontend:</strong> the API base URL, a project URL, a publishable
                or anon key.
              </li>
              <li>
                <strong>Backend only, always:</strong> database connection strings, service role
                keys, third-party API secrets.
              </li>
            </ul>
            <p>
              If a secret only works because nobody looked, it is already leaked. Route third-party
              API calls through your own backend so the key never reaches the browser.
            </p>
          </section>

          <section id="pitfalls" className="scroll-mt-24">
            <h2>Common pitfalls</h2>

            <h3>CORS errors after deploying</h3>
            <p>
              The browser blocks the request because your API does not list the deployed frontend as
              an allowed origin. Add the exact origin — scheme and host, with no trailing slash and
              no path — to the allowed list, then redeploy the backend. Preview deployments get their
              own URLs, so add those too if you test against them.
            </p>

            <h3>Works locally, 500s in production</h3>
            <p>
              Almost always a missing environment variable. Check the deploy logs first; a service
              that crashes on boot is usually one line about an undefined value.
            </p>

            <h3>Refreshing a route gives a 404</h3>
            <p>
              A single-page app serves every route from one HTML file. Vercel handles this for Vite
              projects out of the box; other static hosts need an explicit rewrite of all paths to{' '}
              <code>index.html</code>.
            </p>

            <h3>Auth redirects land on localhost</h3>
            <p>
              Add your production URL to the allowed redirect URLs in your auth provider, and set the
              site URL to the deployed frontend. Confirmation emails use these values.
            </p>

            <h3>The first request after a while is very slow</h3>
            <p>
              Free tiers sleep. Warn anyone you send the link to, or upgrade the service if it
              matters for a demo.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
