<template>
  <div class="agent-org-assignments">
    <div class="header">
      <router-link to="/assign" class="back-button">
        <i class="mdi mdi-arrow-left"></i> Back to Assignments
      </router-link>
      <h1>Assign Agents to Organizations</h1>
    </div>

    <div class="content">
      <div class="agent-selection">
        <div class="form-group">
          <label for="agent-select">Select Agent:</label>
          <v-select
            v-model="selectedAgent"
            :options="agents"
            label="name"
            :reduce="agent => agent.id"
            placeholder="Search agents..."
            @option:selected="loadAgentOrganization"
          >
            <template #option="{ name, organization_name }">
              <div class="agent-option">
                <div class="agent-name">{{ name }}</div>
                <div v-if="organization_name" class="agent-org">
                  Current: {{ organization_name }}
                </div>
              </div>
            </template>
          </v-select>
        </div>
      </div>

      <div v-if="selectedAgent" class="assignment-container">
        <div class="panel">
          <h3>Select Organization</h3>
          <div class="search-box">
            <input
              v-model="orgSearch"
              type="text"
              placeholder="Search organizations..."
              class="search-input"
            />
          </div>
          <div class="list-container">
            <div
              v-for="org in filteredOrganizations"
              :key="org.id"
              class="list-item"
              :class="{ 'is-selected': selectedOrgId === org.id }"
              @click="selectOrganization(org.id)"
            >
              <div class="org-name">{{ org.name }}</div>
              <div class="org-id">ID: {{ org.id }}</div>
            </div>
            <div v-if="filteredOrganizations.length === 0" class="empty-state">
              No organizations found
            </div>
          </div>
        </div>

        <div class="assignment-actions">
          <button 
            @click="updateAgentOrganization" 
            :disabled="!selectedOrgId || loading"
            class="assign-button"
          >
            <span v-if="loading">
              <i class="mdi mdi-loading mdi-spin"></i> Updating...
            </span>
            <span v-else>Update Organization</span>
          </button>
          
          <button 
            v-if="currentOrgId"
            @click="clearOrganization" 
            :disabled="loading"
            class="clear-button"
          >
            Remove from Organization
          </button>
        </div>

        <div v-if="currentOrgId" class="current-org">
          <h3>Current Organization</h3>
          <div class="current-org-details">
            <div class="org-name">{{ currentOrg?.name || 'Loading...' }}</div>
            <div class="org-id">ID: {{ currentOrgId }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toast-notification'
import 'vue-toast-notification/dist/theme-sugar.css'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import { agentsApi, organizationsApi } from '@/services/api'

const toast = useToast()

// Toast options
const toastOptions = {
  position: 'top-right',
  duration: 3000
}

// State
const agents = ref([])
const organizations = ref([])
const selectedAgent = ref(null)
const selectedOrgId = ref(null)
const currentOrgId = ref(null)
const currentOrg = ref(null)
const orgSearch = ref('')
const loading = ref(false)

// Computed
const filteredOrganizations = computed(() => {
  const search = orgSearch.value.toLowerCase()
  return organizations.value.filter(org => 
    org.name.toLowerCase().includes(search) ||
    org.id.toLowerCase().includes(search)
  )
})

// Methods
async function loadAgents() {
  try {
    loading.value = true
    const response = await agentsApi.getAll()
    agents.value = response.data || []
  } catch (error) {
    console.error('Error loading agents:', error)
    toast.error('Failed to load agents', toastOptions)
  } finally {
    loading.value = false
  }
}

async function loadOrganizations() {
  try {
    loading.value = true
    const response = await organizationsApi.getAll()
    organizations.value = response.data || []
  } catch (error) {
    console.error('Error loading organizations:', error)
    toast.error('Failed to load organizations', toastOptions)
  } finally {
    loading.value = false
  }
}

async function loadAgentOrganization() {
  if (!selectedAgent.value) {
    currentOrgId.value = null
    currentOrg.value = null
    selectedOrgId.value = null
    return
  }
  
  try {
    loading.value = true
    const agent = agents.value.find(a => a.id === selectedAgent.value)
    if (agent && agent.organization_id) {
      currentOrgId.value = agent.organization_id
      selectedOrgId.value = agent.organization_id
      // Load full org details
      const org = organizations.value.find(o => o.id === agent.organization_id)
      if (org) {
        currentOrg.value = org
      } else {
        // If org not in the list, fetch it
        const response = await organizationsApi.getById(agent.organization_id)
        currentOrg.value = response.data
      }
    } else {
      currentOrgId.value = null
      currentOrg.value = null
      selectedOrgId.value = null
    }
  } catch (error) {
    console.error('Error loading agent organization:', error)
    toast.error('Failed to load agent organization', toastOptions)
  } finally {
    loading.value = false
  }
}

function selectOrganization(orgId) {
  selectedOrgId.value = orgId
}

async function updateAgentOrganization() {
  if (!selectedAgent.value || !selectedOrgId.value) return
  
  try {
    loading.value = true
    await agentsApi.update(selectedAgent.value, {
      organization_id: selectedOrgId.value
    })
    
    // Update local state
    const agentIndex = agents.value.findIndex(a => a.id === selectedAgent.value)
    if (agentIndex !== -1) {
      agents.value[agentIndex].organization_id = selectedOrgId.value
    }
    
    currentOrgId.value = selectedOrgId.value
    currentOrg.value = organizations.value.find(o => o.id === selectedOrgId.value)
    
    toast.success('Agent organization updated successfully', toastOptions)
  } catch (error) {
    console.error('Error updating agent organization:', error)
    toast.error('Failed to update agent organization', toastOptions)
  } finally {
    loading.value = false
  }
}

async function clearOrganization() {
  if (!selectedAgent.value) return
  
  try {
    loading.value = true
    await agentsApi.update(selectedAgent.value, {
      organization_id: null
    })
    
    // Update local state
    const agentIndex = agents.value.findIndex(a => a.id === selectedAgent.value)
    if (agentIndex !== -1) {
      agents.value[agentIndex].organization_id = null
    }
    
    currentOrgId.value = null
    currentOrg.value = null
    selectedOrgId.value = null
    
    toast.success('Agent removed from organization')
  } catch (error) {
    console.error('Error removing agent from organization:', error)
    toast.error('Failed to remove agent from organization')
  } finally {
    loading.value = false
  }
}

// Lifecycle hooks
onMounted(async () => {
  await Promise.all([loadAgents(), loadOrganizations()])
})
</script>

<style scoped>
.agent-org-assignments {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  margin-bottom: 2rem;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #3498db;
  text-decoration: none;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.back-button:hover {
  text-decoration: underline;
}

h1 {
  color: #2c3e50;
  margin: 0.5rem 0;
}

.content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.agent-selection {
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
}

.assignment-container {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 2rem;
  margin-top: 1.5rem;
}

.panel {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  grid-row: span 2;
}

.panel h3 {
  background-color: #f8f9fa;
  margin: 0;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  font-size: 1rem;
  color: #2c3e50;
}

.search-box {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.list-container {
  flex: 1;
  overflow-y: auto;
  max-height: 500px;
}

.list-item {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.list-item:hover {
  background-color: #f8f9fa;
}

.list-item.is-selected {
  background-color: #e3f2fd;
  border-left: 3px solid #1976d2;
}

.org-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.org-id {
  font-size: 0.8rem;
  color: #7f8c8d;
  font-family: monospace;
}

.assignment-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-self: flex-start;
  padding-top: 1rem;
}

.assign-button,
.clear-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.assign-button {
  background-color: #3498db;
  color: white;
}

.assign-button:hover:not(:disabled) {
  background-color: #2980b9;
}

.clear-button {
  background-color: #f8f9fa;
  color: #e74c3c;
  border: 1px solid #e74c3c;
}

.clear-button:hover:not(:disabled) {
  background-color: #fde8e6;
}

.assign-button:disabled,
.clear-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.current-org {
  grid-column: 1 / -1;
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.current-org h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
  font-size: 1.1rem;
}

.current-org-details {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.empty-state {
  padding: 2rem 1rem;
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
}

.agent-option {
  line-height: 1.4;
}

.agent-name {
  font-weight: 500;
}

.agent-org {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .assignment-container {
    grid-template-columns: 1fr;
  }
  
  .assignment-actions {
    flex-direction: row;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .assign-button,
  .clear-button {
    width: 100%;
  }
}
</style>
