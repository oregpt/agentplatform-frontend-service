<template>
  <div class="agent-detail-container">
    <div v-if="loading" class="loading">Loading agent details...</div>
    
    <div v-else-if="!agent.id" class="not-found">
      <h2>Agent Not Found</h2>
      <p>The agent you are looking for does not exist or has been deleted.</p>
      <router-link to="/agents" class="back-link">Back to Agents</router-link>
    </div>
    
    <div v-else class="agent-detail">
      <div class="header">
        <div class="title-section">
          <h1>{{ agent.name }}</h1>
          <span class="agent-id">ID: {{ agent.id }}</span>
        </div>
        <div class="actions">
          <router-link :to="`/agents/${agent.id}/files`" class="files-btn">
            Manage Files
          </router-link>
          <button @click="showEditModal = true" class="edit-btn">Edit Agent</button>
        </div>
      </div>
      
      <div class="agent-content">
        <div class="agent-info-card">
          <h2>Agent Information</h2>
          <div class="info-row">
            <span class="label">Organization:</span>
            <span class="value">{{ organizationName }}</span>
          </div>
          <div class="info-row">
            <span class="label">Created:</span>
            <span class="value">{{ formatDate(agent.createdAt) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Last Updated:</span>
            <span class="value">{{ formatDate(agent.updatedAt) }}</span>
          </div>
          <div class="info-row" v-if="agent.description">
            <span class="label">Description:</span>
            <p class="value description">{{ agent.description }}</p>
          </div>
        </div>
        
        <div class="agent-stats-card">
          <h2>Statistics</h2>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ filesCount }}</div>
              <div class="stat-label">Files</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ usersCount }}</div>
              <div class="stat-label">Users</div>
            </div>
          </div>
        </div>
        
        <div class="agent-metadata-card" v-if="hasMetadata">
          <h2>Metadata</h2>
          <pre class="metadata-json">{{ prettyMetadata }}</pre>
        </div>
        
        <div class="agent-users-card">
          <div class="card-header">
            <h2>Assigned Users</h2>
            <button @click="showUserModal = true" class="add-user-btn">Manage Users</button>
          </div>
          
          <div v-if="users.length === 0" class="empty-users">
            No users assigned to this agent.
          </div>
          
          <div v-else class="users-list">
            <div v-for="user in users" :key="user.id" class="user-item">
              <div class="user-info">
                <h3>{{ user.displayName || user.email }}</h3>
                <p class="user-email">{{ user.email }}</p>
                <span class="user-role">{{ user.role || 'User' }}</span>
              </div>
              <button @click="removeUser(user)" class="remove-user-btn">
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Edit Agent Modal -->
    <div v-if="showEditModal" class="modal-backdrop">
      <div class="modal">
        <h2>Edit Agent</h2>
        <form @submit.prevent="updateAgent">
          <div class="form-group">
            <label for="name">Agent Name</label>
            <input 
              type="text" 
              id="name" 
              v-model="formData.name" 
              required 
              placeholder="Enter agent name"
            />
          </div>
          
          <div class="form-group">
            <label for="description">Description (Optional)</label>
            <textarea 
              id="description" 
              v-model="formData.description" 
              placeholder="Enter agent description"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="metadata">Metadata (JSON)</label>
            <textarea 
              id="metadata" 
              v-model="formData.metadataJson" 
              placeholder='{"key": "value"}'
              rows="5"
            ></textarea>
            <p class="help-text">Optional JSON metadata for agent configuration</p>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="showEditModal = false" class="cancel-btn">Cancel</button>
            <button type="submit" class="submit-btn">Update</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Manage Users Modal -->
    <div v-if="showUserModal" class="modal-backdrop">
      <div class="modal">
        <h2>Manage Users for {{ agent.name }}</h2>
        
        <div v-if="loadingUsers" class="loading-users">Loading users...</div>
        
        <div v-else-if="availableUsers.length === 0" class="empty-users-list">
          No users available in this organization.
        </div>
        
        <div v-else class="user-assignments">
          <div v-for="user in availableUsers" :key="user.id" class="user-assignment-item">
            <div class="user-info">
              <h3>{{ user.displayName || user.email }}</h3>
              <p class="user-email">{{ user.email }}</p>
              <span class="user-role">{{ user.role || 'User' }}</span>
            </div>
            <div class="assignment-toggle">
              <label class="switch">
                <input 
                  type="checkbox" 
                  :checked="isUserAssigned(user.id)" 
                  @change="toggleUserAssignment(user)"
                />
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closeUserModal" class="done-btn">Done</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { agentsApi, filesApi, organizationsApi, usersApi, userAgentApi } from '../services/api'

const route = useRoute()
const router = useRouter()
const agent = ref({})
const organization = ref({})
const users = ref([])
const availableUsers = ref([])
const files = ref([])
const loading = ref(true)
const loadingUsers = ref(false)
const showEditModal = ref(false)
const showUserModal = ref(false)
const formData = ref({
  name: '',
  description: '',
  metadataJson: '{}'
})

const agentId = computed(() => route.params.id)
const organizationName = computed(() => organization.value?.name || 'Unknown')
const filesCount = computed(() => files.value.length)
const usersCount = computed(() => users.value.length)
const hasMetadata = computed(() => agent.value?.metadata && Object.keys(agent.value.metadata).length > 0)
const prettyMetadata = computed(() => {
  if (!agent.value?.metadata) return '{}'
  return JSON.stringify(agent.value.metadata, null, 2)
})

