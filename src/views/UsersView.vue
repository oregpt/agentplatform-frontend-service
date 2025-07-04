<template>
  <div class="users-container">
    <div class="header">
      <h1>Users</h1>
      <button @click="showCreateModal = true" class="create-btn">Add User</button>
    </div>

    <div class="organization-selector" v-if="organizations.length > 0">
      <label for="organization">Organization:</label>
      <select id="organization" v-model="selectedOrgId" @change="fetchUsers">
        <option v-for="org in organizations" :key="org.id" :value="org.id">
          {{ org.name }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="loading">Loading users...</div>
    
    <div v-else-if="users.length === 0" class="empty-state">
      <p>No users found in this organization. Add users to get started.</p>
      <button @click="showCreateModal = true" class="create-btn">Add User</button>
    </div>
    
    <div v-else class="users-list">
      <div v-for="user in users" :key="user.id" class="user-card">
        <div class="user-info">
          <h2>{{ user.displayName || user.email }}</h2>
          <p class="user-email">{{ user.email }}</p>
          <p class="user-role">Role: {{ user.role || 'User' }}</p>
        </div>
        <div class="user-stats">
          <div class="stat">
            <span class="stat-label">Agents</span>
            <span class="stat-value">{{ user.agentsCount || 0 }}</span>
          </div>
        </div>
        <div class="user-actions">
          <button @click="manageAgents(user)" class="agents-btn">Manage Agents</button>
          <button @click="editUser(user)" class="edit-btn">Edit</button>
          <button @click="confirmDelete(user)" class="delete-btn">Remove</button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || showEditModal" class="modal-backdrop">
      <div class="modal">
        <h2>{{ showEditModal ? 'Edit User' : 'Add User' }}</h2>
        <form @submit.prevent="showEditModal ? updateUser() : createUser()">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              v-model="formData.email" 
              required 
              placeholder="Enter user email"
              :disabled="showEditModal"
            />
          </div>
          
          <div class="form-group">
            <label for="displayName">Display Name (Optional)</label>
            <input 
              type="text" 
              id="displayName" 
              v-model="formData.displayName" 
              placeholder="Enter display name"
            />
          </div>
          
          <div class="form-group">
            <label for="role">Role</label>
            <select id="role" v-model="formData.role">
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="cancel-btn">Cancel</button>
            <button type="submit" class="submit-btn">
              {{ showEditModal ? 'Update' : 'Add' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Manage Agents Modal -->
    <div v-if="showAgentsModal" class="modal-backdrop">
      <div class="modal">
        <h2>Manage Agents for {{ selectedUser.displayName || selectedUser.email }}</h2>
        
        <div v-if="loadingAgents" class="loading-agents">Loading agents...</div>
        
        <div v-else-if="availableAgents.length === 0" class="empty-agents">
          No agents available in this organization.
        </div>
        
        <div v-else class="agent-assignments">
          <div v-for="agent in availableAgents" :key="agent.id" class="agent-assignment-item">
            <div class="agent-info">
              <h3>{{ agent.name }}</h3>
              <p v-if="agent.description">{{ agent.description }}</p>
            </div>
            <div class="assignment-toggle">
              <label class="switch">
                <input 
                  type="checkbox" 
                  :checked="isAgentAssigned(agent.id)" 
                  @change="toggleAgentAssignment(agent.id)"
                />
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closeAgentsModal" class="done-btn">Done</button>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-backdrop">
      <div class="modal">
        <h2>Remove User</h2>
        <p>Are you sure you want to remove <strong>{{ selectedUser.email }}</strong> from this organization?</p>
        <p class="warning">This action will remove the user's access to all agents in this organization.</p>
        
        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="cancel-btn">Cancel</button>
          <button @click="deleteUser" class="delete-btn">Remove</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { organizationsApi, agentsApi, usersApi, userAgentApi } from '../services/api'

const authStore = useAuthStore()
const organizations = ref([])
const users = ref([])
const availableAgents = ref([])
const assignedAgentIds = ref([])
const loading = ref(true)
const loadingAgents = ref(false)
const selectedOrgId = ref('')
const selectedUser = ref({})
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showAgentsModal = ref(false)
const formData = ref({
  email: '',
  displayName: '',
  role: 'user'
})

onMounted(async () => {
  await fetchOrganizations()
  if (authStore.organizationId) {
    selectedOrgId.value = authStore.organizationId
    await fetchUsers()
  }
})

async function fetchOrganizations() {
  try {
    const response = await organizationsApi.getAll()
    organizations.value = response.data
    
    // If user has an organization ID set in auth store, use that
    if (authStore.organizationId && !selectedOrgId.value) {
      selectedOrgId.value = authStore.organizationId
    } 
    // Otherwise use the first organization if available
    else if (organizations.value.length > 0 && !selectedOrgId.value) {
      selectedOrgId.value = organizations.value[0].id
    }
  } catch (error) {
    console.error('Error fetching organizations:', error)
  }
}

async function fetchUsers() {
  if (!selectedOrgId.value) return
  
  loading.value = true
  try {
    const response = await usersApi.getAll(selectedOrgId.value)
    users.value = response.data
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    loading.value = false
  }
}

function editUser(user) {
  selectedUser.value = user
  formData.value = {
    email: user.email,
    displayName: user.displayName || '',
    role: user.role || 'user'
  }
  showEditModal.value = true
}

function confirmDelete(user) {
  selectedUser.value = user
  showDeleteModal.value = true
}

async function manageAgents(user) {
  selectedUser.value = user
  showAgentsModal.value = true
  loadingAgents.value = true
  
  try {
    // Fetch all agents in the organization
    const agentsResponse = await agentsApi.getAll(selectedOrgId.value)
    availableAgents.value = agentsResponse.data
    
    // Fetch agents assigned to this user
    const userAgentsResponse = await userAgentApi.getUserAgents(user.id)
    assignedAgentIds.value = userAgentsResponse.data.map(agent => agent.id)
  } catch (error) {
    console.error('Error fetching agents:', error)
  } finally {
    loadingAgents.value = false
  }
}

function isAgentAssigned(agentId) {
  return assignedAgentIds.value.includes(agentId)
}

async function toggleAgentAssignment(agentId) {
  const isAssigned = isAgentAssigned(agentId)
  
  try {
    if (isAssigned) {
      // Remove agent assignment
      await userAgentApi.removeUserFromAgent(selectedUser.value.id, agentId)
      assignedAgentIds.value = assignedAgentIds.value.filter(id => id !== agentId)
    } else {
      // Add agent assignment
      await userAgentApi.assignUserToAgent(selectedUser.value.id, agentId)
      assignedAgentIds.value.push(agentId)
    }
  } catch (error) {
    console.error('Error updating agent assignment:', error)
    // Revert the UI change if the API call fails
    if (!isAssigned) {
      assignedAgentIds.value = assignedAgentIds.value.filter(id => id !== agentId)
    } else {
      assignedAgentIds.value.push(agentId)
    }
  }
}

async function createUser() {
  if (!selectedOrgId.value) {
    alert('Please select an organization first')
    return
  }
  
  try {
    await usersApi.create(selectedOrgId.value, formData.value)
    await fetchUsers()
    closeModal()
  } catch (error) {
    console.error('Error creating user:', error)
    alert('Error creating user: ' + error.message)
  }
}

async function updateUser() {
  try {
    await usersApi.update(selectedOrgId.value, selectedUser.value.id, formData.value)
    await fetchUsers()
    closeModal()
  } catch (error) {
    console.error('Error updating user:', error)
    alert('Error updating user: ' + error.message)
  }
}

async function deleteUser() {
  try {
    await usersApi.delete(selectedOrgId.value, selectedUser.value.id)
    await fetchUsers()
    showDeleteModal.value = false
  } catch (error) {
    console.error('Error deleting user:', error)
    alert('Error removing user: ' + error.message)
  }
}

function closeModal() {
  showCreateModal.value = false
  showEditModal.value = false
  formData.value = {
    email: '',
    displayName: '',
    role: 'user'
  }
  selectedUser.value = {}
}

function closeAgentsModal() {
  showAgentsModal.value = false
  availableAgents.value = []
  assignedAgentIds.value = []
}
</script>

<style scoped>
.users-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.organization-selector {
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.organization-selector select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  min-width: 200px;
}

.create-btn {
  background-color: #2c3e50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.create-btn:hover {
  background-color: #1a2530;
}

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-state p {
  margin-bottom: 20px;
  color: #7f8c8d;
}

.users-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.user-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.user-info h2 {
  margin: 0 0 5px 0;
  color: #2c3e50;
}

.user-email {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 0 0 5px 0;
}

.user-role {
  color: #3498db;
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0;
}

.user-stats {
  display: flex;
  gap: 20px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
}

.user-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
  flex-wrap: wrap;
}

.agents-btn, .edit-btn, .delete-btn {
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  font-size: 0.9rem;
}

.agents-btn {
  background-color: #3498db;
  color: white;
}

.agents-btn:hover {
  background-color: #2980b9;
}

.edit-btn {
  background-color: #f39c12;
  color: white;
}

.edit-btn:hover {
  background-color: #d35400;
}

.delete-btn {
  background-color: #e74c3c;
  color: white;
}

.delete-btn:hover {
  background-color: #c0392b;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal {
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn, .done-btn {
  background-color: #95a5a6;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.done-btn {
  background-color: #2c3e50;
}

.submit-btn {
  background-color: #2c3e50;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.warning {
  color: #e74c3c;
  font-weight: 500;
}

.loading-agents, .empty-agents {
  text-align: center;
  padding: 20px;
  color: #7f8c8d;
}

.agent-assignments {
  margin: 20px 0;
  max-height: 400px;
  overflow-y: auto;
}

.agent-assignment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.agent-assignment-item:last-child {
  border-bottom: none;
}

.agent-info h3 {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
}

.agent-info p {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

/* Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2ecc71;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2ecc71;
}

input:checked + .slider:before {
  transform: translateX(26px);
}
</style>
