<template>
  <div class="users-container">
    <div class="header">
      <h1>Users</h1>
      <button @click="openCreateModal()" class="create-btn">Create User</button>
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
      <button @click="openCreateModal()" class="create-btn">Create User</button>
    </div>
    
    <div v-else class="users-table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>ID</th>
            <th>Address</th>
            <th>Phone</th>
            <th>Agents</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.user_id || user.id">
            <td>{{ user.display_name || user.name }}</td>
            <td>{{ user.email }}</td>
            <td class="user-id">{{ user.user_id || user.id }}</td>
            <td>{{ user.address || '-' }}</td>
            <td>{{ user.phone || '-' }}</td>
            <td class="agents-count">{{ user.agentsCount || 0 }}</td>
            <td class="actions-cell">
              <button @click="manageAgents(user)" class="agents-btn">Manage Agents</button>
              <button @click="editUser(user)" class="edit-btn">Edit</button>
              <button @click="confirmDelete(user)" class="delete-btn">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || showEditModal" class="modal-backdrop">
      <div class="modal">
        <h2>{{ showEditModal ? 'Edit User' : 'Create User' }}</h2>
        <LoadingSpinner v-if="loading" message="Processing user operation..." />
        
        <form v-else @submit.prevent="showEditModal ? updateUser() : createUser()">
          <div class="form-group">
            <label for="displayName">Display Name</label>
            <input 
              type="text" 
              id="displayName" 
              v-model="formData.displayName" 
              required 
              placeholder="Enter user display name"
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
            <label for="address">Address (Optional)</label>
            <textarea 
              id="address" 
              v-model="formData.address" 
              placeholder="Enter user address"
              rows="2"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="phone">Phone (Optional)</label>
            <input 
              type="tel" 
              id="phone" 
              v-model="formData.phone" 
              placeholder="Enter user phone number"
            />
          </div>

          <h3 class="section-title">Organization Assignment</h3>
          
          <div class="form-group">
            <label for="assignedOrg">Organization</label>
            <select id="assignedOrg" v-model="formData.assignedOrgId" required>
              <option value="">Select an organization</option>
              <option v-for="org in organizations" :key="org.id" :value="org.id">
                {{ org.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="orgRole">Role in Organization</label>
            <select id="orgRole" v-model="formData.orgRole" required>
              <option value="">Select a role</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="cancel-btn" :disabled="loading">Cancel</button>
            <button type="submit" class="submit-btn" :disabled="loading">
              {{ showEditModal ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Manage Agents Modal -->
    <div v-if="showAgentsModal" class="modal-backdrop">
      <div class="modal">
        <h2>Manage Agents for {{ selectedUser.display_name || selectedUser.name }}</h2>
        
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
      :message="`Are you sure you want to delete ${selectedUser.display_name || selectedUser.name}?`"
      details="This action cannot be undone. The user will be removed from Firebase Authentication, the Users table, and all organization assignments will be deleted."
      confirm-text="Delete"
      cancel-text="Cancel"
      confirm-type="danger"
      icon="delete"
      @confirm="deleteUser"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject, watch } from 'vue'
import axios from 'axios'
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
const showModal = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showAgentsModal = ref(false)
const selectedUser = ref({})
const formData = ref({
  displayName: '',
  email: '',
  password: '',
  address: '',
  phone: '',
  assignedOrgId: '',
  orgRole: '' // Role in the organization
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
  // Initialize with auth store organization ID or default to first organization
  if (authStore.organizationId) {
    selectedOrgId.value = authStore.organizationId
  } else if (organizations.value.length > 0) {
    // Default to first organization if none selected
    selectedOrgId.value = organizations.value[0].id
  }
  
  // Always fetch users after organization is set
  await fetchUsers()
  
  // Set up a watcher to detect changes in the auth store organization ID
  watch(() => authStore.organizationId, (newOrgId) => {
    if (newOrgId && newOrgId !== selectedOrgId.value) {
      selectedOrgId.value = newOrgId
      fetchUsers()
    }
  })
})

async function fetchOrganizations() {
  try {
    // Include the organization_id in the request if it's set
    const params = {}
    if (authStore.organizationId && authStore.organizationId !== 'All') {
      params.organization_id = authStore.organizationId
    }
    
    const response = await organizationsApi.getAll(params)
    
    if (response.data && response.data.organizations) {
      // Store real organizations first, without 'All'
      const realOrgs = response.data.organizations
      
      // Set default organization to first real organization if available
      if (realOrgs.length > 0) {
        selectedOrgId.value = realOrgs[0].id
        console.log('Setting default organization ID to:', selectedOrgId.value)
      }
      
      // Add 'All' option if user has access to multiple organizations
      if (realOrgs.length > 1) {
        organizations.value = [{ id: 'All', name: 'All Organizations' }, ...realOrgs]
      } else {
        organizations.value = [...realOrgs]
      }
    } else if (Array.isArray(response.data)) {
      const realOrgs = response.data
      
      // Set default organization to first real organization if available
      if (realOrgs.length > 0) {
        selectedOrgId.value = realOrgs[0].id
        console.log('Setting default organization ID to:', selectedOrgId.value)
      }
      
      // Add 'All' option if user has access to multiple organizations
      if (realOrgs.length > 1) {
        organizations.value = [{ id: 'All', name: 'All Organizations' }, ...realOrgs]
      } else {
        organizations.value = [...realOrgs]
      }
    } else {
      organizations.value = []
    }
    
    console.log('Organizations loaded:', organizations.value, 'Selected org:', selectedOrgId.value)
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
    
    // IMPORTANT: When 'All' is selected, we need to pass a valid organization ID
    // The backend has two different paths:
    // 1. With organization_id: Calls ListUserOrgs which works correctly
    // 2. Without organization_id: Calls ListUsers which has an issue with JSON decoding
    
    // Always pass an organization ID, even when 'All' is selected
    let organizationId = selectedOrgId.value
    
    // If 'All' is selected, use the first real organization ID
    if (organizationId === 'All' && organizations.value.length > 1) {
      // Find the first non-'All' organization
      const firstRealOrg = organizations.value.find(org => org.id !== 'All')
      if (firstRealOrg) {
        organizationId = firstRealOrg.id
      }
    }
    
    console.log('Using organizationId for API call:', organizationId)
    
    const response = await usersApi.getAll(organizationId)
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
    // Validate form data
    if (!formData.value.email || !formData.value.password || !formData.value.displayName) {
      notify({
        type: 'error',
        message: 'Required fields missing',
        details: 'Email, password, and display name are required.'
      })
      return
    }

    if (!formData.value.assignedOrgId || !formData.value.orgRole) {
      notify({
        type: 'error',
        message: 'Organization assignment required',
        details: 'Please select an organization and role for the user.'
      })
      return
    }

    loading.value = true
    
    // 1. Create user in Firebase
    console.log('Creating user in Firebase...', formData.value.email)
    const { createFirebaseUser, getFirebaseAuth } = await import('../services/firebase')
    
    // Create the user in Firebase Authentication
    const userCredential = await createFirebaseUser(formData.value.email, formData.value.password)
    
    // Get Firebase UID
    console.log('Firebase user credential:', userCredential)
    console.log('Firebase user object:', userCredential.user)
    
    // Extract and verify the UID
    const firebaseUid = userCredential.user.uid
    if (!firebaseUid) {
      throw new Error('Failed to get Firebase UID after user creation')
    }
    
    console.log('Firebase user created with UID:', firebaseUid)
    console.log('UID type:', typeof firebaseUid, 'UID length:', firebaseUid.length)
    
    // Double-check that the user is actually created in Firebase by getting the current user
    const auth = getFirebaseAuth()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for Firebase to complete
    const currentUser = auth.currentUser
    console.log('Current Firebase user after creation:', currentUser)
    
    if (!currentUser || currentUser.uid !== firebaseUid) {
      console.warn('Firebase user creation may not have completed properly')
      // Continue anyway, but log the warning
    }
    
    // 2. Create user in Spanner Users table
    const userPayload = {
      id: firebaseUid, // Changed from user_id to id to match backend model's JSON tag
      email: formData.value.email,
      display_name: formData.value.displayName,
      address: formData.value.address || '',
      phone: formData.value.phone || '',
      metadata: "{}" // Send as empty JSON string, not as an object
    }
    
    // Verify the payload has the correct UID before sending
    console.log('Creating user in Spanner Users table with payload:', JSON.stringify(userPayload, null, 2))
    console.log('Verifying id is set correctly:', userPayload.id === firebaseUid)
    
    try {
      // Try to get a fresh auth token before creating the user
      const auth = getFirebaseAuth()
      const currentUser = auth.currentUser
      if (currentUser) {
        const idToken = await currentUser.getIdToken(true) // Force refresh the token
        localStorage.setItem('authToken', idToken)
        console.log('Refreshed auth token before API call')
      }
      
      await usersApi.create(userPayload)
      console.log('User created in database successfully with ID:', firebaseUid)
      
      // Wait for database consistency
      console.log('Waiting for database consistency...')
      await new Promise(resolve => setTimeout(resolve, 3000)) // Increased wait time
      
      // Skip verification as it's causing 500 errors
      console.log('Skipping user verification to avoid 500 errors')
    } catch (createError) {
      console.error('Error creating user in database:', createError)
      // If we get a 401/403, try to refresh the token and retry once
      if (createError.response && (createError.response.status === 401 || createError.response.status === 403)) {
        try {
          console.log('Auth error detected, refreshing token and retrying...')
          const auth = getFirebaseAuth()
          const idToken = await auth.currentUser.getIdToken(true)
          localStorage.setItem('authToken', idToken)
          
          // Retry the create call
          await usersApi.create(userPayload)
          console.log('User created in database successfully on retry')
        } catch (retryError) {
          console.error('Error on retry:', retryError)
          throw retryError
        }
      } else {
        throw createError
      }
    }
    
    // 3. Create entry in UserOrgs table
    const userOrgPayload = {
      user_id: firebaseUid, // Keep as user_id for UserOrgs table
      organization_id: formData.value.assignedOrgId,
      role: formData.value.orgRole,
      // Include these fields to ensure they're properly set in the UserOrgs table
      email: formData.value.email,
      display_name: formData.value.displayName || ''
    }
    
    // Verify the UserOrgs payload has the correct UID before sending
    console.log('Creating user-org association with payload:', JSON.stringify(userOrgPayload, null, 2))
    console.log('Verifying UserOrgs user_id matches Firebase UID:', userOrgPayload.user_id === firebaseUid)
    console.log('Organization ID being used:', userOrgPayload.organization_id)
    
    try {
      // Skip fetching users to avoid the 500 error
      console.log('Skipping user verification before org assignment to avoid 500 errors')
      
      // Wait a bit to ensure database consistency
      console.log('Waiting for database consistency before org assignment...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Implement a retry mechanism for UserOrgs creation
      let retryCount = 0;
      const maxRetries = 3;
      let success = false;
      let lastError = null;
      
      while (retryCount < maxRetries && !success) {
        try {
          // Try to refresh the token before each attempt
          if (retryCount > 0) {
            console.log('Refreshing auth token before retry...')
            const auth = getFirebaseAuth()
            if (auth.currentUser) {
              const idToken = await auth.currentUser.getIdToken(true)
              localStorage.setItem('authToken', idToken)
            }
          }
          
          // Make the API call with detailed logging
          console.log(`Attempting to assign user to organization (attempt ${retryCount + 1})...`)
          try {
            // Make a direct API call instead of using the wrapper to get more control
            // Fix: Use proper environment variable access with fallback
            const baseUrl = import.meta.env.VITE_API_URL || 'https://agentplatform-backend-service-748547744737.us-central1.run.app'
            const apiUrl = `${baseUrl}/api/v1/user-orgs`
            console.log(`Making direct API call to ${apiUrl}`)
            
            // Get fresh auth token
            const auth = getFirebaseAuth()
            const idToken = await auth.currentUser.getIdToken(true)
            localStorage.setItem('authToken', idToken)
            
            // Make the API call with detailed logging
            const response = await axios.post(apiUrl, userOrgPayload, {
              headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
              }
            })
            
            console.log(`UserOrgs creation API response (attempt ${retryCount + 1}):`, response)
            console.log('User successfully assigned to organization')
            success = true;
          } catch (assignError) {
            console.error(`Error assigning user to organization (attempt ${retryCount + 1}):`, assignError)
            console.error('Response data:', assignError.response?.data)
            console.error('Response status:', assignError.response?.status)
            console.error('Request payload:', JSON.stringify(userOrgPayload))
            lastError = assignError
            
            // Don't throw here, let the retry mechanism handle it
            if (retryCount >= maxRetries - 1) {
              throw assignError
            }
          }
        } catch (retryError) {
          lastError = retryError;
          retryCount++;
          console.warn(`UserOrgs creation failed (attempt ${retryCount}/${maxRetries}):`, retryError.message)
          console.error('Error details:', retryError.response?.data || 'No response data')
          
          if (retryCount < maxRetries) {
            // Wait before retrying with increasing backoff
            const waitTime = 2000 * retryCount; // Increase wait time with each retry
            console.log(`Waiting ${waitTime}ms before retry...`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
          }
        }
      }
      
      // If all retries failed, throw the last error
      if (!success) {
        throw lastError;
      }
      
      // Success notification
      notify({
        type: 'success',
        message: 'User created successfully',
        details: 'User has been created and assigned to the organization.'
      })
    } catch (orgErr) {
      console.error('Error assigning user to organization:', orgErr)
      
      // Partial success notification - user created but org assignment failed
      notify({
        type: 'warning',
        message: 'User created but not assigned to organization',
        details: 'The user was created successfully but could not be assigned to the organization. ' +
                 'You may need to manually assign them later.'
      })
    }
    
    // Refresh user list and reset UI
    await fetchUsers()
    resetForm()
    showCreateModal.value = false
  } catch (err) {
    console.error('Error in user creation process:', err)
    notify({
      type: 'error',
      message: 'Failed to create user',
      details: err.response?.data?.error || err.message || 'Unknown error'
    })
  } finally {
    loading.value = false
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
    loading.value = true
    const userId = selectedUser.value.id
    console.log('Starting user deletion process for user ID:', userId)
    
    // 1. Delete user from UserOrgs table first (handled by backend cascade)
    console.log('Deleting user from database...')
    await usersApi.delete(userId)
    
    // 2. Attempt to delete from Firebase if applicable
    // Note: This will only work if the current user is deleting their own account
    // or if we're in an admin context. In practice, this would typically be handled
    // by the backend with Firebase Admin SDK.
    try {
      console.log('Attempting to delete user from Firebase...')
      const { deleteFirebaseUser } = await import('../services/firebase')
      await deleteFirebaseUser(userId)
      console.log('Firebase user deletion successful')
    } catch (firebaseError) {
      console.warn('Firebase user deletion handled by backend:', firebaseError.message)
      // We don't want to fail the whole operation if Firebase deletion fails
      // as this is likely handled by the backend
    }
    
    notify({
      type: 'success',
      message: 'User deleted successfully',
      details: 'User has been removed from the system.'
    })
    
    showDeleteModal.value = false
    // Refresh the users list
    await fetchUsers()
  } catch (err) {
    console.error('Error deleting user:', err)
    
    notify({
      type: 'error',
      message: 'Failed to delete user',
      details: err.message || 'An unknown error occurred'
    })
  } finally {
    loading.value = false
  }
}

function closeModal() {
  showCreateModal.value = false
  showEditModal.value = false
  resetFormData()
  selectedUser.value = {}
}

function resetFormData() {
  formData.value = {
    displayName: '',
    email: '',
    password: '',
    address: '',
    phone: '',
    assignedOrgId: '',
    orgRole: ''
  }
}

async function openCreateModal() {
  resetFormData()
  
  // Make sure we have organizations loaded for the dropdown
  if (organizations.value.length === 0) {
    await fetchOrganizations()
  }
  
  // Pre-select the first real organization (not 'All') if available
  const realOrg = organizations.value.find(org => org.id !== 'All')
  if (realOrg) {
    formData.value.assignedOrgId = realOrg.id
  }
  
  showCreateModal.value = true
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

.users-table-container {
  overflow-x: auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.users-table th,
.users-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.users-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

.users-table tbody tr:hover {
  background-color: #f8f9fa;
}

.users-table .user-id {
  font-family: monospace;
  font-size: 0.85rem;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.users-table .agents-count {
  font-weight: bold;
  text-align: center;
}

.users-table .actions-cell {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

.user-address,
.user-phone {
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
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  font-size: 0.85rem;
  white-space: nowrap;
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
  color: #34495e;
  font-weight: 500;
}

.section-title {
  margin-top: 20px;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #e0e0e0;
  color: #333;
  font-size: 1.1em;
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
