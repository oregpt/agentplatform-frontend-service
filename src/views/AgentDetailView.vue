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
          <button @click="openEditModal()" class="edit-btn">Edit Agent</button>
          <button @click="confirmDelete(agent)" class="delete-btn">Delete Agent</button>
          <router-link :to="`/agents/${agent.id}/files`" class="files-btn">Manage Files</router-link>
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
            <span class="label">Agent ID:</span>
            <span class="value">{{ agent.id }}</span>
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
          <div class="info-row">
            <span class="label">Instructions:</span>
            <p class="value description">{{ agent.instructions }}</p>
          </div>
          <div class="info-row">
            <span class="label">AI Provider:</span>
            <span class="value">{{ agent.aiProvider }}</span>
          </div>
        </div>
        
        <div class="agent-metadata-card" v-if="hasMetadata">
          <h2>Metadata</h2>
          <pre class="metadata-json">{{ prettyMetadata }}</pre>
        </div>
        
        <div class="agent-users-card">
          <div class="card-header">
            <h2>Assigned Users</h2>
            <button @click="openAddUserModal" class="add-user-btn">+ Add User</button>
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
                <span class="remove-icon">×</span> Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Add User Modal -->
    <div v-if="showAddUserModal" class="modal-backdrop">
      <div class="modal">
        <h2>Add User to Agent</h2>
        <div v-if="loadingAvailableUsers" class="loading">Loading users...</div>
        <div v-else>
          <div class="user-list">
            <div v-if="availableUsers.length === 0" class="empty-users">
              No available users to add.
            </div>
            <div v-for="user in availableUsers" :key="user.id" class="user-item">
              <div class="user-info">
                <h3>{{ user.displayName || user.email }}</h3>
                <p class="user-email">{{ user.email }}</p>
              </div>
              <button @click="addUser(user)" class="add-btn">Add User</button>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeAddUserModal" class="cancel-btn">Close</button>
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
            <label for="instructions">Instructions (Required)</label>
            <textarea 
              id="instructions" 
              v-model="formData.instructions" 
              placeholder="Enter instructions for the agent"
              rows="4"
              required
            ></textarea>
            <p class="help-text">Detailed instructions that guide the agent's behavior</p>
          </div>
          
          <div class="form-group">
            <label for="aiProvider">AI Provider (Required)</label>
            <select 
              id="aiProvider" 
              v-model="formData.aiProvider" 
              required
            >
              <option value="">Select AI Provider</option>
              <option value="OpenAI">OpenAI</option>
              <option value="Anthropic">Anthropic</option>
            </select>
            <p class="help-text">The AI provider that will power this agent</p>
          </div>
          
          <div class="form-group">
            <label for="metadata">Metadata (JSON)</label>
            <textarea 
              id="metadata" 
              v-model="formData.metadataJson" 
              placeholder='{"key": "value"}'
              rows="5"
            ></textarea>
            <p class="help-text">Optional JSON metadata for the agent</p>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="showEditModal = false" class="cancel-btn">Cancel</button>
            <button type="submit" class="submit-btn">Update</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Delete confirmation modal is still here -->
    
    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDeleteModal"
      title="Delete Agent"
      :message="`Are you sure you want to delete ${agent.name}?`"
      details="This action cannot be undone. All associated files and user assignments will be permanently deleted."
      confirm-text="Delete"
      cancel-text="Cancel"
      confirm-type="danger"
      icon="delete"
      @confirm="deleteAgent"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { agentsApi, filesApi, organizationsApi, usersApi, userAgentApi } from '../services/api'
import axios from 'axios'
import ConfirmDialog from '../components/ConfirmDialog.vue'

// Get API base URL from environment variables or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

