import axios from 'axios'

// Get API base URL from environment variables or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

console.log('API Base URL:', API_BASE_URL)

// Base API configuration
const api = axios.create({
  baseURL: API_BASE_URL,
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
  getAll: () => api.get('/agents'),
  getById: (id) => api.get(`/agents/${id}`),
  create: (data) => api.post('/agents', data),
  update: (id, data) => api.put(`/agents/${id}`, data),
  delete: (id) => api.delete(`/agents/${id}`)
}

// Files API
export const filesApi = {
  getAll: (agentId) => api.get(`/files/agent/${agentId}`),
  getById: (id) => api.get(`/files/${id}`),
  upload: (agentId, formData) => api.post(`/files/agent/${agentId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  download: (id) => api.get(`/files/${id}/download`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/files/${id}`)
}

// Users API
export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (userId) => api.get(`/users/${userId}`),
  create: (data) => api.post('/users', data),
  update: (userId, data) => api.put(`/users/${userId}`, data),
  delete: (userId) => api.delete(`/users/${userId}`)
}

// User-Agent API
export const userAgentApi = {
  assignUserToAgent: (userId, agentId) => api.post('/users/assign', { userId, agentId }),
  removeUserFromAgent: (userId, agentId) => api.delete(`/users/by-id/${userId}/agents/${agentId}`),
  getUserAgents: (userId) => api.get(`/users/by-id/${userId}/agents`)
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
