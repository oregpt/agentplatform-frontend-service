<template>
  <div class="agent-org-assignments">
    <div class="header">
      <router-link to="/assign" class="back-button">
        <i class="mdi mdi-arrow-left"></i> Back to Assignments
      </router-link>
      <h1>Agent Organization Assignments</h1>
    </div>
    
    <div class="content">
      <!-- Top buttons removed, keeping only the lower set -->
      
      <div class="organization-selection">
        <div class="form-group">
          <label for="org-select">Select Organization:</label>
          <select 
            id="org-select" 
            v-model="selectedOrgId" 
            class="form-control"
            @change="onOrgChange"
          >
            <option value="" disabled>Select an organization</option>
            <option 
              v-for="org in organizations" 
              :key="org.id" 
              :value="org.id"
            >
              {{ org.name || org.id }}
            </option>
          </select>
        </div>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-if="!selectedOrgId" class="empty-state">
        <p>Please select an organization to view and manage agent assignments.</p>
      </div>
      
      <div v-else>
        <!-- Action buttons at the top right -->
        <div v-if="selectedOrgId" class="form-actions top-actions">
          <button 
            @click="saveAssignments" 
            :disabled="!changesMade || loading"
            class="btn btn-primary"
          >
            <i class="mdi mdi-content-save"></i> Save Changes
          </button>
          <button 
            @click="resetSelections" 
            class="btn btn-secondary"
            :disabled="!changesMade || loading"
          >
            <i class="mdi mdi-refresh"></i> Reset
          </button>
          <button 
            @click="clearAllAgents" 
            class="btn btn-danger clear-button"
            :disabled="loading"
            title="Remove all agents from this organization"
          >
            <i class="mdi mdi-delete-sweep"></i> Clear All
          </button>
        </div>
        
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading...</p>
        </div>
        
        <div v-else class="assignment-container">
          <div class="panel available-agents-panel">
            <h3 class="panel-header">Available Agents</h3>
            <div class="help-text">Agents that can be assigned to this organization</div>
            
            <div class="search-box">
              <input
                type="text"
                v-model="agentSearch"
                placeholder="Search available agents..."
                class="search-input"
              />
            </div>
            
            <div class="list-container">
              <div 
                v-for="agent in filteredAvailableAgents" 
                :key="agent.id"
                class="list-item"
                :class="{ 'selected': selectedOrg && selectedOrg.id === agent.id }"
                @click="selectOrg(agent)"
              >
                <div>{{ agent.name || agent.id }}</div>
              </div>
            </div>
              
            <div v-if="filteredAvailableAgents.length === 0" class="empty-state">
              No available agents found
            </div>
          </div>
          
          <div class="panel-actions">
            <button 
              class="action-button" 
              @click="assignSelected" 
              :disabled="!selectedOrg || loading"
              title="Assign selected agent"
            >
              <i class="mdi mdi-arrow-right"></i>
            </button>
            
            <button 
              class="action-button" 
              @click="unassignSelected" 
              :disabled="!selectedAssignedOrg || loading"
              title="Unassign selected agent"
            >
              <i class="mdi mdi-arrow-left"></i>
            </button>
          </div>
          
          <div class="panel assigned-agents-panel">
            <h3 class="panel-header">Assigned Agents</h3>
            <div class="help-text">Agents currently assigned to this organization</div>
            
            <div class="search-box">
              <input
                type="text"
                v-model="assignedAgentSearch"
                placeholder="Search assigned agents..."
                class="search-input"
              />
            </div>
            
            <div class="list-container">
              <div 
                v-for="agent in filteredAssignedAgents" 
                :key="agent.id"
                class="list-item"
                :class="{ 'selected': selectedAssignedOrg && selectedAssignedOrg.id === agent.id }"
                @click="selectAssignedOrg(agent)"
              >
                <div>{{ agent.name || agent.id }}</div>
              </div>
            </div>
              
            <div v-if="filteredAssignedAgents.length === 0" class="empty-state">
              No agents assigned to this organization
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import { agentsApi, organizationsApi } from '@/services/api'

// Get the global toast instance
const { proxy } = getCurrentInstance()
const toast = proxy.$toast

// State
const agents = ref([])
const organizations = ref([])
const selectedOrgId = ref('')
const availableAgents = ref([])  // Agents not assigned to organization
const assignedAgents = ref([])   // Agents assigned to the organization
const agentSearch = ref('')
const assignedAgentSearch = ref('')
const selectedOrg = ref(null)
const selectedAssignedOrg = ref(null)
const loading = ref(false)
const error = ref('')
const changesMade = ref(false)

