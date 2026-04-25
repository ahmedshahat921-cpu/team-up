import { BACKEND_URL } from './supabase';

const getToken = () => localStorage.getItem('teamup_token');

const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
};

export const api = {
  get: (path) => fetch(`${BACKEND_URL}${path}`, { headers: headers() }).then(handleResponse),
  post: (path, body) => fetch(`${BACKEND_URL}${path}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handleResponse),
  put: (path, body) => fetch(`${BACKEND_URL}${path}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) }).then(handleResponse),
  patch: (path, body) => fetch(`${BACKEND_URL}${path}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) }).then(handleResponse),
  delete: (path) => fetch(`${BACKEND_URL}${path}`, { method: 'DELETE', headers: headers() }).then(handleResponse),
  upload: (path, formData) => fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: formData,
  }).then(handleResponse),
};
