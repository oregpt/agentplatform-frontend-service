import axios from 'axios'
import { getAuth } from 'firebase/auth'

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
  getAll: (organizationId) => {
    // If organizationId is provided, add it as a query parameter
    // Ensure organizationId is a string
    const orgId = organizationId ? String(organizationId) : ''
    const url = orgId ? `/agents?organization_id=${orgId}` : '/agents'
    return api.get(url)
  },
  getById: (id) => api.get(`/agents/${id}`),
  create: (data) => api.post('/agents', data),
  update: (id, data) => api.put(`/agents/${id}`, data),
  delete: (id) => api.delete(`/agents/${id}`)
}

// Files API
export const filesApi = {
  getAll: (agentId) => api.get(`/files/agent/${agentId}`),
  getAllByOrganization: (organizationId) => {
    // If organizationId is provided, add it as a query parameter
    // Ensure organizationId is a string
    const orgId = organizationId ? String(organizationId) : ''
    const url = orgId ? `/files/organization?organization_id=${orgId}` : '/files/organization'
    return api.get(url)
  },
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
  getAll: (organizationId) => {
    // If organizationId is provided, add it as a query parameter
    // Ensure organizationId is a string
    const orgId = organizationId ? String(organizationId) : ''
    const url = orgId ? `/users?organization_id=${orgId}` : '/users'
    return api.get(url)
  },
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
  async (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    
    // Get token from localStorage (set by auth store)
    let token = localStorage.getItem('authToken')
    
    // If no token in localStorage but Firebase user exists, try to get a fresh token
    if (!token) {
      const auth = getAuth()
      if (auth.currentUser) {
        try {
          console.log('No token in localStorage but user is logged in, attempting to get fresh token')
          // Try to get a fresh Firebase token
          const firebaseToken = await auth.currentUser.getIdToken(true)
          
          // Get auth service URL from environment
          const authApiUrl = import.meta.env.VITE_AUTH_API_URL
          
          // Exchange for JWT
          const response = await axios.post(`${authApiUrl}/api/v1/auth/generate-jwt`, {
            firebase_token: firebaseToken,
            organization_id: ''
          })
          
          // Save the token
          token = response.data.token
          localStorage.setItem('authToken', token)
          console.log('Successfully obtained fresh token')
        } catch (error) {
          console.error('Failed to get fresh token:', error)
        }
      }
    }
    
    if (token) {
      console.log('Adding auth token to request')
      config.headers['Authorization'] = `Bearer ${token}`
    } else {
      console.warn('No auth token available for API request')
    }
    
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Intercept responses to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`)
    return response
  },
  (error) => {
    if (error.response) {
      console.error(`API Error ${error.response.status}: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response.data)
      
      if (error.response.status === 401) {
        console.warn('Unauthorized API request - token may be invalid')
        
        // Get Firebase auth instance
        const auth = getAuth()
        
        // Check if user is still logged in with Firebase
        if (auth.currentUser) {
          console.log('Still logged in with Firebase, refreshing token...')
          // Try to refresh token
          auth.currentUser.getIdToken(true)
            .then(newToken => {
              console.log('Token refreshed successfully')
              localStorage.setItem('authToken', newToken)
            })
            .catch(refreshError => {
              console.error('Failed to refresh token:', refreshError)
              // Force logout on token refresh failure
              auth.signOut().then(() => {
                window.location.href = '/login'
              })
            })
        } else {
          // Not logged in with Firebase, redirect to login
          window.location.href = '/login'
        }
      }
    } else {
      console.error('API request failed:', error.message)
    }
    
    return Promise.reject(error)
  }
)

export default api
