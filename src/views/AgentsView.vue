<template>
  <div class="agents-container">
    <div class="header">
      <h1>Agents</h1>
      <button @click="showCreateModal = true" class="create-btn">Create Agent</button>
    </div>

    <div class="organization-selector" v-if="organizations.length > 0">
      <label for="organization">Organization:</label>
      <select id="organization" v-model="selectedOrgId" @change="fetchAgents">
        <option v-for="org in organizations" :key="org.id" :value="org.id">
          {{ org.name }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="loading">Loading agents...</div>
    
    <div v-else-if="agents.length === 0" class="empty-state">
      <p>No agents found in this organization. Create your first agent to get started.</p>
      <button @click="showCreateModal = true" class="create-btn">Create Agent</button>
    </div>
    
    <div v-else class="agents-list">
      <div v-for="agent in agents" :key="agent.id" class="agent-card">
        <div class="agent-info">
          <h2>{{ agent.name }}</h2>
          <p class="agent-id">ID: {{ agent.id }}</p>
          <p v-if="agent.description">{{ agent.description }}</p>
        </div>
        <div class="agent-stats">
          <div class="stat">
            <span class="stat-label">Files</span>
            <span class="stat-value">{{ agent.filesCount || 0 }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Users</span>
            <span class="stat-value">{{ agent.usersCount || 0 }}</span>
          </div>
        </div>
        <div class="agent-actions">
          <router-link :to="`/agents/${agent.id}`" class="view-btn">View</router-link>
          <router-link :to="`/agents/${agent.id}/files`" class="files-btn">Files</router-link>
          <button @click="editAgent(agent)" class="edit-btn">Edit</button>
          <button @click="confirmDelete(agent)" class="delete-btn">Delete</button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || showEditModal" class="modal-backdrop">
      <div class="modal">
        <h2>{{ showEditModal ? 'Edit Agent' : 'Create Agent' }}</h2>
        <form @submit.prevent="showEditModal ? updateAgent() : createAgent()">
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
            <button type="button" @click="closeModal" class="cancel-btn">Cancel</button>
            <button type="submit" class="submit-btn">
              {{ showEditModal ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-backdrop">
      <div class="modal">
        <h2>Delete Agent</h2>
        <p>Are you sure you want to delete <strong>{{ selectedAgent.name }}</strong>?</p>
        <p class="warning">This action cannot be undone. All associated files and user assignments will be permanently deleted.</p>
        
        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="cancel-btn">Cancel</button>
          <button @click="deleteAgent" class="delete-btn">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { organizationsApi, agentsApi } from '../services/api'

const authStore = useAuthStore()
const organizations = ref([])
const agents = ref([])
const loading = ref(true)
const selectedOrgId = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedAgent = ref({})
const formData = ref({
  name: '',
  description: '',
  metadataJson: '{}'
})

onMounted(async () => {
  await fetchOrganizations()
  if (authStore.organizationId) {
    selectedOrgId.value = authStore.organizationId
    await fetchAgents()
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

async function fetchAgents() {
  if (!selectedOrgId.value) return
  
  loading.value = true
  try {
    const response = await agentsApi.getAll(selectedOrgId.value)
    agents.value = response.data
  } catch (error) {
    console.error('Error fetching agents:', error)
  } finally {
    loading.value = false
  }
}

function editAgent(agent) {
  selectedAgent.value = agent
  formData.value = {
    name: agent.name,
    description: agent.description || '',
    metadataJson: agent.metadata ? JSON.stringify(agent.metadata, null, 2) : '{}'
  }
  showEditModal.value = true
}

function confirmDelete(agent) {
  selectedAgent.value = agent
  showDeleteModal.value = true
}

async function createAgent() {
  if (!selectedOrgId.value) {
    alert('Please select an organization first')
    return
  }
  
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
      organizationId: selectedOrgId.value,
      metadata: metadata
    }
    
    await agentsApi.create(agentData)
    await fetchAgents()
    closeModal()
  } catch (error) {
    console.error('Error creating agent:', error)
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
    
    await agentsApi.update(selectedAgent.value.id, agentData)
    await fetchAgents()
    closeModal()
  } catch (error) {
    console.error('Error updating agent:', error)
  }
}

async function deleteAgent() {
  try {
    await agentsApi.delete(selectedAgent.value.id)
    await fetchAgents()
    showDeleteModal.value = false
  } catch (error) {
    console.error('Error deleting agent:', error)
  }
}

function closeModal() {
  showCreateModal.value = false
  showEditModal.value = false
  formData.value = {
    name: '',
    description: '',
    metadataJson: '{}'
  }
  selectedAgent.value = {}
}
</script>

<style scoped>
.agents-container {
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

.agents-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.agent-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.agent-info h2 {
  margin: 0 0 5px 0;
  color: #2c3e50;
}

.agent-id {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 0 0 10px 0;
}

.agent-stats {
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

.agent-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
  flex-wrap: wrap;
}

.view-btn, .files-btn, .edit-btn, .delete-btn {
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  font-size: 0.9rem;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.view-btn {
  background-color: #3498db;
  color: white;
}

.view-btn:hover {
  background-color: #2980b9;
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

.cancel-btn {
  background-color: #95a5a6;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
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
</style>
