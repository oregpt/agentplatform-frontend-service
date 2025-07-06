<template>
  <div class="users-container">
    <div class="header">
      <h1>Users</h1>
      <button @click="showCreateModal = true" class="create-btn">Create User</button>
    </div>

    <div class="organization-selector" v-if="organizations.length > 0">
      <label for="organization">Organization:</label>
      <select id="organization" v-model="selectedOrgId" @change="fetchUsers">
        <option v-for="org in organizations" :key="org.id" :value="org.id">
          {{ org.name }}
        </option>
      </select>
    </div>
    
    <SearchBar 
      v-model="searchQuery" 
      placeholder="Search users..." 
      @search="handleSearch"
      @clear="handleClearSearch"
    />

    <ErrorMessage v-if="error" :message="error" @close="error = null" />
    
    <LoadingSpinner v-if="loading" message="Loading users..." />
    
    <div v-else-if="filteredUsers.length === 0" class="empty-state">
      <p v-if="searchQuery">No users found matching "{{ searchQuery }}". Try a different search term.</p>
      <p v-else>No users found in this organization. Create your first user to get started.</p>
      <button @click="showCreateModal = true" class="create-btn">Create User</button>
    </div>
    
    <div v-else class="users-list">
      <ContentCard 
        v-for="user in filteredUsers" 
        :key="user.id"
        :title="user.name"
        :subtitle="`ID: ${user.id}`"
      >
        <p class="user-email">{{ user.email }}</p>
        <p v-if="user.description">{{ user.description }}</p>
        
        <template #stats>
          <div class="user-stats">
            <div class="stat">
              <span class="stat-label">Agents</span>
              <span class="stat-value">{{ user.agentsCount || 0 }}</span>
            </div>
          </div>
        </template>
        <template #actions>
          <button @click="manageAgents(user)" class="agents-btn">Manage Agents</button>
          <button @click="editUser(user)" class="edit-btn">Edit</button>
          <button @click="confirmDelete(user)" class="delete-btn">Delete</button>
        </template>
      </ContentCard>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || showEditModal" class="modal-backdrop">
      <div class="modal">
        <h2>{{ showEditModal ? 'Edit User' : 'Create User' }}</h2>
        <form @submit.prevent="showEditModal ? updateUser() : createUser()">
          <div class="form-group">
            <label for="name">User Name</label>
            <input 
              type="text" 
              id="name" 
              v-model="formData.name" 
              required 
              placeholder="Enter user name"
            />
          </div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              v-model="formData.email" 
              required 
              placeholder="Enter user email"
            />
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              v-model="formData.password" 
              required 
              placeholder="Enter user password"
            />
          </div>
          
          <div class="form-group">
            <label for="description">Description (Optional)</label>
            <textarea 
              id="description" 
              v-model="formData.description" 
              placeholder="Enter user description"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="role">Role</label>
            <select id="role" v-model="formData.role" required>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="cancel-btn">Cancel</button>
            <button type="submit" class="submit-btn">
              {{ showEditModal ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Manage Agents Modal -->
    <div v-if="showAgentsModal" class="modal-backdrop">
      <div class="modal">
        <h2>Manage Agents for {{ selectedUser.name }}</h2>
        
        <ErrorMessage v-if="agentsError" :message="agentsError" @close="agentsError = null" />
        
        <LoadingSpinner v-if="loadingAgents" message="Loading agents..." />
        
        <div v-else-if="availableAgents.length === 0" class="empty-state">
          <p>No agents available in this organization.</p>
        </div>
        
        <div v-else class="agent-selection">
          <SearchBar 
            v-model="agentSearchQuery" 
            placeholder="Search agents..." 
            @search="handleAgentSearch"
            @clear="handleClearAgentSearch"
            class="agent-search"
          />
          
          <div 
            v-for="agent in filteredAvailableAgents" 
            :key="agent.id" 
            class="agent-item"
            :class="{ 'selected': isAgentSelected(agent.id) }"
            @click="toggleAgentSelection(agent.id)"
          >
            <div class="agent-details">
              <h3>{{ agent.name }}</h3>
              <p v-if="agent.description">{{ agent.description }}</p>
            </div>
            <div class="agent-checkbox">
              <input 
                type="checkbox" 
                :checked="isAgentSelected(agent.id)" 
                @click.stop
                @change="toggleAgentSelection(agent.id)"
              />
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button type="button" @click="closeAgentsModal" class="cancel-btn">Cancel</button>
          <button @click="saveAgentAssignments" class="submit-btn">Save</button>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDeleteModal"
      title="Delete User"
      :message="`Are you sure you want to delete ${selectedUser.name}?`"
      details="This action cannot be undone. All agent assignments for this user will be removed."
      confirm-text="Delete"
      cancel-text="Cancel"
      confirm-type="danger"
      icon="delete"
      @confirm="deleteUser"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject } from 'vue'
import { useAuthStore } from '../store/auth'
import { organizationsApi, usersApi, userAgentApi } from '../services/api'
import SearchBar from '../components/SearchBar.vue'
import ContentCard from '../components/ContentCard.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import ErrorMessage from '../components/ErrorMessage.vue'

const notify = inject('notify')
const authStore = useAuthStore()
const organizations = ref([])
const users = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const selectedOrgId = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showAgentsModal = ref(false)
const selectedUser = ref({})
const formData = ref({
  name: '',
  email: '',
  password: '',
  description: '',
  role: 'user' // Default role
})

// For agent management
const availableAgents = ref([])
const loadingAgents = ref(false)
const agentsError = ref(null)
const agentSearchQuery = ref('')
const selectedAgentIds = ref([])

// Filter users based on search query
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(user => 
    user.name.toLowerCase().includes(query) || 
    (user.description && user.description.toLowerCase().includes(query)) ||
    user.email.toLowerCase().includes(query) ||
    user.id.toLowerCase().includes(query)
  )
})

