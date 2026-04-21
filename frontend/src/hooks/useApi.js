// src/hooks/useApi.js
const BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = {
  async request(method, endpoint, data = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || json.errors?.[0]?.msg || 'Request failed');
    return json;
  },
  get: (endpoint, token) => api.request('GET', endpoint, null, token),
  post: (endpoint, data, token) => api.request('POST', endpoint, data, token),
  patch: (endpoint, data, token) => api.request('PATCH', endpoint, data, token),
  delete: (endpoint, token) => api.request('DELETE', endpoint, null, token),
};

export default api;
