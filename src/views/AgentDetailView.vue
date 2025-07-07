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
        <div class="top-section">
          <div class="title-section">
            <router-link to="/agents" class="back-button">
              <i class="fas fa-arrow-left"></i> Back to Agents
            </router-link>
            <h1>{{ agent.name }}</h1>
            <span class="agent-id">ID: {{ agent.id }}</span>
          </div>
          
          <div class="actions">
            <button @click="openEditModal()" class="edit-btn">Edit Agent</button>
            <button @click="confirmDelete(agent)" class="delete-btn">Delete Agent</button>
          </div>
        </div>
        
      </div>
      
      <!-- Organization dropdowns removed as requested -->
      
      <div class="actions secondary-actions">
        <router-link :to="`/agents/${agent.id}/files`" class="files-btn">Manage Files</router-link>
      </div>
      
      <div class="agent-content">
        <div class="agent-info-card">
          <h2>Agent Information</h2>
          <div class="info-row">
            <span class="label">Agent Name:</span>
            <span class="value">{{ agent.name }}</span>
          </div>
          <div class="info-row">
            <span class="label">Agent ID:</span>
            <span class="value">{{ agent.id }}</span>
          </div>
          <div class="info-row" v-if="agent.description">
            <span class="label">Description:</span>
            <p class="value description">{{ agent.description }}</p>
          </div>
          <div class="info-row">
            <span class="label">Instructions:</span>
            <p class="value description">{{ agent.instructions || 'No instructions provided' }}</p>
          </div>
          <div class="info-row">
            <span class="label">AI Provider:</span>
            <span class="value">{{ agent.ai_provider || agent.AIProvider || agent.aiProvider || 'Not specified' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Created By:</span>
            <span class="value">{{ agent.created_by || agent.createdBy || 'Unknown' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Created At:</span>
            <span class="value">{{ formatDate(agent.created_at || agent.createdAt) }}</span>
          </div>
        </div>
        
        <div class="agent-metadata-card" v-if="hasMetadata">
          <h2>Metadata</h2>
          <pre class="metadata-json">{{ prettyMetadata }}</pre>
        </div>
        
        <div class="agent-users-card">
          <div class="card-header">
            <h2>Users ({{ users.length }})</h2>
            <button @click="openAddUserModal()" class="add-user-btn">Add User</button>
          </div>
          <div v-if="users.length === 0" class="empty-state">
            <p>No users have access to this agent.</p>
          </div>
          <ul v-else class="users-list">
            <li v-for="user in users" :key="user.id" class="user-item">
              <div class="user-info">
                <div class="user-name">{{ user.name && user.name !== `User ID: ${user.id}` ? user.name : 'Unknown User' }}</div>
                <div class="user-details">
                  <span class="detail-label">Email:</span>
                  <span class="user-email">{{ user.email !== 'Unknown Email' ? user.email : 'Not available' }}</span>
                </div>
                <div class="user-details" v-if="user.organization_name">
                  <span class="detail-label">Organization:</span>
                  <span class="user-org">{{ user.organization_name }}</span>
                </div>
              </div>
              <button @click="removeUser(user)" class="remove-user-btn">
                <i class="fas fa-x"></i>
              </button>
            </li>
          </ul>
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
                <h3>{{ user.displayName || user.name || user.email }}</h3>
                <p class="user-email">{{ user.email }}</p>
                <p class="user-org" v-if="user.organization_name">{{ user.organization_name }}</p>
              </div>
              <button @click="addUser(user)" class="add-btn">Grant Access</button>
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
const organizations = ref([])
// Organization selection removed as requested
const users = ref([])
const availableUsers = ref([])
const files = ref([])
const loading = ref(true)
const loadingAvailableUsers = ref(false)
const showEditModal = ref(false)
const showAddUserModal = ref(false)
const showDeleteModal = ref(false)
const formData = ref({
  name: '',
  description: '',
  instructions: '',
  aiProvider: '',
  metadataJson: '{}'
})

const agentId = computed(() => route.params.id)
const getOrgName = (orgId) => {
  const org = organizations.value.find(o => o.id === orgId)
  return org ? org.name : 'Unknown'
}
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
    console.log('Raw agent data from API:', JSON.stringify(agentResponse.data, null, 2))
    agent.value = agentResponse.data
    
    // Fetch organizations for reference only (not for dropdown)
    try {
      const orgsResponse = await organizationsApi.getAll()
      
      if (orgsResponse.data && orgsResponse.data.organizations) {
        organizations.value = orgsResponse.data.organizations
      } else if (Array.isArray(orgsResponse.data)) {
        organizations.value = orgsResponse.data
      } else {
        organizations.value = []
      }
      
      console.log('Organizations loaded in AgentDetailView:', organizations.value.length)
    } catch (orgError) {
      console.error('Error fetching organizations:', orgError)
      organizations.value = []
    }
    
    // Fetch users assigned to this agent across all accessible organizations
    await fetchAssignedUsers()

    // Fetch files for this agent
    try {
      const filesResponse = await filesApi.getByAgentId(agentId.value)
      files.value = filesResponse.data
    } catch (fileError) {
      console.error('Error fetching files for agent:', fileError)
      files.value = []
    }
  } catch (error) {
    console.error('Error fetching agent details:', error)
  } finally {
    loading.value = false
  }
}

async function fetchAssignedUsers() {
  try {
    // Get all organizations the current user has access to
    const orgsResponse = await organizationsApi.getAll();
    let userOrgs = [];
    
    if (orgsResponse.data && orgsResponse.data.organizations) {
      userOrgs = orgsResponse.data.organizations;
    } else if (Array.isArray(orgsResponse.data)) {
      userOrgs = orgsResponse.data;
    } else {
      userOrgs = [];
      console.warn('No organizations found in response');
    }
    
    console.log(`Organizations loaded in AgentDetailView: ${userOrgs.length}`);
    
    // Create a set of organization IDs the user has access to for quick lookup
    const userAccessibleOrgIds = new Set();
    userOrgs.forEach(org => {
      userAccessibleOrgIds.add(org.id);
    });
    
    // Create a map of organization names by ID for display
    const orgNameMap = {};
    userOrgs.forEach(org => {
      orgNameMap[org.id] = org.name;
    });
    
    // Create a map to store all users by ID
    const allUsersMap = {};
    
    // Fetch users from all organizations the user has access to
    for (const org of userOrgs) {
      try {
        const orgUsers = await usersApi.getAll(org.id);
        
        // Handle different response structures
        if (orgUsers && orgUsers.data) {
          // If it's an array, process each user
          if (Array.isArray(orgUsers.data)) {
            console.log(`Found ${orgUsers.data.length} users in organization ${org.id}`);
            
            orgUsers.data.forEach(user => {
              const userId = user.user_id || user.id;
              if (userId) {
                allUsersMap[userId] = {
                  ...user,
                  organization_id: org.id,
                  organization_name: org.name
                };
              }
            });
          } 
          // If it's a single user object
          else if (typeof orgUsers.data === 'object') {
            const user = orgUsers.data;
            const userId = user.user_id || user.id;
            if (userId) {
              allUsersMap[userId] = {
                ...user,
                organization_id: org.id,
                organization_name: org.name
              };
              console.log(`Added single user ${userId} from organization ${org.id}`);
            }
          }
        }
      } catch (orgError) {
        console.error(`Error fetching users for organization ${org.id}:`, orgError);
      }
    }
    
    console.log('All users map:', allUsersMap);
    
    // Make a single API call to get all users for this agent
    try {
      const response = await userAgentApi.getUsersForAgent(agentId.value);
      console.log('Raw agent user mappings response:', response);
      
      // Handle empty response
      if (!response || !response.data) {
        console.log('No users assigned to this agent');
        users.value = [];
        return;
      }
      
      // Handle different response structures
      let userMappings = [];
      
      if (Array.isArray(response.data)) {
        userMappings = response.data;
      } else if (typeof response.data === 'object') {
        // If it's a single object, wrap it in an array
        userMappings = [response.data];
      }
      
      console.log('Processed user mappings:', userMappings);
      
      if (userMappings.length === 0) {
        console.log('No user mappings found');
        users.value = [];
        return;
      }
      
      // Include the current user in the users list if they're not already there
      const currentUserId = localStorage.getItem('userId');
      if (currentUserId) {
        // If the current user isn't in allUsersMap, add them
        if (!allUsersMap[currentUserId]) {
          const currentUserEmail = localStorage.getItem('userEmail') || 'Current User';
          allUsersMap[currentUserId] = {
            id: currentUserId,
            email: currentUserEmail,
            name: currentUserEmail,
            role: 'User'
          };
        }
      }
      
      // Process all user mappings
      const processedUsers = [];
      
      userMappings.forEach(mapping => {
        // Extract user and org IDs, handling different field names
        const userId = mapping.user_id || mapping.UserID || mapping.userId || mapping.id;
        const orgId = mapping.organization_id || mapping.OrganizationID || mapping.organizationId;
        
        if (!userId) {
          console.warn('Mapping missing user ID:', mapping);
          return;
        }
        
        // Get user details from our map
        const user = allUsersMap[userId];
        
        // Create a user object with all available information
        const userObject = {
          id: userId,
          user_id: userId,
          email: user?.email || 'Unknown Email',
          name: user?.display_name || user?.name || user?.displayName || user?.email || `User ID: ${userId}`,
          role: user?.role || 'User',
          organization_id: orgId || (user?.organization_id),
          organization_name: orgId ? (orgNameMap[orgId] || 'Unknown Organization') : (user?.organization_name || 'Unknown Organization')
        };
        
        processedUsers.push(userObject);
      });
      
      // Set the users
      users.value = processedUsers;
      console.log(`Found ${users.value.length} users assigned to this agent`);
    } catch (error) {
      console.error('Error fetching agent users:', error);
      users.value = [];
    }
  } catch (error) {
    console.error('Error fetching assigned users:', error);
    users.value = [];
  }
}

async function updateAgent() {
  try {
    // Parse metadata JSON
    let metadata = {}
    try {
      metadata = JSON.parse(formData.value.metadataJson)
    } catch (jsonError) {
      console.error('Error parsing metadata JSON:', jsonError)
      alert('Invalid metadata JSON format. Please check your JSON syntax.')
      return
    }
    
    // Ensure aiProvider is set
    if (!formData.value.aiProvider) {
      alert('AI Provider is required. Please select an AI Provider.')
      return
    }
    
    console.log('Updating agent with data:', {
      name: formData.value.name,
      description: formData.value.description,
      instructions: formData.value.instructions,
      aiProvider: formData.value.aiProvider
    })
    
    // The backend model uses ai_provider (snake_case) for JSON
    const updatedAgent = {
      name: formData.value.name,
      description: formData.value.description,
      instructions: formData.value.instructions,
      ai_provider: formData.value.aiProvider, // This is the correct field name based on the backend model
      metadata: metadata
    }
    
    console.log('Full payload being sent to API:', updatedAgent)
    
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
    alert(`Error updating agent: ${error.response?.data?.error || error.message || 'Unknown error'}`)
  }
}

async function openAddUserModal() {
  // Get the organizations for adding users
  if (organizations.value.length === 0) {
    alert('You need access to at least one organization to add users');
    return;
  }
  
  showAddUserModal.value = true;
  loadingAvailableUsers.value = true;
  availableUsers.value = [];
  
  try {
    // Fetch users from all organizations the current user has access to
    const allAvailableUsers = [];
    
    for (const org of organizations.value) {
      try {
        const orgUsers = await usersApi.getAll(org.id);
        console.log(`Add user modal - Response for org ${org.id}:`, orgUsers);
        
        // Handle different response structures
        if (orgUsers && orgUsers.data) {
          let usersToAdd = [];
          
          // If it's an array, process each user
          if (Array.isArray(orgUsers.data)) {
            console.log(`Found ${orgUsers.data.length} users in organization ${org.id}`);
            
            usersToAdd = orgUsers.data.map(user => ({
              ...user,
              organization_id: org.id,
              organization_name: org.name
            }));
          } 
          // If it's a single user object
          else if (typeof orgUsers.data === 'object') {
            const user = orgUsers.data;
            const userId = user.user_id || user.id;
            if (userId) {
              usersToAdd = [{
                ...user,
                organization_id: org.id,
                organization_name: org.name
              }];
              console.log(`Added single user ${userId} from organization ${org.id}`);
            }
          }
          
          allAvailableUsers.push(...usersToAdd);
        }
      } catch (orgError) {
        console.error(`Error fetching users for organization ${org.id}:`, orgError);
      }
    }
    
    // Filter out users that are already assigned to this agent
    availableUsers.value = allAvailableUsers.filter(user => {
      return !users.value.some(assignedUser => 
        assignedUser.id === (user.id || user.user_id)
      );
    });
    
    console.log(`Found ${availableUsers.value.length} available users to add to this agent`);
  } catch (error) {
    console.error('Error fetching available users:', error);
  } finally {
    loadingAvailableUsers.value = false;
  }
}

async function addUser(user) {
  // Use the first organization for adding users
  if (organizations.value.length === 0) {
    alert('You need access to at least one organization to add users');
    return;
  }
  
  const orgId = organizations.value[0].id;
  
  try {
    // Assign user to agent with organization context
    await userAgentApi.addUserToAgent({
      user_id: user.id,
      agent_id: agentId.value,
      organization_id: orgId
    })
    
    // Refresh the users list to include the newly added user
    await fetchAssignedUsers()
    
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
      // Need to include organization_id if the API requires it
      if (user.organization_id) {
        await userAgentApi.removeUserFromAgent(user.id, agentId.value, user.organization_id)
      } else {
        await userAgentApi.removeUserFromAgent(user.id, agentId.value)
      }
      
      // Refresh the users list after removal
      await fetchAssignedUsers()
    } catch (error) {
      console.error('Error removing user:', error)
      alert('Error removing user: ' + error.message)
    }
  }
}

const openEditModal = () => {
  // Populate form data with current agent values
  console.log('Current agent data:', agent.value)
  
  // Check for AI provider in various possible field names
  let aiProvider = ''
  
  // Log all properties of the agent object to see what fields are available
  console.log('All agent properties:', Object.keys(agent.value))
  
  // Try all possible field name variations
  if (agent.value.ai_provider) {
    aiProvider = agent.value.ai_provider
    console.log('Found ai_provider:', aiProvider)
  } else if (agent.value.AIProvider) {
    aiProvider = agent.value.AIProvider
    console.log('Found AIProvider:', aiProvider)
  } else if (agent.value.aiProvider) {
    aiProvider = agent.value.aiProvider
    console.log('Found aiProvider:', aiProvider)
  } else {
    console.warn('No AI provider field found in agent data, defaulting to OpenAI')
    // Default to OpenAI as a fallback
    aiProvider = 'OpenAI'
  }
  
  // Normalize the AI provider value to match our dropdown options
  if (aiProvider && typeof aiProvider === 'string') {
    const normalizedValue = aiProvider.trim()
    // Only allow OpenAI or Anthropic
    if (normalizedValue.toLowerCase().includes('openai')) {
      aiProvider = 'OpenAI'
    } else if (normalizedValue.toLowerCase().includes('anthropic')) {
      aiProvider = 'Anthropic'
    } else {
      // Default to OpenAI if not recognized
      console.warn(`Unrecognized AI provider value: ${normalizedValue}, defaulting to OpenAI`)
      aiProvider = 'OpenAI'
    }
  }
  
  console.log('AI Provider from database (normalized):', aiProvider)
  
  formData.value = {
    name: agent.value.name || '',
    description: agent.value.description || '',
    instructions: agent.value.instructions || '',
    aiProvider: aiProvider,
    metadataJson: agent.value.metadata ? JSON.stringify(agent.value.metadata, null, 2) : '{}'
  }
  
  console.log('Form data populated:', formData.value)
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
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    console.error('Error formatting date:', e)
    return 'N/A'
  }
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
  flex-direction: column;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.top-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.title-section {
  flex: 1;
}

.back-button {
  display: inline-flex;
  align-items: center;
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 10px;
  transition: color 0.2s;
}

.back-button:hover {
  color: #2980b9;
}

.back-button i {
  margin-right: 5px;
}

.no-org-selected {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  margin: 20px 0;
  border: 1px dashed #ccc;
}

.no-org-selected p {
  font-size: 16px;
  color: #6c757d;
  margin: 0;
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

.organization-selector {
  margin: 15px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background-color: #f0f4f8;
  border-radius: 6px;
  width: 100%;
  border: 1px solid #d0d7de;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.organization-selector label {
  font-weight: 500;
  color: #333;
}

.organization-selector select {
  padding: 10px 12px;
  border-radius: 4px;
  border: 1px solid #ccc;
  min-width: 250px;
  font-size: 16px;
  background-color: white;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  cursor: pointer;
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
  align-items: flex-start;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 85%;
}

.user-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 4px;
}

.user-details {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
}

.detail-label {
  font-weight: 500;
  color: #555;
  min-width: 90px;
}

.user-email {
  color: #2980b9;
  font-size: 0.95rem;
}

.user-org {
  color: #16a085;
  font-size: 0.95rem;
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

.user-assignment-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.top-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
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