onMounted(async () => {
  if (agentId.value) {
    await fetchAgentData()
  }
})

async function fetchAgentData() {
  loading.value = true
  try {
    // Fetch agent details
    const agentResponse = await agentsApi.getById(agentId.value)
    agent.value = agentResponse.data
    
    // Set form data for editing
    formData.value = {
      name: agent.value.name,
      description: agent.value.description || '',
      metadataJson: agent.value.metadata ? JSON.stringify(agent.value.metadata, null, 2) : '{}'
    }
    
    // Fetch organization details
    if (agent.value.organizationId) {
      const orgResponse = await organizationsApi.getById(agent.value.organizationId)
      organization.value = orgResponse.data
    }
    
    // Fetch files for this agent
    const filesResponse = await filesApi.getAll(agentId.value)
    files.value = filesResponse.data
    
    // Fetch users assigned to this agent
    await fetchAssignedUsers()
    
  } catch (error) {
    console.error('Error fetching agent data:', error)
  } finally {
    loading.value = false
  }
}

async function fetchAssignedUsers() {
  try {
    // This is a simplified approach - in a real app you'd have a specific API endpoint
    // to get users assigned to an agent
    const orgUsers = await usersApi.getAll(agent.value.organizationId)
    const allUsers = orgUsers.data
    
    // Filter for users that have this agent assigned
    // This is just a placeholder - you'd need to implement the real logic based on your API
    users.value = allUsers.filter(user => user.agentIds?.includes(agentId.value))
  } catch (error) {
    console.error('Error fetching assigned users:', error)
  }
}

async function updateAgent() {
  try {
    let metadata = {}
    try {
      metadata = JSON.parse(formData.value.metadataJson)
    } catch (e) {
      alert('Invalid JSON in metadata field')
      return
    }
    
    const agentData = {
      name: formData.value.name,
      description: formData.value.description,
      metadata: metadata
    }
    
    await agentsApi.update(agentId.value, agentData)
    await fetchAgentData()
    showEditModal.value = false
  } catch (error) {
    console.error('Error updating agent:', error)
    alert('Error updating agent: ' + error.message)
  }
}

async function openUserModal() {
  showUserModal.value = true
  loadingUsers.value = true
  
  try {
    // Fetch all users in the organization
    const orgUsers = await usersApi.getAll(agent.value.organizationId)
    availableUsers.value = orgUsers.data
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    loadingUsers.value = false
  }
}

function isUserAssigned(userId) {
  return users.value.some(user => user.id === userId)
}

async function toggleUserAssignment(user) {
  const isAssigned = isUserAssigned(user.id)
  
  try {
    if (isAssigned) {
      // Remove user from agent
      await userAgentApi.removeUserFromAgent(user.id, agentId.value)
      users.value = users.value.filter(u => u.id !== user.id)
    } else {
      // Assign user to agent
      await userAgentApi.assignUserToAgent(user.id, agentId.value)
      users.value.push(user)
    }
  } catch (error) {
    console.error('Error updating user assignment:', error)
    alert('Error updating user assignment: ' + error.message)
  }
}

async function removeUser(user) {
  if (confirm(`Are you sure you want to remove ${user.email} from this agent?`)) {
    try {
      await userAgentApi.removeUserFromAgent(user.id, agentId.value)
      users.value = users.value.filter(u => u.id !== user.id)
    } catch (error) {
      console.error('Error removing user:', error)
      alert('Error removing user: ' + error.message)
    }
  }
}

function closeUserModal() {
  showUserModal.value = false
  availableUsers.value = []
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}
</script>

<style scoped>
.agent-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading, .not-found {
  text-align: center;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.not-found h2 {
  color: #e74c3c;
}

.back-link {
  display: inline-block;
  margin-top: 20px;
  background-color: #3498db;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  text-decoration: none;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.title-section {
  display: flex;
  flex-direction: column;
}

.agent-id {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.actions {
  display: flex;
  gap: 10px;
}

.files-btn, .edit-btn {
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  font-size: 1rem;
  text-decoration: none;
}

.files-btn {
  background-color: #2ecc71;
  color: white;
  display: inline-block;
}

.edit-btn {
  background-color: #3498db;
  color: white;
}

.agent-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.agent-info-card, .agent-stats-card, .agent-metadata-card, .agent-users-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.info-row {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
}

.label {
  font-weight: 500;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.value {
  color: #2c3e50;
}

.description {
  white-space: pre-line;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: #2c3e50;
}

.stat-label {
  color: #7f8c8d;
}

.metadata-json {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: monospace;
  margin-top: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-user-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.empty-users {
  text-align: center;
  padding: 20px;
  color: #7f8c8d;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.user-info h3 {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
}

.user-email {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 0 0 5px 0;
}

.user-role {
  background-color: #3498db;
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.remove-user-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
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

.form-group input, .form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

.help-text {
  font-size: 0.8rem;
  color: #7f8c8d;
  margin-top: 5px;
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

.loading-users, .empty-users-list {
  text-align: center;
  padding: 20px;
  color: #7f8c8d;
}

.user-assignments {
  margin: 20px 0;
  max-height: 400px;
  overflow-y: auto;
}

.user-assignment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.user-assignment-item:last-child {
  border-bottom: none;
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
