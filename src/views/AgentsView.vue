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
    
    <SearchBar 
      v-model="searchQuery" 
      placeholder="Search agents..." 
      @search="handleSearch"
      @clear="handleClearSearch"
    />

    <ErrorMessage v-if="error" :message="error" @close="error = null" />
    
    <LoadingSpinner v-if="loading" message="Loading agents..." />
    
    <div v-else-if="filteredAgents.length === 0" class="empty-state">
      <p v-if="searchQuery">No agents found matching "{{ searchQuery }}". Try a different search term.</p>
      <p v-else>No agents found in this organization. Create your first agent to get started.</p>
      <button @click="showCreateModal = true" class="create-btn">Create Agent</button>
    </div>
    
    <div v-else class="agents-list">
      <ContentCard 
        v-for="agent in filteredAgents" 
        :key="agent.id"
        :title="agent.name"
        :subtitle="`ID: ${agent.id}`"
        :description="agent.description"
      >
        <template #stats>
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
        </template>
        <template #actions>
          <router-link :to="`/agents/${agent.id}`" class="view-btn">View</router-link>
          <router-link :to="`/agents/${agent.id}/files`" class="files-btn">Files</router-link>
          <button @click="editAgent(agent)" class="edit-btn">Edit</button>
          <button @click="confirmDelete(agent)" class="delete-btn">Delete</button>
        </template>
      </ContentCard>
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
              v-model="formData.metadata" 
              placeholder='{"key": "value"}'
              rows="5"
            ></textarea>
            <p class="help-text">Optional JSON metadata for agent configuration</p>
          </div>
          
          <div class="form-group">
            <label>Upload Files (Optional)</label>
            <FileUploader
              ref="fileUploader"
              :multiple="true"
              :accepted-file-types="'.md'"
              title="Drag & Drop Files"
              description="Upload markdown files for this agent"
              :show-preview="true"
              @files-selected="onFilesSelected"
              @upload-progress="onUploadProgress"
            />
            <div v-if="uploadError" class="upload-error">{{ uploadError }}</div>
            <div class="help-text">Upload markdown (.md) files for this agent</div>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="cancel-btn">Cancel</button>
            <button type="submit" class="submit-btn" :disabled="isUploading">
              {{ showEditModal ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDeleteModal"
      title="Delete Agent"
      :message="`Are you sure you want to delete ${selectedAgent.name}?`"
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
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { agentsApi, organizationsApi, filesApi } from '../services/api'
import { useAuthStore } from '../store/auth'
import SearchBar from '../components/SearchBar.vue'
import ContentCard from '../components/ContentCard.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import ErrorMessage from '../components/ErrorMessage.vue'
import FileUploader from '../components/FileUploader.vue'

const notify = inject('notify')
const authStore = useAuthStore()
const organizations = ref([])
const agents = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const selectedOrgId = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedAgent = ref({})
const formData = ref({
  name: '',
  description: '',
  metadata: '{}'
})

// File upload related refs
const fileUploader = ref(null)
const uploadedFiles = ref([])
const uploadProgress = ref(0)
const isUploading = ref(false)
const uploadError = ref('')

// Filter agents based on search query
const filteredAgents = computed(() => {
  if (!searchQuery.value) return agents.value
  
  const query = searchQuery.value.toLowerCase()
  return agents.value.filter(agent => 
    agent.name.toLowerCase().includes(query) || 
    (agent.description && agent.description.toLowerCase().includes(query)) ||
    agent.id.toLowerCase().includes(query)
  )
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

async function fetchAgents() {
  try {
    loading.value = true
    error.value = ''
    console.log('Fetching agents')
    const response = await agentsApi.getAll()
    console.log('Agents API response:', response)
    
    // Check if response has the expected structure
    if (response && response.data && response.data.agents) {
      // Filter agents by the selected organization if one is selected
      if (selectedOrgId.value) {
        agents.value = response.data.agents.filter(agent => agent.organizationId === selectedOrgId.value)
      } else {
        agents.value = response.data.agents
      }
      console.log('Agents loaded:', agents.value)
    } else {
      console.error('Unexpected API response format:', response)
      error.value = 'Unexpected API response format'
    }
  } catch (err) {
    console.error('Error fetching agents:', err)
    error.value = `Failed to load agents: ${err.message || 'Unknown error'}`
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

function editAgent(agent) {
  selectedAgent.value = agent
  formData.value = {
    name: agent.name,
    description: agent.description || '',
    metadata: JSON.stringify(agent.metadata || {}, null, 2)
  }
  
  // Reset file upload state
  uploadedFiles.value = []
  uploadProgress.value = 0
  isUploading.value = false
  uploadError.value = ''
  if (fileUploader.value) {
    fileUploader.value.reset()
  }
  
  showEditModal.value = true
}

function confirmDelete(agent) {
  selectedAgent.value = agent
  showDeleteModal.value = true
}

async function deleteAgent() {
  try {
    loading.value = true
    await agentsApi.delete(selectedAgent.value.id)
    await fetchAgents()
    showDeleteModal.value = false
    notify({
      type: 'success',
      message: `Agent "${selectedAgent.value.name}" deleted successfully`
    })
  } catch (err) {
    notify({
      type: 'error',
      message: 'Failed to delete agent',
      details: err.message
    })
    console.error('Error deleting agent:', err)
  } finally {
    loading.value = false
  }
}

async function createAgent() {
  try {
    // Validate JSON metadata
    try {
      JSON.parse(formData.value.metadata)
    } catch (e) {
      notify({
        type: 'error',
        message: 'Invalid JSON metadata format',
        details: e.message
      })
      return
    }
    
    const agentData = {
      name: formData.value.name,
      description: formData.value.description,
      organizationId: selectedOrgId.value,
      metadata: JSON.parse(formData.value.metadata)
    }

    const response = await agentsApi.create(agentData)
    const createdAgentId = response.data.id
    
    // Upload files if any are selected
    if (uploadedFiles.value.length > 0) {
      await uploadAgentFiles(createdAgentId)
    }
    
    await fetchAgents()
    showCreateModal.value = false
    resetForm()
    notify({
      type: 'success',
      message: 'Agent created successfully'
    })
  } catch (err) {
    notify({
      type: 'error',
      message: 'Failed to create agent',
      details: err.message
    })
    console.error('Error creating agent:', err)
  }
}

async function updateAgent() {
  try {
    // Validate JSON metadata
    try {
      JSON.parse(formData.value.metadata)
    } catch (e) {
      notify({
        type: 'error',
        message: 'Invalid JSON metadata format',
        details: e.message
      })
      return
    }

    const agentData = {
      name: formData.value.name,
      description: formData.value.description,
      metadata: JSON.parse(formData.value.metadata)
    }

    await agentsApi.update(selectedAgent.value.id, agentData)
    
    // Upload files if any are selected
    if (uploadedFiles.value.length > 0) {
      await uploadAgentFiles(selectedAgent.value.id)
    }
    
    await fetchAgents()
    showEditModal.value = false
    notify({
      type: 'success',
      message: 'Agent updated successfully'
    })
  } catch (err) {
    notify({
      type: 'error',
      message: 'Failed to update agent',
      details: err.message
    })
    console.error('Error updating agent:', err)
  }
}

async function uploadAgentFiles(agentId) {
  try {
    isUploading.value = true
    const formData = new FormData()
    uploadedFiles.value.forEach(file => {
      formData.append('files', file)
    })
    const response = await filesApi.upload(agentId, formData, {
      onUploadProgress: (progressEvent) => {
        uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      }
    })
    uploadedFiles.value = []
    uploadProgress.value = 0
    isUploading.value = false
    notify({
      type: 'success',
      message: 'Files uploaded successfully'
    })
  } catch (err) {
    uploadError.value = 'Failed to upload files'
    isUploading.value = false
    notify({
      type: 'error',
      message: 'Failed to upload files',
      details: err.message
    })
    console.error('Error uploading files:', err)
  }
}

function onFilesSelected(files) {
  uploadedFiles.value = files
}

function onUploadProgress(progress) {
  uploadProgress.value = progress
}

function closeModal() {
  showCreateModal.value = false
  showEditModal.value = false
  resetForm()
}

function resetForm() {
  formData.value = {
    name: '',
    description: '',
    metadata: '{}'
  }
  
  // Reset file upload state
  uploadedFiles.value = []
  uploadProgress.value = 0
  isUploading.value = false
  uploadError.value = ''
  if (fileUploader.value) {
    fileUploader.value.reset()
  }
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

.upload-error {
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 8px;
}

.manage-files-link {
  color: #3498db;
  text-decoration: none;
}

.manage-files-link:hover {
  text-decoration: underline;
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
