<template>
  <div class="user-org-assignments">
    <div class="header">
      <router-link to="/assign" class="back-button">
        <i class="mdi mdi-arrow-left"></i> Back to Assignments
      </router-link>
      <h1>Assign Users to Organizations</h1>
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
            @option:selected="loadUserOrganizations"
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

      <div v-if="selectedUser" class="assignment-container">
        <div class="panel available-orgs">
          <h3>Available Organizations</h3>
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
              v-for="org in filteredAvailableOrgs"
              :key="org.id"
              class="list-item"
              @click="selectOrg(org)"
            >
              <div class="org-name">{{ org.name }}</div>
              <div class="org-id">ID: {{ org.id }}</div>
            </div>
            <div v-if="filteredAvailableOrgs.length === 0" class="empty-state">
              No organizations available
            </div>
          </div>
        </div>

        <div class="panel-actions">
          <button 
            @click="addSelectedOrg" 
            :disabled="!selectedAvailableOrg || loading"
            class="action-button"
            title="Add to user"
          >
            <i class="mdi mdi-arrow-right"></i>
          </button>
          <button 
            @click="removeSelectedOrg" 
            :disabled="!selectedAssignedOrg || loading"
            class="action-button"
            title="Remove from user"
          >
            <i class="mdi mdi-arrow-left"></i>
          </button>
          
          <div class="role-selector" v-if="selectedAssignedOrg">
            <label>Role:</label>
            <select 
              v-model="selectedRole" 
              @change="updateOrgRole"
              class="role-select"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>
        </div>

        <div class="panel assigned-orgs">
          <h3>Assigned Organizations</h3>
          <div class="search-box">
            <input
              v-model="assignedOrgSearch"
              type="text"
              placeholder="Search assigned organizations..."
              class="search-input"
            />
          </div>
          <div class="list-container">
            <div
              v-for="org in filteredAssignedOrgs"
              :key="org.id"
              class="list-item"
              :class="{ 'is-selected': selectedAssignedOrg === org.id }"
              @click="selectAssignedOrg(org.id)"
            >
              <div class="org-header">
                <div class="org-name">{{ org.name }}</div>
                <span class="org-role" :class="`role-${org.role || 'member'}`">
                  {{ (org.role || 'member').toUpperCase() }}
                </span>
              </div>
              <div class="org-id">ID: {{ org.id }}</div>
            </div>
            <div v-if="filteredAssignedOrgs.length === 0" class="empty-state">
              No organizations assigned
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, getCurrentInstance } from 'vue'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import { usersApi, organizationsApi, userOrgApi } from '@/services/api'

// Get the global toast instance
const { proxy } = getCurrentInstance()
const toast = proxy.$toast

// State
const users = ref([])
const organizations = ref([])
const selectedUser = ref(null)
const selectedAvailableOrg = ref(null)
const selectedAssignedOrg = ref(null)
const selectedRole = ref('member')
const assignedOrgs = ref([])
const orgSearch = ref('')
const assignedOrgSearch = ref('')
const loading = ref(false)

// Computed
const filteredAvailableOrgs = computed(() => {
  const search = orgSearch.value.toLowerCase()
  return organizations.value.filter(org => 
    !assignedOrgs.value.some(a => a.id === org.id) &&
    (org.name.toLowerCase().includes(search) || 
     org.id.toLowerCase().includes(search))
  )
})

