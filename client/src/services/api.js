import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const trees = {
  list: () => api.get('/trees'),
  create: (name) => api.post('/trees', { name }),
  get: (id) => api.get(`/trees/${id}`),
  delete: (id) => api.delete(`/trees/${id}`),
};

export const members = {
  list: (treeId) => api.get(`/members/${treeId}`),
  add: (treeId, formData) => api.post(`/members/${treeId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (treeId, memberId, formData) => api.put(`/members/${treeId}/${memberId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (treeId, memberId) => api.delete(`/members/${treeId}/${memberId}`),
  addRelationship: (treeId, data) => api.post(`/members/${treeId}/relationship`, data),
  removeRelationship: (treeId, relId) => api.delete(`/members/${treeId}/relationship/${relId}`),
};

export const invites = {
  create: (treeId, memberId) => api.post(`/invites/${treeId}`, { member_id: memberId }),
  getByCode: (code) => api.get(`/invites/code/${code}`),
  join: (code) => api.post(`/invites/join/${code}`),
  listForTree: (treeId) => api.get(`/invites/tree/${treeId}`),
};

export default api;
