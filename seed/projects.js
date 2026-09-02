/**
 * The curated project library.
 *
 * Each entry:
 *   title, description, difficulty, est_hours, category, tech_stack (-> JSONB),
 *   career_goals (-> JSONB, drives quiz scoring - see server/src/lib/quiz.js),
 *   prerequisites, roadmap [{title, description}] (ordered), resources [{type, url, label}]
 *
 * Categories:   web-app | productivity | data-viz | dev-tools
 * Career goals: frontend | backend | fullstack | data | devops
 *
 * Resource links point at stable top-level documentation rather than individual
 * articles, which rot much faster.
 */

module.exports = [
  {
    title: 'Personal Budget Tracker',
    description:
      'A web app for logging income and expenses, categorising transactions, and visualising monthly spending with charts. Focuses on CRUD fundamentals and a first taste of data visualisation.',
    difficulty: 'beginner',
    est_hours: 15,
    category: 'web-app',
    tech_stack: ['React', 'Node.js', 'Express', 'PostgreSQL'],
    career_goals: ['fullstack', 'frontend'],
    prerequisites: 'Basic JavaScript, HTML/CSS. No prior full-stack experience required.',
    roadmap: [
      { title: 'Set up project structure', description: 'Scaffold a React frontend and an Express backend in separate folders; confirm they can talk to each other with a simple health-check endpoint.' },
      { title: 'Design the database schema', description: 'Create tables for transactions and categories; decide on fields like amount, date, type (income/expense), and category.' },
      { title: 'Build the CRUD API', description: 'Implement endpoints to create, read, update, and delete transactions.' },
      { title: 'Build the transaction list UI', description: 'Display transactions in a table with filtering by category and date range.' },
      { title: 'Add spending charts', description: 'Use a charting library to show monthly totals by category as a bar or pie chart.' },
    ],
    resources: [
      { type: 'doc', url: 'https://react.dev/learn', label: 'React official documentation' },
      { type: 'doc', url: 'https://expressjs.com/en/guide/routing.html', label: 'Express routing guide' },
      { type: 'doc', url: 'https://www.chartjs.org/docs/latest/', label: 'Chart.js documentation' },
    ],
  },
  {
    title: 'Recipe Sharing Platform',
    description:
      'A community-style app where users post recipes with ingredients and steps, search by ingredient or cuisine, and save favourites. Good practice for relational data modelling and search/filter UX.',
    difficulty: 'beginner',
    est_hours: 18,
    category: 'web-app',
    tech_stack: ['React', 'Node.js', 'Express', 'PostgreSQL'],
    career_goals: ['fullstack', 'backend'],
    prerequisites: 'Basic JavaScript and REST API concepts.',
    roadmap: [
      { title: 'Model recipes and ingredients', description: 'Design tables for recipes, ingredients, and a join table linking them with quantities.' },
      { title: 'Build recipe CRUD endpoints', description: 'Allow creating, editing, and deleting recipes along with their ingredient lists.' },
      { title: 'Implement search and filtering', description: 'Add query parameters for filtering by cuisine type or by ingredient.' },
      { title: 'Build the recipe detail page', description: 'Show the full ingredient list, the steps, and an estimated cook time.' },
      { title: 'Add a favourites feature', description: 'Let logged-in users save recipes to a personal list.' },
    ],
    resources: [
      { type: 'doc', url: 'https://www.postgresql.org/docs/current/tutorial.html', label: 'PostgreSQL tutorial' },
      { type: 'doc', url: 'https://expressjs.com/en/guide/routing.html', label: 'Express routing guide' },
    ],
  },
  {
    title: 'Real-Time Chat Application',
    description:
      'A multi-room chat app with live message delivery over WebSockets, typing indicators, and persisted history. Introduces real-time communication patterns that go beyond request/response.',
    difficulty: 'intermediate',
    est_hours: 25,
    category: 'web-app',
    tech_stack: ['React', 'Node.js', 'Express', 'Socket.IO', 'PostgreSQL'],
    career_goals: ['fullstack', 'backend'],
    prerequisites: 'Comfortable with React state and hooks, and with building a basic REST API.',
    roadmap: [
      { title: 'Set up the WebSocket server', description: 'Add Socket.IO to the Express backend and establish a basic connection with the client.' },
      { title: 'Implement chat rooms', description: 'Allow users to join named rooms and broadcast messages only within that room.' },
      { title: 'Persist message history', description: 'Store messages in PostgreSQL and load recent history when a user joins a room.' },
      { title: 'Add typing indicators', description: 'Emit and listen for typing events to show a "user is typing" hint in real time.' },
      { title: 'Handle reconnection and presence', description: 'Show which users are currently online and recover gracefully from disconnects.' },
    ],
    resources: [
      { type: 'doc', url: 'https://socket.io/docs/v4/', label: 'Socket.IO documentation' },
      { type: 'doc', url: 'https://react.dev/reference/react/useEffect', label: 'React useEffect reference' },
    ],
  },
  {
    title: 'Job Application Tracker',
    description:
      'A personal CRM for tracking job applications, their status, notes, and follow-up dates. A strong portfolio piece because it demonstrates practical CRUD alongside real authentication.',
    difficulty: 'beginner',
    est_hours: 14,
    category: 'productivity',
    tech_stack: ['React', 'Node.js', 'Express', 'PostgreSQL', 'Supabase Auth'],
    career_goals: ['fullstack', 'frontend'],
    prerequisites: 'Basic JavaScript. No prior authentication experience needed.',
    roadmap: [
      { title: 'Set up authentication', description: 'Wire up Supabase Auth for signup and login so applications are scoped to each user.' },
      { title: 'Model the applications table', description: 'Add fields for company, role, status, applied date, and free-form notes.' },
      { title: 'Build the status board', description: 'Display applications grouped by status, in the style of a Kanban board.' },
      { title: 'Add status transitions', description: 'Let users move an application between statuses and log each change with a timestamp.' },
      { title: 'Add follow-up reminders', description: 'Highlight applications whose follow-up date is approaching or already overdue.' },
    ],
    resources: [
      { type: 'doc', url: 'https://supabase.com/docs/guides/auth', label: 'Supabase Auth guide' },
      { type: 'doc', url: 'https://supabase.com/docs/reference/javascript/introduction', label: 'Supabase JS client reference' },
    ],
  },
  {
    title: 'Markdown Note-Taking App',
    description:
      'A notes app with markdown formatting, tagging, and full-text search, plus a live preview pane. A good introduction to text processing and to rendering user-generated content safely.',
    difficulty: 'beginner',
    est_hours: 16,
    category: 'productivity',
    tech_stack: ['React', 'Node.js', 'Express', 'PostgreSQL'],
    career_goals: ['fullstack', 'frontend'],
    prerequisites: 'Basic JavaScript and React components.',
    roadmap: [
      { title: 'Build the note editor', description: 'Create a split-pane editor with raw markdown on one side and the rendered preview on the other.' },
      { title: 'Implement markdown rendering', description: 'Use a markdown parsing library and sanitise the output so injected HTML cannot execute.' },
      { title: 'Add tagging', description: 'Allow notes to carry multiple tags and filter the note list by tag.' },
      { title: 'Add full-text search', description: 'Search across note titles and bodies using PostgreSQL text search.' },
      { title: 'Add autosave', description: 'Debounce edits and save automatically, with no explicit save button.' },
    ],
    resources: [
      { type: 'doc', url: 'https://www.postgresql.org/docs/current/textsearch.html', label: 'PostgreSQL full-text search' },
      { type: 'repo', url: 'https://github.com/markedjs/marked', label: 'Marked markdown parser' },
    ],
  },
  {
    title: 'Habit Tracker with Streaks',
    description:
      'An app for defining daily and weekly habits, checking them off, and visualising streaks and consistency on a calendar heatmap. Good practice for date logic and data aggregation.',
    difficulty: 'beginner',
    est_hours: 15,
    category: 'productivity',
    tech_stack: ['React', 'Node.js', 'Express', 'PostgreSQL'],
    career_goals: ['fullstack', 'frontend', 'data'],
    prerequisites: 'Basic JavaScript. Comfort with working with dates helps.',
    roadmap: [
      { title: 'Model habits and completions', description: 'Design tables for habits (name, frequency) and for daily completion records.' },
      { title: 'Build habit CRUD', description: 'Allow creating, editing, and archiving habits.' },
      { title: 'Implement the daily check-off', description: 'Let users mark a habit complete for the current day.' },
      { title: 'Calculate streaks', description: 'Write the logic that computes current and longest streaks from completion history.' },
      { title: 'Build a calendar heatmap', description: 'Visualise completions over recent months, in the style of a contribution graph.' },
    ],
    resources: [
      { type: 'doc', url: 'https://day.js.org/docs/en/installation/installation', label: 'Day.js documentation' },
      { type: 'doc', url: 'https://recharts.org/en-US/', label: 'Recharts documentation' },
    ],
  },
  {
    title: 'E-Commerce Product Catalog',
    description:
      'A storefront with a browsable catalog, a cart, and a mock checkout flow (no real payments). Covers the state-management patterns that show up in almost every commercial frontend.',
    difficulty: 'intermediate',
    est_hours: 28,
    category: 'web-app',
    tech_stack: ['React', 'Node.js', 'Express', 'PostgreSQL'],
    career_goals: ['fullstack', 'frontend'],
    prerequisites: 'Solid React fundamentals and some experience with shared state (Context or similar).',
    roadmap: [
      { title: 'Model products and variants', description: 'Design a schema that supports products with variants such as size and colour.' },
      { title: 'Build the catalog and filters', description: 'Browse, filter, and sort products by category, price, and availability.' },
      { title: 'Implement the cart', description: 'Add and remove items, adjust quantities, and keep cart state across page reloads.' },
      { title: 'Build a mock checkout', description: 'Collect shipping details and simulate an order confirmation, with no real payment processing.' },
      { title: 'Add order history', description: 'Let logged-in users review their past mock orders.' },
    ],
    resources: [
      { type: 'doc', url: 'https://react.dev/learn/scaling-up-with-reducer-and-context', label: 'React: reducer and context' },
      { type: 'doc', url: 'https://react.dev/learn/managing-state', label: 'React: managing state' },
    ],
  },
  {
    title: 'Weather Dashboard with Saved Locations',
    description:
      'A dashboard that pulls live weather from a public API, lets users save favourite locations, and compares forecasts side by side. Introduces third-party APIs and keeping API keys off the client.',
    difficulty: 'beginner',
    est_hours: 12,
    category: 'data-viz',
    tech_stack: ['React', 'Node.js', 'Express'],
    career_goals: ['frontend', 'data'],
    prerequisites: 'Basic JavaScript and async requests with fetch.',
    roadmap: [
      { title: 'Connect to a weather API', description: 'Proxy requests through the Express backend so any API key stays server-side.' },
      { title: 'Build the current conditions view', description: 'Search for a location and display current temperature, conditions, and forecast.' },
      { title: 'Add saved locations', description: 'Let users save several locations and switch between them.' },
      { title: 'Build a comparison view', description: 'Show saved locations side by side for a quick comparison.' },
      { title: 'Handle loading and errors', description: 'Deal with API failures and rate limits gracefully in the UI.' },
    ],
    resources: [
      { type: 'doc', url: 'https://open-meteo.com/en/docs', label: 'Open-Meteo API docs (no key required)' },
      { type: 'doc', url: 'https://expressjs.com/en/guide/error-handling.html', label: 'Express error handling' },
    ],
  },
  {
    title: 'Kanban Project Board',
    description:
      'A drag-and-drop board with boards, lists, and cards. A serious exercise in complex UI state, drag-and-drop interaction, and optimistic updates.',
    difficulty: 'intermediate',
    est_hours: 24,
    category: 'productivity',
    tech_stack: ['React', 'Node.js', 'Express', 'PostgreSQL'],
    career_goals: ['frontend', 'fullstack'],
    prerequisites: 'Solid React fundamentals and comfort with nested state updates.',
    roadmap: [
      { title: 'Model boards, lists, and cards', description: 'Design a schema for ordered lists within boards and ordered cards within lists.' },
      { title: 'Build the board UI', description: 'Render lists side by side with their cards inside.' },
      { title: 'Add drag-and-drop', description: 'Support dragging cards between lists and reordering within a list.' },
      { title: 'Persist ordering changes', description: 'Sync each drag to the backend using optimistic UI updates.' },
      { title: 'Add card details', description: 'Support descriptions, due dates, and labels on individual cards.' },
    ],
    resources: [
      { type: 'doc', url: 'https://docs.dndkit.com/', label: 'dnd kit drag-and-drop toolkit' },
      { type: 'doc', url: 'https://react.dev/learn/updating-arrays-in-state', label: 'React: updating arrays in state' },
    ],
  },
  {
    title: 'Expense-Splitting App',
    description:
      'A group expense tracker that logs shared costs and works out who owes whom. The balance and debt-simplification logic gives this real algorithmic substance on top of standard CRUD.',
    difficulty: 'intermediate',
    est_hours: 22,
    category: 'web-app',
    tech_stack: ['React', 'Node.js', 'Express', 'PostgreSQL', 'Supabase Auth'],
    career_goals: ['backend', 'fullstack'],
    prerequisites: 'Comfortable with relational data modelling and basic algorithmic thinking.',
    roadmap: [
      { title: 'Model groups, members, and expenses', description: 'Design a schema for groups, membership, and expenses with a payer and a set of participants.' },
      { title: 'Build expense entry', description: 'Let users log an expense, record who paid, and choose an equal or custom split.' },
      { title: 'Implement balance calculation', description: 'Write the logic that computes net balances between every pair of members.' },
      { title: 'Simplify debts', description: 'Reduce the number of transfers needed to settle everyone up.' },
      { title: 'Build the settle-up view', description: 'Present a clear summary of who should pay whom, and how much.' },
    ],
    resources: [
      { type: 'doc', url: 'https://www.postgresql.org/docs/current/queries.html', label: 'PostgreSQL queries documentation' },
      { type: 'doc', url: 'https://supabase.com/docs/guides/auth', label: 'Supabase Auth guide' },
    ],
  },
  {
    title: 'Developer Portfolio CMS',
    description:
      'A portfolio site backed by a small content management system, so its owner can publish projects and posts without touching code. Good practice for building admin-style CRUD interfaces.',
    difficulty: 'beginner',
    est_hours: 16,
    category: 'web-app',
    tech_stack: ['React', 'Node.js', 'Express', 'PostgreSQL', 'Supabase Auth'],
    career_goals: ['fullstack', 'frontend'],
    prerequisites: 'Basic JavaScript and React. No prior CMS experience needed.',
    roadmap: [
      { title: 'Model the content types', description: 'Design tables for projects and blog posts with title, body, tags, and publish status.' },
      { title: 'Build the admin interface', description: 'Create a protected area for writing and editing content.' },
      { title: 'Build the public pages', description: 'Render published content on the public portfolio and blog pages.' },
      { title: 'Add image uploads', description: 'Support uploading and displaying cover images for projects and posts.' },
      { title: 'Add a draft and publish workflow', description: 'Let content be saved as a draft before it goes public.' },
    ],
    resources: [
      { type: 'doc', url: 'https://supabase.com/docs/guides/storage', label: 'Supabase Storage guide' },
      { type: 'doc', url: 'https://react.dev/learn/thinking-in-react', label: 'Thinking in React' },
    ],
  },
  {
    title: 'Open Data Explorer',
    description:
      'A dashboard that ingests a public dataset, cleans it, and lets visitors filter and chart it interactively. The work sits in the data pipeline and the query layer as much as in the UI.',
    difficulty: 'intermediate',
    est_hours: 20,
    category: 'data-viz',
    tech_stack: ['React', 'Node.js', 'Express', 'PostgreSQL', 'D3'],
    career_goals: ['data', 'frontend'],
    prerequisites: 'Basic SQL and comfort manipulating arrays and objects in JavaScript.',
    roadmap: [
      { title: 'Pick and import a dataset', description: 'Choose a public CSV dataset and write a script that loads it into PostgreSQL.' },
      { title: 'Clean and normalise the data', description: 'Handle missing values, inconsistent labels, and type conversion during import.' },
      { title: 'Build the aggregation API', description: 'Expose endpoints that group and filter server-side rather than shipping every row to the browser.' },
      { title: 'Build interactive charts', description: 'Render the aggregates as charts that update as filters change.' },
      { title: 'Add cross-filtering', description: 'Let a selection in one chart narrow the others, and reflect that state in the URL.' },
    ],
    resources: [
      { type: 'doc', url: 'https://d3js.org/', label: 'D3 documentation' },
      { type: 'doc', url: 'https://www.postgresql.org/docs/current/functions-aggregate.html', label: 'PostgreSQL aggregate functions' },
      { type: 'doc', url: 'https://data.gov/', label: 'Data.gov open datasets' },
    ],
  },
  {
    title: 'CI/CD Pipeline for a Web App',
    description:
      'Take a web app you have already built and give it a real delivery pipeline: containerised builds, automated tests on every push, and an automatic deploy on merge. The deliverable is the infrastructure, not another UI.',
    difficulty: 'intermediate',
    est_hours: 18,
    category: 'dev-tools',
    tech_stack: ['Docker', 'GitHub Actions', 'Node.js'],
    career_goals: ['devops', 'backend'],
    prerequisites: 'A web app you have already built, and basic command-line comfort.',
    roadmap: [
      { title: 'Containerise the app', description: 'Write a Dockerfile that builds and runs the app, and verify it locally.' },
      { title: 'Add a test stage', description: 'Create a workflow that installs dependencies and runs the test suite on every push.' },
      { title: 'Add a build stage', description: 'Build the container image in CI and publish it to a registry.' },
      { title: 'Automate deployment', description: 'Deploy automatically when the main branch passes, using repository secrets for credentials.' },
      { title: 'Add environments and rollback', description: 'Separate staging from production and document how to roll back a bad release.' },
    ],
    resources: [
      { type: 'doc', url: 'https://docs.docker.com/get-started/', label: 'Docker getting started' },
      { type: 'doc', url: 'https://docs.github.com/en/actions', label: 'GitHub Actions documentation' },
    ],
  },
  {
    title: 'CLI Task Runner with Web Dashboard',
    description:
      'A tool for defining and running repeatable command-line tasks, with a lightweight dashboard showing run history and live logs. Bridges backend tooling and a monitoring-style interface.',
    difficulty: 'advanced',
    est_hours: 30,
    category: 'dev-tools',
    tech_stack: ['Node.js', 'Express', 'React', 'PostgreSQL'],
    career_goals: ['devops', 'backend'],
    prerequisites: 'Comfortable with Node.js child processes and building full-stack apps end to end.',
    roadmap: [
      { title: 'Design the task format', description: 'Decide how a task, with its name, command, and schedule, is defined and stored.' },
      { title: 'Implement task execution', description: 'Use Node child processes to run tasks and capture stdout and stderr.' },
      { title: 'Persist run history', description: 'Store the status, duration, and output of every run in PostgreSQL.' },
      { title: 'Build the dashboard', description: 'List tasks and recent runs, and stream logs for runs still in progress.' },
      { title: 'Add manual and scheduled triggers', description: 'Support running a task on demand or on a defined schedule.' },
    ],
    resources: [
      { type: 'doc', url: 'https://nodejs.org/api/child_process.html', label: 'Node.js child_process documentation' },
      { type: 'doc', url: 'https://nodejs.org/api/events.html', label: 'Node.js events documentation' },
    ],
  },
];
