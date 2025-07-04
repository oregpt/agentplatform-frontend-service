import axios from 'axios'

// Base API configuration
const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Organizations API
export const organizationsApi = {
  getAll: () => api.get('/organizations'),
  getById: (id) => api.get(`/organizations/${id}`),
  create: (data) => api.post('/organizations', data),
  update: (id, data) => api.put(`/organizations/${id}`, data),
  delete: (id) => api.delete(`/organizations/${id}`)
}

// Agents API
export const agentsApi = {
  getAll: (orgId) => api.get(`/organizations/${orgId}/agents`),
  getById: (id) => api.get(`/agents/${id}`),
  create: (data) => api.post('/agents', data),
  update: (id, data) => api.put(`/agents/${id}`, data),
  delete: (id) => api.delete(`/agents/${id}`)
}

// Files API
export const filesApi = {
  getAll: (agentId) => api.get(`/agents/${agentId}/files`),
  getById: (id) => api.get(`/files/${id}`),
  upload: (agentId, formData) => api.post(`/agents/${agentId}/files`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  download: (id) => api.get(`/files/${id}/download`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/files/${id}`)
}

// Users API
export const usersApi = {
  getAll: (orgId) => api.get(`/organizations/${orgId}/users`),
  getById: (orgId, userId) => api.get(`/organizations/${orgId}/users/${userId}`),
  create: (orgId, data) => api.post(`/organizations/${orgId}/users`, data),
  update: (orgId, userId, data) => api.put(`/organizations/${orgId}/users/${userId}`, data),
  delete: (orgId, userId) => api.delete(`/organizations/${orgId}/users/${userId}`)
}

// User-Agent API
export const userAgentApi = {
  assignUserToAgent: (userId, agentId) => api.post(`/users/${userId}/agents/${agentId}`),
  removeUserFromAgent: (userId, agentId) => api.delete(`/users/${userId}/agents/${agentId}`),
  getUserAgents: (userId) => api.get(`/users/${userId}/agents`)
}

// Intercept requests to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercept responses to handle common errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
