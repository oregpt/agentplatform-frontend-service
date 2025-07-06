<template>
  <div class="files-container">
    <div class="header">
      <h1>Files</h1>
    </div>

    <div class="organization-selector" v-if="organizations.length > 0">
      <label for="organization">Organization:</label>
      <select id="organization" v-model="selectedOrgId" @change="fetchAgents">
        <option v-for="org in organizations" :key="org.id" :value="org.id">
          {{ org.name }}
        </option>
      </select>
    </div>

    <div class="agent-selector" v-if="agents.length > 0">
      <label for="agent">Agent:</label>
      <select id="agent" v-model="selectedAgentId" @change="navigateToAgentFiles">
        <option v-for="agent in agents" :key="agent.id" :value="agent.id">
          {{ agent.name }}
        </option>
      </select>
      <button 
        v-if="selectedAgentId" 
        @click="navigateToAgentFiles" 
        class="view-files-btn"
      >
        View Files
      </button>
    </div>
    
    <ErrorMessage v-if="error" :message="error" @close="error = null" />
    
    <LoadingSpinner v-if="loading" message="Loading agents..." />
    
    <div v-else-if="agents.length === 0" class="empty-state">
      <p>No agents found in this organization. Create an agent first to manage files.</p>
      <router-link to="/agents" class="create-btn">Go to Agents</router-link>
    </div>
    
    <div v-else-if="!selectedAgentId" class="empty-state">
      <p>Please select an agent to view its files.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { agentsApi, organizationsApi } from '../services/api'
import { useAuthStore } from '../store/auth'
import ErrorMessage from '../components/ErrorMessage.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const router = useRouter()
const authStore = useAuthStore()
const organizations = ref([])
const agents = ref([])
const loading = ref(false)
const error = ref(null)
const selectedOrgId = ref('')
const selectedAgentId = ref('')

onMounted(async () => {
  await fetchOrganizations()
  // Initialize with auth store organization ID or default to first organization
  if (authStore.organizationId) {
    selectedOrgId.value = authStore.organizationId
  } else if (organizations.value.length > 0) {
    // Default to first organization if none selected
    selectedOrgId.value = organizations.value[0].id
  }
  
  // Always fetch agents after organization is set
  await fetchAgents()
  
  // Set up a watcher to detect changes in the auth store organization ID
  watch(() => authStore.organizationId, (newOrgId) => {
    if (newOrgId && newOrgId !== selectedOrgId.value) {
      selectedOrgId.value = newOrgId
      fetchAgents()
    }
  })
})

async function fetchOrganizations() {
  try {
    const response = await organizationsApi.getAll()
    organizations.value = response.data.organizations || []
    
    // Set default organization to first real organization if available
    if (organizations.value.length > 0) {
      selectedOrgId.value = organizations.value[0].id
    }
    
    // Add 'All' option at the beginning AFTER setting the default
    organizations.value.unshift({
      id: 'All',
      name: 'All Organizations'
    })
    
    console.log('Organizations loaded:', organizations.value, 'Selected org:', selectedOrgId.value)
  } catch (err) {
    console.error('Error fetching organizations:', err)
    error.value = 'Failed to load organizations'
  }
}

async function fetchAgents() {
  try {
    loading.value = true
    error.value = null
    console.log('Fetching agents for organization:', selectedOrgId.value)
    const response = await agentsApi.getAll(selectedOrgId.value)
    console.log('Agents API response:', response)
    
    // Check if response has the expected structure
    if (response && response.data) {
      // Extract agents from the response
      if (Array.isArray(response.data.agents)) {
        agents.value = response.data.agents
      } else if (Array.isArray(response.data)) {
        agents.value = response.data
      } else {
        agents.value = []
      }
      
      // If we have agents, select the first one by default
      if (agents.value.length > 0) {
        selectedAgentId.value = agents.value[0].id
      } else {
        selectedAgentId.value = ''
      }
      
      console.log('Agents loaded:', agents.value.length, 'Selected agent:', selectedAgentId.value)
    } else {
      console.error('Unexpected API response format:', response)
      error.value = 'Unexpected API response format'
      agents.value = []
      selectedAgentId.value = ''
    }
  } catch (err) {
    error.value = 'Failed to load agents'
    console.error('Error fetching agents:', err)
    agents.value = []
    selectedAgentId.value = ''
  } finally {
    loading.value = false
  }
}

function navigateToAgentFiles() {
  if (selectedAgentId.value) {
    router.push(`/agents/${selectedAgentId.value}/files`)
  }
}
</script>

<style scoped>
.files-container {
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

.organization-selector,
.agent-selector {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: white;
  min-width: 200px;
}

.view-files-btn {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.view-files-btn:hover {
  background-color: #45a049;
}

.empty-state {
  text-align: center;
  padding: 40px;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-top: 20px;
}

.create-btn {
  display: inline-block;
  margin-top: 15px;
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
}

.create-btn:hover {
  background-color: #45a049;
}
</style>
