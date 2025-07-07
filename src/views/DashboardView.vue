<template>
  <div class="dashboard-container">
    <h1 class="dashboard-title">Dashboard</h1>
    
    <div class="dashboard-stats">
      <div class="stat-card">
        <h3>Organizations</h3>
        <p class="stat-number">{{ organizationsCount }}</p>
        <router-link to="/organizations" class="stat-link">View All</router-link>
      </div>
      
      <div class="stat-card">
        <h3>Agents</h3>
        <p class="stat-number">{{ agentsCount }}</p>
        <router-link to="/agents" class="stat-link">View All</router-link>
      </div>
      
      <div class="stat-card">
        <h3>Users</h3>
        <p class="stat-number">{{ usersCount }}</p>
        <router-link to="/users" class="stat-link">View All</router-link>
      </div>
      
      <div class="stat-card">
        <h3>Files</h3>
        <p class="stat-number">{{ filesCount }}</p>
        <router-link :to="'/agents/' + currentAgentId + '/files'" class="stat-link" v-if="currentAgentId">View All</router-link>
        <span class="disabled-link" v-else>Select an agent first</span>
      </div>
    </div>
    
    <div class="dashboard-sections">
      <div class="section">
        <h2>Recent Agents</h2>
        <div v-if="loading.agents">Loading agents...</div>
        <div v-else-if="agents.length === 0" class="empty-state">
          No agents found. <router-link to="/agents">Create an agent</router-link>
        </div>
        <div v-else class="agent-list">
          <div v-for="agent in agents.slice(0, 5)" :key="agent.id" class="agent-item">
            <div class="agent-info">
              <h3>{{ agent.name }}</h3>
              <p>{{ agent.description }}</p>
            </div>
            <div class="agent-actions">
              <router-link :to="'/agents/' + agent.id" class="view-btn">View</router-link>
            </div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2>Recent Files</h2>
        <div v-if="loading.files">Loading files...</div>
        <div v-else-if="files.length === 0" class="empty-state">
          No files found. Upload files to an agent.
        </div>
        <div v-else class="file-list">
          <div v-for="file in files.slice(0, 5)" :key="file.id" class="file-item">
            <div class="file-info">
              <h3>{{ file.name }}</h3>
              <p>{{ formatFileSize(file.sizeBytes) }} • {{ formatDate(file.createdAt) }}</p>
            </div>
            <div class="file-actions">
              <button @click="downloadFile(file.id)" class="download-btn">Download</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '../store/auth'
import { organizationsApi, agentsApi, filesApi, usersApi } from '../services/api'

const authStore = useAuthStore()
const organizations = ref([])
const agents = ref([])
const users = ref([])
const files = ref([])
const currentAgentId = ref('')

const loading = ref({
  organizations: true,
  agents: true,
  users: true,
  files: true
})

const organizationsCount = computed(() => organizations.value.length)
const agentsCount = computed(() => agents.value.length)
const usersCount = computed(() => users.value.length)
const filesCount = computed(() => files.value.length)

onMounted(async () => {
  if (authStore.isAuthenticated) {
    // Wait for token to be available before fetching data
    if (authStore.token) {
      fetchData()
    } else {
      console.log('Auth token not yet available, waiting...')
      // Wait for token to be available
      const tokenCheckInterval = setInterval(() => {
        if (authStore.token || localStorage.getItem('authToken')) {
          console.log('Auth token now available, fetching data')
          clearInterval(tokenCheckInterval)
          fetchData()
        }
      }, 500) // Check every 500ms
      
      // Safety timeout after 10 seconds
      setTimeout(() => {
        clearInterval(tokenCheckInterval)
        console.warn('Timed out waiting for auth token, attempting to fetch data anyway')
        fetchData()
      }, 10000)
    }
  }
})

// Watch for organization changes and refresh data
watch(() => authStore.organizationId, (newOrgId, oldOrgId) => {
  if (newOrgId && newOrgId !== oldOrgId) {
    console.log('Organization changed, refreshing dashboard data:', newOrgId)
    fetchData()
  }
})

