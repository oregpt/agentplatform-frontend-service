<template>
  <div class="user-agent-assignments">
    <div class="header">
      <router-link to="/assign" class="back-button">
        <i class="mdi mdi-arrow-left"></i> Back to Assignments
      </router-link>
      <h1>Assign Users to Agents</h1>
    </div>

    <div class="content">
      <div class="user-selection">
        <div class="form-group">
          <label for="user-select">Select User:</label>
          <v-select
            v-model="selectedUser"
            :options="users"
            label="displayName"
            :reduce="user => user.uid"
            placeholder="Search users..."
            @option:selected="loadUserAssignments"
          >
            <template #option="{ displayName, email }">
              <div class="user-option">
                <div class="user-name">{{ displayName }}</div>
                <div class="user-email">{{ email }}</div>
              </div>
            </template>
          </v-select>
        </div>
      </div>

      <div class="assignment-container">
        <div class="panel available-agents">
          <h3>Available Agents</h3>
          <div class="search-box">
            <input
              v-model="agentSearch"
              type="text"
              placeholder="Search agents..."
              class="search-input"
            />
          </div>
          <div class="list-container">
            <div
              v-for="agent in filteredAvailableAgents"
              :key="agent.id"
              class="list-item"
              @click="assignAgent(agent)"
            >
              {{ agent.name }}
              <span class="badge">{{ agent.organization_name }}</span>
            </div>
            <div v-if="filteredAvailableAgents.length === 0" class="empty-state">
              No agents available
            </div>
          </div>
        </div>

        <div class="panel-actions">
          <button @click="assignSelected" :disabled="!selectedAgent" class="action-button">
            <i class="mdi mdi-arrow-right"></i>
          </button>
          <button @click="unassignSelected" :disabled="!selectedAssignedAgent" class="action-button">
            <i class="mdi mdi-arrow-left"></i>
          </button>
        </div>

        <div class="panel assigned-agents">
          <h3>Assigned Agents</h3>
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
              :class="{ selected: selectedAssignedAgent === agent.id }"
              @click="selectAssignedAgent(agent.id)"
            >
              {{ agent.name }}
              <span class="badge">{{ agent.organization_name }}</span>
            </div>
            <div v-if="filteredAssignedAgents.length === 0" class="empty-state">
              No agents assigned
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import { useAuthStore } from '@/store/auth'
import { usersApi, agentsApi, userAgentApi } from '@/services/api'

// Get the global toast instance
const { proxy } = getCurrentInstance()
const toast = proxy.$toast

// State
const users = ref([])
const selectedUser = ref(null)
const availableAgents = ref([])
const assignedAgents = ref([])
const agentSearch = ref('')
const assignedAgentSearch = ref('')
const selectedAgent = ref(null)
const selectedAssignedAgent = ref(null)
const loading = ref(false)

// Computed
const filteredAvailableAgents = computed(() => {
  const search = agentSearch.value.toLowerCase()
  return availableAgents.value.filter(agent => 
    !assignedAgents.value.some(a => a.id === agent.id) &&
    (agent.name.toLowerCase().includes(search) || 
     (agent.organization_name && agent.organization_name.toLowerCase().includes(search)))
  )
})

const filteredAssignedAgents = computed(() => {
  const search = assignedAgentSearch.value.toLowerCase()
  return assignedAgents.value.filter(agent => 
    agent.name.toLowerCase().includes(search) ||
    (agent.organization_name && agent.organization_name.toLowerCase().includes(search))
  )
})

// Methods
async function loadUsers() {
  try {
    loading.value = true
    const response = await usersApi.getAll()
    users.value = response.data || []
  } catch (error) {
    console.error('Error loading users:', error)
    toast.error('Failed to load users')
  } finally {
    loading.value = false
  }
}

async function loadAvailableAgents() {
  try {
    loading.value = true
    const response = await agentsApi.getAll()
    availableAgents.value = response.data || []
  } catch (error) {
    console.error('Error loading agents:', error)
    toast.error('Failed to load available agents')
  } finally {
    loading.value = false
  }
}

async function loadUserAssignments() {
  if (!selectedUser.value) {
    assignedAgents.value = []
    return
  }
  
  try {
    loading.value = true
    const response = await userAgentApi.getUserAgents(selectedUser.value)
    assignedAgents.value = response.data || []
  } catch (error) {
    console.error('Error loading user assignments:', error)
    toast.error('Failed to load user assignments')
  } finally {
    loading.value = false
  }
}

async function assignAgent(agent) {
  if (!selectedUser.value || !agent) return
  
  try {
    loading.value = true
    await userAgentApi.assignUserToAgent(selectedUser.value, agent.id)
    await loadUserAssignments()
    toast.success('Agent assigned successfully')
  } catch (error) {
    console.error('Error assigning agent:', error)
    toast.error('Failed to assign agent')
  } finally {
    loading.value = false
  }
}

async function unassignAgent(agentId) {
  if (!selectedUser.value || !agentId) return
  
  try {
    loading.value = true
    await userAgentApi.removeUserFromAgent(selectedUser.value, agentId)
    await loadUserAssignments()
    toast.success('Agent unassigned successfully')
  } catch (error) {
    console.error('Error unassigning agent:', error)
    toast.error('Failed to unassign agent')
  } finally {
    loading.value = false
  }
}

function selectAssignedAgent(agentId) {
  selectedAssignedAgent.value = agentId
}

async function assignSelected() {
  if (!selectedAgent.value) return
  await assignAgent(selectedAgent.value)
  selectedAgent.value = null
}

async function unassignSelected() {
  if (!selectedAssignedAgent.value) return
  await unassignAgent(selectedAssignedAgent.value)
  selectedAssignedAgent.value = null
}

// Lifecycle hooks
onMounted(() => {
  loadUsers()
  loadAvailableAgents()
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
