<template>
  <div class="organizations-container">
    <div class="header">
      <h1>Organizations</h1>
      <button @click="showCreateModal = true" class="create-btn">Create Organization</button>
    </div>
    
    <div class="controls-container">
      <search-bar 
        v-model="searchQuery" 
        placeholder="Search organizations..." 
        @search="handleSearch"
      />
    </div>

    <loading-spinner v-if="loading" message="Loading organizations..." />
    
    <error-message 
      v-if="error" 
      :message="error" 
      @retry="fetchOrganizations" 
      @dismiss="error = ''"
    />
    
    <div v-else-if="filteredOrganizations.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
          <path fill="none" d="M0 0h24v24H0z"/>
          <path d="M20 13c-1.678 0-3.249.46-4.593 1.259A14.984 14.984 0 0 1 18.147 19H20v-6zm-3.996 6C14.044 14.302 9.408 11 4 11v8h12.004zM4 9c3.83 0 7.24 1.969 9.238 4.938A12.99 12.99 0 0 1 20 11V3h1.008c.548 0 .992.445.992.993v16.014a1 1 0 0 1-.992.993H2.992A.993.993 0 0 1 2 20.007V3.993A1 1 0 0 1 2.992 3H6V1h2v4H4v4z" fill="currentColor"/>
        </svg>
      </div>
      <h3>No organizations found</h3>
      <p>{{ searchQuery ? 'Try adjusting your search query.' : 'Create your first organization to get started.' }}</p>
      <button @click="showCreateModal = true" class="create-btn">Create Organization</button>
    </div>
    
    <div v-else class="organizations-grid">
      <content-card 
        v-for="org in filteredOrganizations" 
        :key="org.id" 
        :title="org.name" 
        hoverable
        elevation="2"
        @click="viewOrganizationDetails(org)"
      >
        <p v-if="org.description" class="org-description">{{ org.description }}</p>
        <p v-else class="org-description empty">No description provided</p>
        
        <div class="org-stats">
          <div class="stat">
            <span class="stat-label">Agents</span>
            <span class="stat-value">{{ org.agentsCount || 0 }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Users</span>
            <span class="stat-value">{{ org.usersCount || 0 }}</span>
          </div>
        </div>
        
        <template #footer>
          <div class="org-actions">
            <button @click.stop="editOrganization(org)" class="edit-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M15.728 9.686l-1.414-1.414L5 17.586V19h1.414l9.314-9.314zm1.414-1.414l1.414-1.414-1.414-1.414-1.414 1.414 1.414 1.414zM7.242 21H3v-4.243L16.435 3.322a1 1 0 0 1 1.414 0l2.829 2.829a1 1 0 0 1 0 1.414L7.243 21h-.001z" fill="currentColor"/>
              </svg>
              Edit
            </button>
            <button @click.stop.prevent="confirmDelete(org)" class="delete-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M17 6h5v2h-2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8H2V6h5V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3zm1 2H6v12h12V8zm-9 3h2v6H9v-6zm4 0h2v6h-2v-6zM9 4v2h6V4H9z" fill="currentColor"/>
              </svg>
              Delete
            </button>
          </div>
        </template>
      </content-card>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || showEditModal" class="modal-backdrop">
      <div class="modal">
        <h2>{{ showEditModal ? 'Edit Organization' : 'Create Organization' }}</h2>
        <form @submit.prevent="showEditModal ? updateOrganization() : createOrganization()">
          <div class="form-group">
            <label for="name">Organization Name</label>
            <input 
              type="text" 
              id="name" 
              v-model="formData.name" 
              required 
              placeholder="Enter organization name"
            />
          </div>
          <div class="form-group">
            <label for="description">Description</label>
            <textarea 
              id="description" 
              v-model="formData.description" 
              rows="4" 
              placeholder="Enter organization description"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="cancel-btn">
              Cancel
            </button>
            <button type="submit" class="submit-btn">
              {{ showEditModal ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Delete Confirmation Dialog -->
    <confirm-dialog
      v-model="showDeleteModal"
      title="Delete Organization"
      :message="`Are you sure you want to delete ${selectedOrg.name}?`"
      confirm-text="Delete"
      confirm-type="danger"
      @confirm="deleteOrganization"
      @cancel="showDeleteModal = false"
      icon="delete"
    >
      <p class="warning">This action cannot be undone. All associated agents, files, and user assignments will be permanently deleted.</p>
    </confirm-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject } from 'vue'
import { organizationsApi, agentsApi, usersApi } from '../services/api'
import { useAuthStore } from '../store/auth'
import SearchBar from '../components/SearchBar.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import ErrorMessage from '../components/ErrorMessage.vue'
import ContentCard from '../components/ContentCard.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

// State
const organizations = ref([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const formData = ref({
  name: '',
  description: ''
})
const selectedOrg = ref({})

// Auth store
const authStore = useAuthStore()

// Notifications
const notify = inject('notify', null)

// Computed
const filteredOrganizations = computed(() => {
  if (!searchQuery.value) {
    return organizations.value
  }
  
  const query = searchQuery.value.toLowerCase()
  return organizations.value.filter(org => {
    return org.name.toLowerCase().includes(query) || 
           (org.description && org.description.toLowerCase().includes(query))
  })
})

onMounted(async () => {
  await fetchOrganizations()
})

// Fetch organizations with agent and user counts
async function fetchOrganizations() {
  try {
    loading.value = true
    error.value = ''
    console.log('Fetching organizations...')
    const response = await organizationsApi.getAll()
    console.log('Organizations API response:', response)
    
    // Check if response has the expected structure
    if (response && response.data) {
      // Extract organizations from the response
      let orgs = [];
      if (Array.isArray(response.data.organizations)) {
        orgs = response.data.organizations;
      } else if (Array.isArray(response.data)) {
        orgs = response.data;
      }
      
      // For each organization, fetch agent and user counts
      const orgsWithCounts = await Promise.all(orgs.map(async (org) => {
        try {
          // Fetch agents count for this organization
          const agentsResponse = await agentsApi.getAll(org.id);
          const agentsCount = Array.isArray(agentsResponse.data.agents) ? 
                             agentsResponse.data.agents.length : 
                             (Array.isArray(agentsResponse.data) ? agentsResponse.data.length : 0);
          
          // Fetch users count for this organization
          const usersResponse = await usersApi.getAll(org.id);
          const usersCount = Array.isArray(usersResponse.data.users) ? 
                           usersResponse.data.users.length : 
                           (Array.isArray(usersResponse.data) ? usersResponse.data.length : 0);
          
          return {
            ...org,
            agentsCount,
            usersCount
          };
        } catch (err) {
          console.error(`Error fetching counts for organization ${org.id}:`, err);
          return {
            ...org,
            agentsCount: 0,
            usersCount: 0
          };
        }
      }));
      
      organizations.value = orgsWithCounts;
      console.log('Organizations loaded with counts:', organizations.value);
    } else {
      console.error('Unexpected API response format:', response)
      error.value = 'Unexpected API response format'
      organizations.value = [];
    }
  } catch (err) {
    console.error('Error fetching organizations:', err)
    error.value = `Failed to load organizations: ${err.message || 'Unknown error'}`
    organizations.value = [];
  } finally {
    loading.value = false
  }
}

function editOrganization(org) {
  selectedOrg.value = org
  formData.value = {
    name: org.name,
    description: org.description || ''
  }
  showEditModal.value = true
}

function confirmDelete(org) {
  console.log('confirmDelete called with org:', org)
  selectedOrg.value = org
  showDeleteModal.value = true
  console.log('showDeleteModal set to:', showDeleteModal.value)
}

async function createOrganization() {
  try {
    // Create the organization
    const response = await organizationsApi.create(formData.value)
    console.log('Organization created successfully:', response)
    
    // Get the newly created organization ID
    let newOrgId = null
    if (response && response.data && response.data.id) {
      newOrgId = response.data.id
    } else if (response && response.data && response.data.organization && response.data.organization.id) {
      newOrgId = response.data.organization.id
    }
    
    // If we have the organization ID and current user, add the user to the organization
    if (newOrgId && authStore.user) {
      try {
        console.log('Adding current user as admin to the new organization:', newOrgId)
        
        // Create payload to add current user to organization
        const userOrgPayload = {
          name: authStore.user.displayName || authStore.user.email,
          email: authStore.user.email,
          role: 'admin', // Set as admin
          organizationId: newOrgId
        }
        
        // Add the current user to the organization
        await usersApi.update(authStore.user.uid, userOrgPayload)
        console.log('Current user added as admin to the new organization')
        
        // Refresh user organizations in auth store
        await authStore.fetchUserOrganizations()
      } catch (userErr) {
        console.error('Error adding current user to organization:', userErr)
      }
    } else {
      console.warn('Could not add user to organization: Missing organization ID or user info')
    }
    
    try {
      // Try different notification methods
      if (typeof notify === 'function') {
        notify({
          type: 'success',
          message: 'Organization created successfully'
        })
      } else if (notify && typeof notify.success === 'function') {
        notify.success('Organization created successfully')
      } else if (notify && notify.value && typeof notify.value.addNotification === 'function') {
        notify.value.addNotification({
          type: 'success',
          message: 'Organization created successfully'
        })
      }
    } catch (notifyErr) {
      console.error('Error showing success notification:', notifyErr)
    }
    
    closeModal()
    await fetchOrganizations()
  } catch (err) {
    console.error('Error creating organization:', err)
    
    try {
      // Try different notification methods
      if (typeof notify === 'function') {
        notify({
          type: 'error',
          message: 'Failed to create organization',
          details: err.message
        })
      } else if (notify && typeof notify.error === 'function') {
        notify.error(`Failed to create organization: ${err.message || 'Unknown error'}`)
      } else if (notify && notify.value && typeof notify.value.addNotification === 'function') {
        notify.value.addNotification({
          type: 'error',
          message: 'Failed to create organization: ' + (err.message || 'Unknown error')
        })
      }
    } catch (notifyErr) {
      console.error('Error showing error notification:', notifyErr)
    }
  }
}

async function updateOrganization() {
  try {
    console.log('Updating organization:', selectedOrg.value.id, formData.value)
    await organizationsApi.update(selectedOrg.value.id, formData.value)
    
    try {
      // Try different notification methods
      if (typeof notify === 'function') {
        notify({
          type: 'success',
          message: 'Organization updated successfully'
        })
      } else if (notify && typeof notify.success === 'function') {
        notify.success('Organization updated successfully')
      } else if (notify && notify.value && typeof notify.value.addNotification === 'function') {
        notify.value.addNotification({
          type: 'success',
          message: 'Organization updated successfully'
        })
      }
    } catch (notifyErr) {
      console.error('Error showing success notification:', notifyErr)
    }
    
    closeModal()
    await fetchOrganizations()
  } catch (err) {
    console.error('Error updating organization:', err)
    
    try {
      // Try different notification methods
      if (typeof notify === 'function') {
        notify({
          type: 'error',
          message: 'Failed to update organization',
          details: err.message
        })
      } else if (notify && typeof notify.error === 'function') {
        notify.error(`Failed to update organization: ${err.message || 'Unknown error'}`)
      } else if (notify && notify.value && typeof notify.value.addNotification === 'function') {
        notify.value.addNotification({
          type: 'error',
          message: 'Failed to update organization: ' + (err.message || 'Unknown error')
        })
      }
    } catch (notifyErr) {
      console.error('Error showing error notification:', notifyErr)
    }
  }
}

async function deleteOrganization() {
  try {
    console.log('Deleting organization:', selectedOrg.value.id)
    await organizationsApi.delete(selectedOrg.value.id)
    
    try {
      // Try different notification methods
      if (typeof notify === 'function') {
        notify({
          type: 'success',
          message: 'Organization deleted successfully'
        })
      } else if (notify && typeof notify.success === 'function') {
        notify.success('Organization deleted successfully')
      } else if (notify && notify.value && typeof notify.value.addNotification === 'function') {
        notify.value.addNotification({
          type: 'success',
          message: 'Organization deleted successfully'
        })
      }
    } catch (notifyErr) {
      console.error('Error showing success notification:', notifyErr)
    }
    
    showDeleteModal.value = false
    await fetchOrganizations()
  } catch (err) {
    console.error('Error deleting organization:', err)
    
    try {
      // Try different notification methods
      if (typeof notify === 'function') {
        notify({
          type: 'error',
          message: 'Failed to delete organization',
          details: err.message
        })
      } else if (notify && typeof notify.error === 'function') {
        notify.error(`Failed to delete organization: ${err.message || 'Unknown error'}`)
      } else if (notify && notify.value && typeof notify.value.addNotification === 'function') {
        notify.value.addNotification({
          type: 'error',
          message: 'Failed to delete organization: ' + (err.message || 'Unknown error')
        })
      }
    } catch (notifyErr) {
      console.error('Error showing error notification:', notifyErr)
    }
  }
}

function closeModal() {
  showCreateModal.value = false
  showEditModal.value = false
  formData.value = {
    name: '',
    description: ''
  }
  selectedOrg.value = {}
}

// Search handler
function handleSearch(query) {
  searchQuery.value = query
}

// View organization details
function viewOrganizationDetails(org) {
  // This function would navigate to a detailed view of the organization
  // For now, we'll just open the edit modal
  editOrganization(org)
}
</script>

<style scoped>
.organizations-container {
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

.controls-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.create-btn {
  background-color: #2c3e50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.create-btn:hover {
  background-color: #1a2530;
}

.empty-state {
  text-align: center;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}

.empty-icon {
  margin-bottom: 16px;
  color: #bdc3c7;
}

.empty-state h3 {
  margin: 0 0 8px;
  color: #2c3e50;
}

.empty-state p {
  margin-bottom: 20px;
  color: #7f8c8d;
}

.organizations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.org-description {
  color: #2c3e50;
  margin-bottom: 15px;
  line-height: 1.5;
}

.org-description.empty {
  color: #95a5a6;
  font-style: italic;
}

.org-stats {
  display: flex;
  gap: 20px;
  margin-top: 10px;
  margin-bottom: 10px;
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

.org-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.edit-btn, .delete-btn {
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.edit-btn {
  background-color: #3498db;
  color: white;
}

.edit-btn:hover {
  background-color: #2980b9;
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
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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

/* Responsive adjustments */
@media (max-width: 768px) {
  .organizations-grid {
    grid-template-columns: 1fr;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .header h1 {
    margin: 0;
  }
}
</style>