// Filter available agents based on search query
const filteredAvailableAgents = computed(() => {
  if (!agentSearchQuery.value) return availableAgents.value
  
  const query = agentSearchQuery.value.toLowerCase()
  return availableAgents.value.filter(agent => 
    agent.name.toLowerCase().includes(query) || 
    (agent.description && agent.description.toLowerCase().includes(query))
  )
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
  } catch (err) {
    error.value = 'Failed to load organizations. Please try again.'
    notify({
      type: 'error',
      message: 'Failed to load organizations',
      details: err.message
    })
    console.error('Error fetching organizations:', err)
  }
}

async function fetchUsers() {
  if (!selectedOrgId.value) return
  
  loading.value = true
  error.value = null
  try {
    console.log('Fetching users for organization:', selectedOrgId.value)
    const response = await usersApi.getAll(selectedOrgId.value)
    console.log('Users API response:', response)
    
    // Check if response has the expected structure
    if (response && response.data) {
      // Extract users from the response
      let usersList = [];
      if (Array.isArray(response.data.users)) {
        usersList = response.data.users;
      } else if (Array.isArray(response.data)) {
        usersList = response.data;
      }
      
      // For each user, fetch agent counts
      const usersWithCounts = await Promise.all(usersList.map(async (user) => {
        try {
          // Fetch agent assignments for this user
          const agentsResponse = await userAgentApi.getUserAgents(user.id);
          let agentsCount = 0;
          
          if (agentsResponse && agentsResponse.data) {
            if (Array.isArray(agentsResponse.data.agents)) {
              agentsCount = agentsResponse.data.agents.length;
            } else if (Array.isArray(agentsResponse.data)) {
              agentsCount = agentsResponse.data.length;
            }
          }
          
          return {
            ...user,
            agentsCount
          };
        } catch (err) {
          console.error(`Error fetching agent counts for user ${user.id}:`, err);
          return {
            ...user,
            agentsCount: 0
          };
        }
      }));
      
      users.value = usersWithCounts;
      console.log('Users loaded with counts:', users.value);
    } else {
      console.error('Unexpected API response format:', response)
      error.value = 'Unexpected API response format'
      users.value = [];
    }
  } catch (err) {
    error.value = 'Failed to load users. Please try again.'
    notify({
      type: 'error',
      message: 'Failed to load users',
      details: err.message
    })
    console.error('Error fetching users:', err)
    users.value = [];
  } finally {
    loading.value = false
  }
}

function handleSearch(query) {
  searchQuery.value = query
}

function handleClearSearch() {
  searchQuery.value = ''
}

function handleAgentSearch(query) {
  agentSearchQuery.value = query
}

function handleClearAgentSearch() {
  agentSearchQuery.value = ''
}

function editUser(user) {
  selectedUser.value = user
  formData.value = {
    name: user.name,
    email: user.email,
    description: user.description || '',
    password: '',
    role: user.role || 'user'
  }
  showEditModal.value = true
}

async function manageAgents(user) {
  selectedUser.value = user
  loadingAgents.value = true
  agentsError.value = null
  agentSearchQuery.value = ''
  showAgentsModal.value = true
  
  try {
    // Get all agents for the organization
    const orgAgentsResponse = await userAgentApi.getAgentsByOrganization(selectedOrgId.value)
    availableAgents.value = orgAgentsResponse.data
    
    // Get user's assigned agents
    const userAgentsResponse = await userAgentApi.getUserAgents(user.id)
    selectedAgentIds.value = userAgentsResponse.data.map(ua => ua.agentId)
  } catch (err) {
    agentsError.value = 'Failed to load agents. Please try again.'
    notify({
      type: 'error',
      message: 'Failed to load agents',
      details: err.message
    })
    console.error('Error loading agents:', err)
  } finally {
    loadingAgents.value = false
  }
}

