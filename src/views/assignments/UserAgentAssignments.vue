<template>
  <div class="user-agent-assignments">
    <div class="header">
      <router-link to="/assign" class="back-button">
        <i class="mdi mdi-arrow-left"></i> Back to Assignments
      </router-link>
      <h1>Manage Agent Assignments</h1>
    </div>

    <div class="content">
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
              {{ org.name }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="!selectedOrgId" class="empty-state">
        <p>Please select an organization to view and manage agent assignments.</p>
      </div>
      
      <div v-else class="assignment-container">
        <div class="panel available-agents">
          <h3>Available Agents</h3>
          <p class="help-text">Agents available to you but not in this organization</p>
          <div class="search-box">
            <input
              v-model="agentSearch"
              type="text"
              placeholder="Search available agents..."
              class="search-input"
            />
          </div>
          <div class="list-container">
            <div
              v-for="agent in filteredAvailableAgents"
              :key="agent.id"
              class="list-item"
              @click="selectAgent(agent)"
              :class="{ selected: selectedAgent?.id === agent.id }"
            >
              {{ agent.name }}
            </div>
            <div v-if="filteredAvailableAgents.length === 0" class="empty-state">
              No agents available
            </div>
          </div>
        </div>

        <div class="panel-actions">
          <button 
            @click="assignSelected" 
            :disabled="!selectedAgent" 
            class="action-button"
            title="Assign selected agent"
          >
            <i class="mdi mdi-arrow-right"></i>
          </button>
          <button 
            @click="unassignSelected" 
            :disabled="!selectedAssignedAgent" 
            class="action-button"
            title="Unassign selected agent"
          >
            <i class="mdi mdi-arrow-left"></i>
          </button>
        </div>

        <div class="panel assigned-agents">
          <h3>Assigned to Organization</h3>
          <p class="help-text">Agents currently in {{ organizations.find(o => o.id === selectedOrgId)?.name || 'selected organization' }}</p>
          <div class="search-box">
            <input
              v-model="assignedAgentSearch"
              type="text"
              placeholder="Search assigned agents..."
              class="search-input"
            />
          </div>
          <div class="list-container">
            <div
              v-for="agent in filteredAssignedAgents"
              :key="agent.id"
              class="list-item"
              :class="{ selected: selectedAssignedAgent?.id === agent.id }"
              @click="selectAssignedAgent(agent)"
            >
              {{ agent.name }}
            </div>
            <div v-if="filteredAssignedAgents.length === 0" class="empty-state">
              No agents in this organization
            </div>
          </div>
        </div>
        <div v-if="selectedOrgId" class="form-actions">
          <button 
            @click="saveAssignments" 
            :disabled="!changesMade"
            class="btn btn-primary"
          >
            Save Changes
          </button>
          <button 
            @click="resetSelections" 
            class="btn btn-secondary"
            :disabled="!changesMade"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import { useAuthStore } from '@/store/auth'
import { organizationsApi, agentsApi, userAgentApi } from '@/services/api'

// Get the global toast instance
const { proxy } = getCurrentInstance()
const toast = proxy.$toast
const authStore = useAuthStore()

// State
const organizations = ref([])
const selectedOrgId = ref('')
const availableAgents = ref([])  // Agents available to user but not in org
const assignedAgents = ref([])   // Agents in the selected org
const agentSearch = ref('')
const assignedAgentSearch = ref('')
const selectedAgent = ref(null)
const selectedAssignedAgent = ref(null)
const loading = ref(false)
const error = ref('')
const changesMade = ref(false)

// Computed
const filteredAvailableAgents = computed(() => {
  const search = agentSearch.value.toLowerCase()
  return availableAgents.value.filter(agent => 
    !assignedAgents.value.some(a => a.id === agent.id) &&
    agent.name.toLowerCase().includes(search)
  )
})

const filteredAssignedAgents = computed(() => {
  const search = assignedAgentSearch.value.toLowerCase()
  return assignedAgents.value.filter(agent => 
    agent.name.toLowerCase().includes(search)
  )
})

const showAgentLists = computed(() => selectedOrgId.value && !loading.value)

// Methods
async function loadOrganizations() {
  try {
    loading.value = true
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
    // Get all agents available to the current user
    const response = await userAgentApi.getUserAgents(authStore.user.uid)
    const userAgents = Array.isArray(response.data) ? response.data : []
    
    // Get assigned agent IDs to exclude
    const assignedAgentIds = new Set(assignedAgents.value.map(a => a.id))
    
    // Filter out agents already assigned to the org
    availableAgents.value = userAgents.filter(agent => !assignedAgentIds.has(agent.id))
  } catch (error) {
    console.error('Error loading available agents:', error)
    error.value = 'Failed to load available agents'
    toast.error('Failed to load available agents')
  } finally {
    loading.value = false
  }
}

function onOrgChange() {
  if (selectedOrgId.value) {
    changesMade.value = false
    Promise.all([loadAssignedAgents(), loadAvailableAgents()])
  } else {
    assignedAgents.value = []
    availableAgents.value = []
  }
}

function assignAgent(agent) {
  if (!agent) return
  
  // Move agent from available to assigned
  const agentIndex = availableAgents.value.findIndex(a => a.id === agent.id)
  if (agentIndex !== -1) {
    const [movedAgent] = availableAgents.value.splice(agentIndex, 1)
    assignedAgents.value.push(movedAgent)
    changesMade.value = true
  }
}

async function unassignAgent(agent) {
  if (!agent) return
  
  // Move agent from assigned back to available
  const agentIndex = assignedAgents.value.findIndex(a => a.id === agent.id)
  if (agentIndex !== -1) {
    const [movedAgent] = assignedAgents.value.splice(agentIndex, 1)
    availableAgents.value.push(movedAgent)
    changesMade.value = true
  }
}

function selectAgent(agent) {
  selectedAgent.value = agent
  selectedAssignedAgent.value = null
}

function selectAssignedAgent(agent) {
  selectedAssignedAgent.value = agent
  selectedAgent.value = null
}

async function saveAssignments() {
  if (!selectedOrgId.value) return
  
  try {
    loading.value = true
    // Get the current user's ID
    const userId = authStore.user.uid
    
    // Get current assignments to determine what changed
    const currentAssignments = new Set(assignedAgents.value.map(a => a.id))
    
    // Get previous assignments (from available agents)
    const previousAssignments = new Set(availableAgents.value.map(a => a.id))
    
    // Determine agents to add and remove
    const agentsToAdd = assignedAgents.value.filter(agent => !previousAssignments.has(agent.id))
    const agentsToRemove = Array.from(availableAgents.value)
      .filter(agent => !currentAssignments.has(agent.id))
      .map(agent => agent.id)
    
    // Batch update assignments
    const addPromises = agentsToAdd.map(agent => 
      userAgentApi.assignUserToAgent(userId, agent.id)
    )
    
    const removePromises = agentsToRemove.map(agentId => 
      userAgentApi.removeUserFromAgent(userId, agentId)
    )
    
    await Promise.all([...addPromises, ...removePromises])
    
    // Reload data to ensure consistency
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
    selectedAgent.value = null
    selectedAssignedAgent.value = null
    changesMade.value = false
  } catch (error) {
    console.error('Error resetting assignments:', error)
    error.value = 'Failed to reset assignments'
    toast.error('Failed to reset changes')
  } finally {
    loading.value = false
  }
}

async function assignSelected() {
  if (!selectedAgent.value) return
  assignAgent(selectedAgent.value)
  selectedAgent.value = null
}

async function unassignSelected() {
  if (!selectedAssignedAgent.value) return
  unassignAgent(selectedAssignedAgent.value)
  selectedAssignedAgent.value = null
}

// Lifecycle hooks
onMounted(() => {
  loadOrganizations()
})
</script>

<style scoped>
.user-agent-assignments {
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

.user-selection {
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

.empty-state {
  padding: 2rem 1rem;
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
}

.user-option {
  line-height: 1.4;
}

.user-name {
  font-weight: 500;
}

.user-email {
  font-size: 0.85rem;
  color: #7f8c8d;
}

@media (max-width: 768px) {
  .assignment-container {
    flex-direction: column;
  }
  
  .panel-actions {
    flex-direction: row;
    justify-content: center;
  }
}
</style>