// Use the same api instance as in api.js
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const route = useRoute()
const router = useRouter()
const agent = ref({})
const organization = ref({})
const users = ref([])
const availableUsers = ref([])
const files = ref([])
const loading = ref(true)
const showEditModal = ref(false)
const showAddUserModal = ref(false)
const showDeleteModal = ref(false)
const loadingAvailableUsers = ref(false)
const formData = ref({
  name: '',
  description: '',
  instructions: '',
  aiProvider: '',
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
    // Get all users in the organization for reference
    const orgUsers = await usersApi.getAll(agent.value.organizationId)
    const allUsers = orgUsers.data;
    const allUsersMap = {};
    
    // Create a map of users by ID for quick lookup
    allUsers.forEach(user => {
      allUsersMap[user.id] = user;
    });
    
    // Get all users assigned to this agent using the new endpoint
    const response = await agentsApi.getUsers(agentId.value);
    
    if (response.data) {
      // Map the user IDs from UserAgent table to actual user objects
      users.value = response.data.map(mapping => {
        const user = allUsersMap[mapping.userId];
        return {
          id: mapping.userId,
          email: user?.email || 'Unknown Email',
          displayName: user?.displayName || user?.email || `User ID: ${mapping.userId}`,
          role: user?.role || 'User'
        };
      });
    } else {
      users.value = [];
    }
  } catch (error) {
    console.error('Error fetching assigned users:', error);
    users.value = [];
  }
}

async function updateAgent() {
  try {
    const metadata = JSON.parse(formData.value.metadataJson)
    
    const updatedAgent = {
      name: formData.value.name,
      description: formData.value.description,
      instructions: formData.value.instructions,
      aiProvider: formData.value.aiProvider,
      metadata: metadata
    }
    
    await agentsApi.update(agent.value.id, updatedAgent)
    
    // Update local agent data
    agent.value = {
      ...agent.value,
      name: updatedAgent.name,
      description: updatedAgent.description,
      instructions: updatedAgent.instructions,
      aiProvider: updatedAgent.aiProvider,
      metadata: metadata
    }
    
    showEditModal.value = false
  } catch (error) {
    console.error('Error updating agent:', error)
  }
}

async function openAddUserModal() {
  showAddUserModal.value = true
  loadingAvailableUsers.value = true
  
  try {
    // Fetch all users in the organization
    const orgUsers = await usersApi.getAll(agent.value.organizationId)
    const allUsers = orgUsers.data;
    
    // Filter out users that are already assigned to this agent
    availableUsers.value = allUsers.filter(user => {
      return !users.value.some(assignedUser => assignedUser.id === user.id)
    });
  } catch (error) {
    console.error('Error fetching available users:', error)
  } finally {
    loadingAvailableUsers.value = false
  }
}

async function addUser(user) {
  try {
    // Assign user to agent
    await userAgentApi.assignUserToAgent(user.id, agentId.value)
    
    // Add user to the local users list
    users.value.push({
      id: user.id,
      email: user.email,
      displayName: user.displayName || user.email,
      role: user.role || 'User'
    })
    
    // Remove user from available users list
    availableUsers.value = availableUsers.value.filter(u => u.id !== user.id)
  } catch (error) {
    console.error('Error adding user:', error)
    alert('Error adding user: ' + error.message)
  }
}

function closeAddUserModal() {
  showAddUserModal.value = false
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

const openEditModal = () => {
  // Populate form data with current agent values
  formData.value = {
    name: agent.value.name || '',
    description: agent.value.description || '',
    instructions: agent.value.instructions || '',
    aiProvider: agent.value.aiProvider || '',
    metadataJson: agent.value.metadata ? JSON.stringify(agent.value.metadata, null, 2) : '{}'
  }
  showEditModal.value = true
}

// closeUserModal function removed as we now use the Add User modal

const confirmDelete = () => {
  showDeleteModal.value = true
}

const deleteAgent = async () => {
  try {
    await agentsApi.delete(agent.value.id)
    router.push('/agents')
  } catch (error) {
    console.error('Error deleting agent:', error)
    // You could add a notification system here
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString()
}
</script>

<style scoped>
.agent-detail-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.add-user-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
}

.add-user-btn:hover {
  background-color: #45a049;
}

.remove-icon {
  font-weight: bold;
  margin-right: 5px;
  font-size: 16px;
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

.files-btn, .edit-btn, .delete-btn, .users-btn {
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  border: none;
}

.files-btn {
  background-color: #2ecc71;
  color: white;
}

.files-btn:hover {
  background-color: #27ae60;
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

.users-btn {
  background-color: #3498db;
  color: white;
}

.users-btn:hover {
  background-color: #2980b9;
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