function isAgentSelected(agentId) {
  return selectedAgentIds.value.includes(agentId)
}

function toggleAgentSelection(agentId) {
  if (isAgentSelected(agentId)) {
    selectedAgentIds.value = selectedAgentIds.value.filter(id => id !== agentId)
  } else {
    selectedAgentIds.value.push(agentId)
  }
}

async function saveAgentAssignments() {
  try {
    await userAgentApi.updateUserAgents(selectedUser.value.id, selectedAgentIds.value)
    notify({
      type: 'success',
      message: 'Agent assignments updated successfully'
    })
    closeAgentsModal()
  } catch (err) {
    notify({
      type: 'error',
      message: 'Failed to update agent assignments',
      details: err.message
    })
    console.error('Error updating agent assignments:', err)
  }
}

async function createUser() {
  try {
    const payload = {
      name: formData.value.name,
      email: formData.value.email,
      password: formData.value.password,
      description: formData.value.description,
      role: formData.value.role,
      organizationId: selectedOrgId.value
    }
    
    await usersApi.create(payload)
    await fetchUsers()
    notify({
      type: 'success',
      message: 'User created successfully'
    })
    closeModal()
  } catch (err) {
    notify({
      type: 'error',
      message: 'Failed to create user',
      details: err.message
    })
    console.error('Error creating user:', err)
  }
}

// Updated to fix notification handling with addNotification support
async function updateUser() {
  try {
    const payload = {
      name: formData.value.name,
      email: formData.value.email,
      description: formData.value.description,
      role: formData.value.role,
      organizationId: formData.value.organizationId || selectedOrgId.value
    }
    
    console.log('Updating user:', selectedUser.value.id, payload)
    await usersApi.update(selectedUser.value.id, payload)
    
    try {
      // Try different notification methods
      if (typeof notify === 'function') {
        notify({
          type: 'success',
          message: 'User updated successfully'
        })
      } else if (notify && typeof notify.success === 'function') {
        notify.success('User updated successfully')
      } else if (notify && notify.value && typeof notify.value.addNotification === 'function') {
        notify.value.addNotification({
          type: 'success',
          message: 'User updated successfully'
        })
      }
    } catch (notifyErr) {
      console.error('Error showing success notification:', notifyErr)
    }
    
    closeModal()
    // Fetch users after successful update
    await fetchUsers()
  } catch (err) {
    console.error('Error updating user:', err)
    
    try {
      // Try different notification methods
      if (typeof notify === 'function') {
        notify({
          type: 'error',
          message: 'Failed to update user',
          details: err.message
        })
      } else if (notify && typeof notify.error === 'function') {
        notify.error(`Failed to update user: ${err.message || 'Unknown error'}`)
      } else if (notify && notify.value && typeof notify.value.addNotification === 'function') {
        notify.value.addNotification({
          type: 'error',
          message: 'Failed to update user: ' + (err.message || 'Unknown error')
        })
      }
    } catch (notifyErr) {
      console.error('Error showing error notification:', notifyErr)
    }
  }
}

async function deleteUser() {
  try {
    console.log('Deleting user:', selectedUser.value.id)
    await usersApi.delete(selectedUser.value.id)
    
    try {
      // Try different notification methods
      if (typeof notify === 'function') {
        notify({
          type: 'success',
          message: 'User deleted successfully'
        })
      } else if (notify && typeof notify.success === 'function') {
        notify.success('User deleted successfully')
      } else if (notify && notify.value && typeof notify.value.addNotification === 'function') {
        notify.value.addNotification({
          type: 'success',
          message: 'User deleted successfully'
        })
      }
    } catch (notifyErr) {
      console.error('Error showing success notification:', notifyErr)
    }
    
    showDeleteModal.value = false
    // Fetch users after successful deletion
    await fetchUsers()
  } catch (err) {
    console.error('Error deleting user:', err)
    
    try {
      // Try different notification methods
      if (typeof notify === 'function') {
        notify({
          type: 'error',
          message: 'Failed to delete user',
          details: err.message
        })
      } else if (notify && typeof notify.error === 'function') {
        notify.error(`Failed to delete user: ${err.message || 'Unknown error'}`)
      } else if (notify && notify.value && typeof notify.value.addNotification === 'function') {
        notify.value.addNotification({
          type: 'error',
          message: 'Failed to delete user: ' + (err.message || 'Unknown error')
        })
      }
    } catch (notifyErr) {
      console.error('Error showing error notification:', notifyErr)
    }
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
