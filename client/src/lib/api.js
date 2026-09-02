import { supabase } from './supabase';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function authHeader() {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { ...(body ? { 'Content-Type': 'application/json' } : {}) };
  if (auth) Object.assign(headers, await authHeader());

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch only rejects on network-level failures, which almost always means the
    // API is not running or CORS blocked the request before it was sent.
    throw new ApiError(
      `Could not reach the API at ${BASE_URL}. Is the server running?`,
      0
    );
  }

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(payload?.error || `Request failed (${response.status})`, response.status);
  }

  return payload;
}

/**
 * Filter options and quiz choices change only when the library is reseeded, but
 * three separate pages need them. Holding the in-flight promise means a session
 * fetches each once, and pages that mount together share one request rather than
 * racing to make their own.
 */
const memo = new Map();
const once = (key, load) => {
  if (!memo.has(key)) {
    memo.set(
      key,
      load().catch((err) => {
        memo.delete(key); // A failure must not be cached, or retrying is pointless.
        throw err;
      })
    );
  }
  return memo.get(key);
};

export const api = {
  getMeta: () => once('meta', () => request('/api/projects/meta')),

  getProjects: (filters = {}) => {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, value]) => value !== '' && value != null)
    );
    const query = params.toString();
    return request(`/api/projects${query ? `?${query}` : ''}`);
  },

  getProject: (id) => request(`/api/projects/${id}`),

  getQuizOptions: () => once('quiz-options', () => request('/api/quiz/options')),
  matchProjects: (answers) => request('/api/quiz/match', { method: 'POST', body: answers }),

  getProfile: () => request('/api/profile', { auth: true }),
  updateProfile: (body) => request('/api/profile', { method: 'PUT', body, auth: true }),

  getSavedProjects: () => request('/api/user-projects', { auth: true }),

  /** Whether this project is already saved, without pulling the whole list. */
  getSavedProjectFor: async (projectId) => {
    const rows = await request(`/api/user-projects?project_id=${projectId}`, { auth: true });
    return rows[0] || null;
  },
  getSavedProject: (id) => request(`/api/user-projects/${id}`, { auth: true }),
  saveProject: (projectId) =>
    request('/api/user-projects', { method: 'POST', body: { project_id: projectId }, auth: true }),
  unsaveProject: (id) => request(`/api/user-projects/${id}`, { method: 'DELETE', auth: true }),

  setStepProgress: ({ userProjectId, roadmapStepId, completed }) =>
    request('/api/user-progress', {
      method: 'POST',
      auth: true,
      body: {
        user_project_id: userProjectId,
        roadmap_step_id: roadmapStepId,
        completed,
      },
    }),
};
