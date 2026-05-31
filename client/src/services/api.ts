const API_BASE = '/api';

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  auth: {
    register: (body: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request('/auth/me'),
  },
  skills: {
    getAll: () => request('/skills'),
    getUserSkills: (userId?: string) => request(`/skills/user/${userId || ''}`),
    updateUserSkills: (skillIds: string[], proficiency?: number) =>
      request('/skills/user', { method: 'POST', body: JSON.stringify({ skillIds, proficiency }) }),
  },
  users: {
    getProfile: (userId: string) => request(`/users/profile/${userId}`),
    updateProfile: (body: any) => request('/users/profile', { method: 'PUT', body: JSON.stringify(body) }),
  },
  matching: {
    getRecommendations: () => request('/matching/recommendations'),
    search: (query: string) => request(`/matching/search?q=${encodeURIComponent(query)}`),
  },
  sessions: {
    create: (body: any) => request('/sessions', { method: 'POST', body: JSON.stringify(body) }),
    getAll: () => request('/sessions'),
    get: (id: string) => request(`/sessions/${id}`),
    end: (id: string) => request(`/sessions/${id}/end`, { method: 'POST' }),
  },
  messages: {
    get: (sessionId: string) => request(`/messages/${sessionId}`),
    send: (sessionId: string, content: string, type = 'text') =>
      request(`/messages/${sessionId}`, { method: 'POST', body: JSON.stringify({ content, type }) }),
  },
};
