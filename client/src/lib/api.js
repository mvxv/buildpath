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

export const api = {
  getMeta: () => request('/api/projects/meta'),

  getProjects: (filters = {}) => {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, value]) => value !== '' && value != null)
    );
    const query = params.toString();
    return request(`/api/projects${query ? `?${query}` : ''}`);
  },

  getProject: (id) => request(`/api/projects/${id}`),

  getQuizOptions: () => request('/api/quiz/options'),
  matchProjects: (answers) => request('/api/quiz/match', { method: 'POST', body: answers }),

  getProfile: () => request('/api/profile', { auth: true }),
  updateProfile: (body) => request('/api/profile', { method: 'PUT', body, auth: true }),

  getSavedProjects: () => request('/api/user-projects', { auth: true }),
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
