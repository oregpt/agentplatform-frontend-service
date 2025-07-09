import api from './api'

export default {
  // Get all organizations for a user
  getUserOrgs(userId) {
    return api.get(`/users/by-id/${userId}/organizations`)
  },
  
  // Add a user to an organization
  addUserToOrg(userId, orgId, data = {}) {
    return api.post(`/users/by-id/${userId}/organizations/${orgId}`, data)
  },
  
  // Remove a user from an organization
  removeUserFromOrg(userId, orgId) {
    return api.delete(`/users/by-id/${userId}/organizations/${orgId}`)
  },
  
  // Update a user's role in an organization
  updateUserOrgRole(userId, orgId, data) {
    return api.put(`/users/by-id/${userId}/organizations/${orgId}/role`, data)
  }
}