const filteredAssignedOrgs = computed(() => {
  const search = assignedOrgSearch.value.toLowerCase()
  return assignedOrgs.value.filter(org => 
    org.name.toLowerCase().includes(search) ||
    org.id.toLowerCase().includes(search)
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

async function loadOrganizations() {
  try {
    loading.value = true
    const response = await organizationsApi.getAll()
    organizations.value = response.data || []
  } catch (error) {
    console.error('Error loading organizations:', error)
    toast.error('Failed to load organizations')
  } finally {
    loading.value = false
  }
}

async function loadUserOrganizations() {
  if (!selectedUser.value) {
    assignedOrgs.value = []
    return
  }
  
  try {
    loading.value = true
    const response = await userOrgApi.getUserOrgs(selectedUser.value)
    assignedOrgs.value = response.data || []
  } catch (error) {
    console.error('Error loading user organizations:', error)
    toast.error('Failed to load user organizations')
  } finally {
    loading.value = false
  }
}

function selectOrg(org) {
  selectedAvailableOrg.value = org
  selectedAssignedOrg.value = null
}

function selectAssignedOrg(orgId) {
  selectedAssignedOrg.value = orgId
  selectedAvailableOrg.value = null
  
  // Set the selected role when an assigned org is selected
  const org = assignedOrgs.value.find(o => o.id === orgId)
  if (org) {
    selectedRole.value = org.role || 'member'
  }
}

async function addSelectedOrg() {
  if (!selectedAvailableOrg.value || !selectedUser.value) return
  
  try {
    loading.value = true
    await userOrgApi.addUserToOrg(selectedUser.value, selectedAvailableOrg.value.id, {
      role: selectedRole.value
    })
    
    await loadUserOrganizations()
    selectedAvailableOrg.value = null
    toast.success('User added to organization successfully')
  } catch (error) {
    console.error('Error adding user to organization:', error)
    toast.error('Failed to add user to organization')
  } finally {
    loading.value = false
  }
}

async function removeSelectedOrg() {
  if (!selectedAssignedOrg.value || !selectedUser.value) return
  
  try {
    loading.value = true
    await userOrgApi.removeUserFromOrg(selectedUser.value, selectedAssignedOrg.value)
    
    await loadUserOrganizations()
    selectedAssignedOrg.value = null
    toast.success('User removed from organization successfully')
  } catch (error) {
    console.error('Error removing user from organization:', error)
    toast.error('Failed to remove user from organization')
  } finally {
    loading.value = false
  }
}

async function updateOrgRole() {
  if (!selectedAssignedOrg.value || !selectedUser.value) return
  
  try {
    loading.value = true
    await userOrgApi.updateUserOrgRole(
      selectedUser.value, 
      selectedAssignedOrg.value,
      { role: selectedRole.value }
    )
    
    // Update local state
    const orgIndex = assignedOrgs.value.findIndex(o => o.id === selectedAssignedOrg.value)
    if (orgIndex !== -1) {
      assignedOrgs.value[orgIndex].role = selectedRole.value
    }
    
    toast.success('Organization role updated')
  } catch (error) {
    console.error('Error updating organization role:', error)
    toast.error('Failed to update organization role')
  } finally {
    loading.value = false
  }
}

// Watch for selected assigned org changes to update role
watch(selectedAssignedOrg, (newVal) => {
  if (newVal) {
    const org = assignedOrgs.value.find(o => o.id === newVal)
    if (org) {
      selectedRole.value = org.role || 'member'
    }
  } else {
    selectedRole.value = 'member'
  }
})

// Lifecycle hooks
onMounted(async () => {
  await Promise.all([loadUsers(), loadOrganizations()])
})
</script>

<style scoped>
.user-org-assignments {
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

.org-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.org-name {
  font-weight: 500;
}

.org-id {
  font-size: 0.8rem;
  color: #7f8c8d;
  font-family: monospace;
}

.org-role {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-member {
  background-color: #e3f2fd;
  color: #1976d2;
}

.role-admin {
  background-color: #e8f5e9;
  color: #388e3c;
}

.role-owner {
  background-color: #f3e5f5;
  color: #8e24aa;
}

.panel-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.5rem;
  padding: 1rem 0;
  min-width: 120px;
  align-items: center;
}

.action-button {
  background: #3498db;
  color: white;
  border: none;
  border-radius: 50%;
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

.role-selector {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  width: 100%;
  text-align: center;
}

.role-selector label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #555;
}

.role-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: white;
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

@media (max-width: 900px) {
  .assignment-container {
    flex-direction: column;
  }
  
  .panel-actions {
    flex-direction: row;
    justify-content: center;
    padding: 1rem;
    border-top: 1px solid #eee;
    border-bottom: 1px solid #eee;
    margin: 1rem 0;
  }
  
  .role-selector {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
    margin-left: 1rem;
    width: auto;
  }
  
  .role-select {
    min-width: 120px;
  }
}
</style>