// Computed
const filteredAvailableAgents = computed(() => {
  const search = agentSearch.value.toLowerCase()
  return availableAgents.value.filter(agent => 
    agent.name && agent.name.toLowerCase().includes(search)
  )
})

const filteredAssignedAgents = computed(() => {
  const search = assignedAgentSearch.value.toLowerCase()
  return assignedAgents.value.filter(agent => 
    agent.name && agent.name.toLowerCase().includes(search)
  )
})

const showOrgLists = computed(() => selectedOrgId.value && !loading.value)

// Methods
async function loadAgents() {
  try {
    loading.value = true
    error.value = ''
    const response = await agentsApi.getAll()
    if (response && response.data) {
      agents.value = Array.isArray(response.data) ? response.data : 
                   (Array.isArray(response.data?.agents) ? response.data.agents : [])
    } else {
      agents.value = []
    }
  } catch (error) {
    console.error('Error loading agents:', error)
    error.value = 'Failed to load agents'
    toast.error('Failed to load agents')
  } finally {
    loading.value = false
  }
}

async function loadOrganizations() {
  try {
    loading.value = true
    error.value = ''
    const response = await organizationsApi.getAll()
    if (response.data && Array.isArray(response.data.organizations)) {
      organizations.value = response.data.organizations
    } else if (Array.isArray(response.data)) {
      organizations.value = response.data
    } else {
      organizations.value = []
    }
  } catch (error) {
    console.error('Error loading organizations:', error)
    error.value = 'Failed to load organizations'
    toast.error('Failed to load organizations')
  } finally {
    loading.value = false
  }
}

async function loadAssignedAgents() {
  if (!selectedOrgId.value) {
    assignedAgents.value = []
    return
  }
  
  try {
    loading.value = true
    const response = await agentsApi.getAll(selectedOrgId.value)
    assignedAgents.value = Array.isArray(response.data) ? response.data : 
                         (Array.isArray(response.data?.agents) ? response.data.agents : [])
  } catch (error) {
    console.error('Error loading assigned agents:', error)
    error.value = 'Failed to load assigned agents'
    toast.error('Failed to load assigned agents')
  } finally {
    loading.value = false
  }
}

async function loadAvailableAgents() {
  try {
    loading.value = true
    error.value = ''
    
    // Get all agents the current user has access to
    const response = await agentsApi.getAll()
    const allAgents = Array.isArray(response.data) ? response.data : 
                    (Array.isArray(response.data?.agents) ? response.data.agents : [])
    
    // Get the list of agents already assigned to the organization
    const assignedAgentIds = new Set(assignedAgents.value.map(a => a.id))
    
    // Filter out agents that are already assigned to the organization
    availableAgents.value = allAgents.filter(agent => !assignedAgentIds.has(agent.id))
    
  } catch (error) {
    console.error('Error loading available agents:', error)
    error.value = 'Failed to load available agents'
    toast.error('Failed to load available agents')
  } finally {
    loading.value = false
  }
}

function selectOrg(agent) {
  selectedOrg.value = agent
  selectedAssignedOrg.value = null
}

function selectAssignedOrg(agent) {
  selectedAssignedOrg.value = agent
  selectedOrg.value = null
}

function assignSelected() {
  if (!selectedOrg.value) return
  
  // Add the selected agent to the assigned list
  assignedAgents.value.push(selectedOrg.value)
  
  // Remove it from the available list
  availableAgents.value = availableAgents.value.filter(a => a.id !== selectedOrg.value.id)
  
  // Reset selection
  selectedOrg.value = null
  
  // Mark that changes have been made
  changesMade.value = true
}

function unassignSelected() {
  if (!selectedAssignedOrg.value) return
  
  // Add the selected agent back to the available list
  availableAgents.value.push(selectedAssignedOrg.value)
  
  // Remove it from the assigned list
  assignedAgents.value = assignedAgents.value.filter(a => a.id !== selectedAssignedOrg.value.id)
  
  // Reset selection
  selectedAssignedOrg.value = null
  
  // Mark that changes have been made
  changesMade.value = true
}