async function fetchData() {
  try {
    // Dashboard data fetching
    console.log('Starting dashboard data fetch, auth state:', { 
      isAuthenticated: authStore.isAuthenticated,
      user: authStore.user,
      token: authStore.token ? 'present' : 'missing',
      organizationId: authStore.organizationId
    })
    
    // Fetch organizations
    loading.value.organizations = true
    try {
      const organizationsResponse = await organizationsApi.getAll()
      // Ensure organizations.value is always an array
      const responseData = organizationsResponse.data || {}
      organizations.value = Array.isArray(responseData.organizations) ? responseData.organizations : 
                            Array.isArray(responseData) ? responseData : []
      
      console.log('Organizations loaded:', organizations.value, 'Raw response:', organizationsResponse.data)
      
      // If we have organizations, use the first one for files
      if (organizations.value.length > 0) {
        currentAgentId.value = organizations.value[0].id
      }
    } catch (orgError) {
      console.warn('Failed to load organizations:', orgError)
      // Set a default organization for development
      organizations.value = []
    } finally {
      loading.value.organizations = false
    }
    
    // Fetch agents for all organizations the user has access to
    loading.value.agents = true
    try {
      // Use 'All' to get agents from all organizations
      console.log('Fetching agents from all organizations')
      
      // First, get a valid organization ID to use for the API call
      // This is needed because the backend has issues with empty organization_id
      let organizationId = 'All'
      if (organizations.value.length > 0) {
        // Find the first real organization (not 'All')
        const firstRealOrg = organizations.value.find(org => org.id !== 'All')
        if (firstRealOrg) {
          // We'll still use 'All' as the parameter but need a valid org ID as backup
          organizationId = 'All'
        }
      }
      
      console.log('Using organizationId for agents API call:', organizationId)
      const agentsResponse = await agentsApi.getAll(organizationId)
      
      // Ensure agents.value is always an array
      const responseData = agentsResponse.data || {}
      agents.value = Array.isArray(responseData.agents) ? responseData.agents : 
                     Array.isArray(responseData) ? responseData : []
      
      console.log('Agents loaded:', agents.value.length, 'for all organizations. Raw response:', agentsResponse.data)
      
      // Set current agent ID for files view if we have agents
      if (agents.value.length > 0) {
        currentAgentId.value = agents.value[0].id
      }
    } catch (agentsError) {
      console.error('Failed to load agents:', agentsError)
      agents.value = [] // Initialize as empty array on error
    } finally {
      loading.value.agents = false
    }
    
    // Fetch files for all organizations the user has access to
    loading.value.files = true
    try {
      console.log('Fetching files from all organizations')
      
      // Use the same approach as users and agents
      // We need to pass a valid organization ID for consistent behavior
      let organizationId = 'All'
      
      // If 'All' is selected, use the first real organization ID
      if (organizationId === 'All' && organizations.value.length > 0) {
        // Find the first non-'All' organization
        const firstRealOrg = organizations.value.find(org => org.id && org.id !== 'All')
        if (firstRealOrg) {
          organizationId = firstRealOrg.id
        }
      }
      
      console.log('Using organizationId for files API call:', organizationId)
      const filesResponse = await filesApi.getAllByOrganization(organizationId)
      
      // Ensure files.value is always an array
      const responseData = filesResponse.data || {}
      const rawFiles = Array.isArray(responseData.files) ? responseData.files : 
                    Array.isArray(responseData) ? responseData : []
      
      // Process files to ensure they have all required properties
      files.value = rawFiles.map(file => ({
        ...file,
        id: file.id || '',
        name: file.name || 'Unnamed File',
        sizeBytes: file.sizeBytes || 0,
        contentType: file.contentType || 'text/markdown',
        createdAt: file.createdAt || new Date().toISOString()
      }))
      
      console.log('Files loaded:', files.value.length, 'for all organizations. Raw response:', filesResponse.data)
    } catch (filesError) {
      console.error('Failed to load files:', filesError)
      files.value = [] // Initialize as empty array on error
    } finally {
      loading.value.files = false
    }
    
    // Fetch all users for the current user (across all their organizations)
    loading.value.users = true
    try {
      console.log('Fetching all users the current user has access to')
      
      // Use the same approach as in UsersView.vue that works correctly
      // We need to pass a valid organization ID, not 'All' directly
      let organizationId = 'All'
      
      // If 'All' is selected, use the first real organization ID
      if (organizationId === 'All' && organizations.value.length > 0) {
        // Find the first non-'All' organization
        const firstRealOrg = organizations.value.find(org => org.id && org.id !== 'All')
        if (firstRealOrg) {
          organizationId = firstRealOrg.id
        }
      }
      
      console.log('Using organizationId for users API call:', organizationId)
      const usersResponse = await usersApi.getAll(organizationId)
      
      // Ensure users.value is always an array
      const responseData = usersResponse.data || {}
      users.value = Array.isArray(responseData.users) ? responseData.users : 
                    Array.isArray(responseData) ? responseData : []
      
      console.log('Users loaded:', users.value.length, 'for all organizations. Raw response:', usersResponse.data)
    } catch (usersError) {
      console.error('Failed to load users:', usersError)
      users.value = [] // Initialize as empty array on error
    } finally {
      loading.value.users = false
    }
    
  } catch (error) {
    console.error('Error in dashboard data fetching:', error)
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

async function downloadFile(fileId) {
  // Validate file ID
  if (!fileId) {
    console.error('Cannot download file: File ID is undefined')
    alert('Error: Cannot download file because the file ID is missing')
    return
  }
  
  try {
    console.log(`Downloading file with ID: ${fileId}`)
    const response = await filesApi.download(fileId)
    
    // Create a blob URL from the file data
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    
    // Get file name from response headers or use a default
    const contentDisposition = response.headers['content-disposition']
    let filename = 'download'
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
      if (filenameMatch && filenameMatch.length >= 2) {
        filename = filenameMatch[1]
      }
    }
    
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    
    // Clean up the blob URL
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading file:', error)
    alert(`Error downloading file: ${error.message || 'Unknown error'}`)
  }
}
</script>

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.dashboard-title {
  margin-bottom: 30px;
  color: #2c3e50;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 10px 0;
  color: #2c3e50;
}

.stat-link {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
}

.disabled-link {
  color: #95a5a6;
  font-weight: 500;
}

.dashboard-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 30px;
}

.section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: #7f8c8d;
}

.agent-list, .file-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.agent-item, .file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.agent-info h3, .file-info h3 {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
}

.agent-info p, .file-info p {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.view-btn, .download-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  font-size: 0.9rem;
}

.download-btn {
  background-color: #2ecc71;
}

.view-btn:hover {
  background-color: #2980b9;
}

.download-btn:hover {
  background-color: #27ae60;
}
</style>