async function clearAllAgents() {
  if (!selectedOrgId.value) return
  
  try {
    loading.value = true
    error.value = ''
    
    // Get all agents assigned to this organization
    const agentsToUpdate = agents.value.filter(agent => agent.organization_id === selectedOrgId.value)
    
    // Update each agent to remove the organization assignment
    const updatePromises = agentsToUpdate.map(agent => 
      agentsApi.update(agent.id, {
        organization_id: null
      }).then(() => {
        // Update local state
        const agentIndex = agents.value.findIndex(a => a.id === agent.id)
        if (agentIndex !== -1) {
          agents.value[agentIndex].organization_id = null
        }
      })
    )
    
    await Promise.all(updatePromises)
    
    // Refresh the lists
    await Promise.all([loadAssignedAgents(), loadAvailableAgents()])
    
    toast.success('All agents removed from organization')
  } catch (error) {
    console.error('Error removing agents from organization:', error)
    toast.error('Failed to remove agents from organization')
  } finally {
    loading.value = false
  }
}

async function saveAssignments() {
  if (!selectedOrgId.value) return
  
  try {
    loading.value = true
    error.value = ''
    
    const orgId = selectedOrgId.value
    
    // Get the current assignments to determine what changed
    const currentAssignments = new Set(assignedAgents.value.map(agent => agent.id))
    
    // Get all agents that should be assigned to this organization
    const agentsToUpdate = [...agents.value]
    
    // Update each agent's organization_id based on whether they're in the assigned list
    const updatePromises = agentsToUpdate.map(agent => {
      const shouldBeAssigned = currentAssignments.has(agent.id)
      const isCurrentlyAssigned = agent.organization_id === orgId
      
      // Only update if the assignment state has changed
      if (shouldBeAssigned !== isCurrentlyAssigned) {
        return agentsApi.update(agent.id, {
          organization_id: shouldBeAssigned ? orgId : null
        }).then(() => {
          // Update local state
          const agentIndex = agents.value.findIndex(a => a.id === agent.id)
          if (agentIndex !== -1) {
            agents.value[agentIndex].organization_id = shouldBeAssigned ? orgId : null
          }
        })
      }
      return Promise.resolve() // No change needed
    })
    
    await Promise.all(updatePromises)
    
    // Refresh the lists
    await Promise.all([loadAssignedAgents(), loadAvailableAgents()])
    
    changesMade.value = false
    toast.success('Agent assignments updated successfully')
  } catch (error) {
    console.error('Error saving assignments:', error)
    error.value = 'Failed to save agent assignments'
    toast.error('Failed to save changes')
  } finally {
    loading.value = false
  }
}

async function resetSelections() {
  if (!selectedOrgId.value) return
  
  // Reset to initial state by reloading data
  try {
    loading.value = true
    await Promise.all([loadAssignedAgents(), loadAvailableAgents()])
    selectedOrg.value = null
    selectedAssignedOrg.value = null
    changesMade.value = false
  } catch (error) {
    console.error('Error resetting assignments:', error)
    error.value = 'Failed to reset assignments'
    toast.error('Failed to reset changes')
  } finally {
    loading.value = false
  }
}

// These functions were duplicated and have been removed

function onOrgChange() {
  if (selectedOrgId.value) {
    changesMade.value = false
    error.value = ''
    loading.value = true
    Promise.all([loadAssignedAgents(), loadAvailableAgents()])
      .finally(() => {
        loading.value = false
      })
  } else {
    assignedAgents.value = []
    availableAgents.value = []
  }
}

// Lifecycle hooks
onMounted(async () => {
  try {
    loading.value = true
    await Promise.all([loadAgents(), loadOrganizations()])
  } catch (error) {
    console.error('Error initializing component:', error)
    toast.error('Failed to load data')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.agent-org-assignments {
  max-width: 1200px;
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
  display: flex;
  gap: 2rem;
  margin-top: 1.5rem;
}

.panel {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel h3 {
  background-color: #f8f9fa;
  margin: 0;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  font-size: 1rem;
  color: #2c3e50;
}

.panel-content {
  padding: 0.5rem 0;
}

.help-text {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin: 0.5rem 0;
  padding: 0 1rem;
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
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-item:hover {
  background-color: #f8f9fa;
}

.list-item.selected {
  background-color: #e3f2fd;
}

.badge {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.panel-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
}

.action-button {
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.action-button:hover:not(:disabled) {
  background: #2980b9;
}

.action-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
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

.form-actions {
  margin: 1rem 0;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.top-actions {
  margin-bottom: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-secondary {
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  color: #555;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e9ecef;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .assignment-container {
    flex-direction: column;
  }
  
  .panel-actions {
    flex-direction: row;
    justify-content: center;
  }
  
  .assign-button,
  .clear-button {
    width: 100%;
  }
}
</style>
