<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <router-link to="/" class="logo">Agents Everywhere</router-link>
    </div>
    <div class="navbar-menu" v-if="authStore.isAuthenticated">
      <router-link to="/dashboard" class="navbar-item">Dashboard</router-link>
      <router-link to="/organizations" class="navbar-item">Organizations</router-link>
      <router-link to="/agents" class="navbar-item">Agents</router-link>
      <router-link to="/files" class="navbar-item">Files</router-link>
      <router-link to="/users" class="navbar-item">Users</router-link>
      <div class="navbar-dropdown" @mouseenter="isDropdownOpen = true" @mouseleave="isDropdownOpen = false" v-click-outside="closeDropdown">
        <button class="navbar-dropdown-toggle" @click="toggleDropdown">
          Assignments
          <i class="mdi" :class="isDropdownOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"></i>
        </button>
        <div class="navbar-dropdown-menu" v-show="isDropdownOpen">
          <router-link to="/assign/users-to-agents" class="dropdown-item" @click="closeDropdown">Users to Agents</router-link>
          <router-link to="/assign/agents-to-orgs" class="dropdown-item" @click="closeDropdown">Agents to Orgs</router-link>
          <router-link to="/assign/users-to-orgs" class="dropdown-item" @click="closeDropdown">Users to Orgs</router-link>
        </div>
      </div>
    </div>
    <!-- Organization selector removed from header -->
    <div class="navbar-end">
      <div class="user-info" v-if="authStore.user">
        <span>{{ authStore.user.email }}</span>
        <button @click="logout" class="logout-btn">Logout</button>
      </div>
      <div v-else>
        <router-link to="/login" class="login-btn">Login</router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../store/auth'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  isAuthenticated: {
    type: Boolean,
    default: false
  }
})

const authStore = useAuthStore()
const router = useRouter()
const user = computed(() => authStore.user)
const isDropdownOpen = ref(false)

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const closeDropdown = () => {
  isDropdownOpen.value = false
}

// Close dropdown when route changes
router.afterEach(() => {
  closeDropdown()
})
// Organization selector code removed

const logout = async () => {
  await authStore.logout()
  router.push('/login')
  // Force a full page refresh to clear any cached data
  setTimeout(() => {
    window.location.reload()
  }, 100) // Small delay to ensure router navigation starts
}
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  background-color: #2c3e50;
  color: white;
}

/* Organization selector styles removed */

:deep(.selector-label) {
  color: white;
  font-size: 0.8rem;
  margin-bottom: 2px;
}

:deep(.organization-select) {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 0.9rem;
  padding: 6px 10px;
}

:deep(.select-arrow) {
  color: rgba(255, 255, 255, 0.7);
}

.navbar-brand {
  font-size: 1.5rem;
  font-weight: bold;
}

.logo {
  color: white;
  text-decoration: none;
}

.navbar-menu {
  display: flex;
  gap: 20px;
}

.navbar-item {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.navbar-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.navbar-dropdown {
  position: relative;
  display: inline-block;
}

.navbar-dropdown-toggle {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 4px;
}

.navbar-dropdown-toggle:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.navbar-dropdown-menu {
  display: none;
  position: absolute;
  background-color: white;
  min-width: 200px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  border-radius: 4px;
  overflow: hidden;
  top: 100%;
  left: 0;
  margin-top: 4px;
}

.navbar-dropdown:hover .navbar-dropdown-menu {
  display: block;
}

.dropdown-item {
  color: #333;
  padding: 0.75rem 1rem;
  text-decoration: none;
  display: block;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.dropdown-item.router-link-active {
  background-color: #e3f2fd;
  color: #1976d2;
  font-weight: 500;
}

/* Add a small arrow to the active dropdown */
.navbar-dropdown:hover .navbar-dropdown-toggle::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 0 8px 8px;
  border-style: solid;
  border-color: transparent transparent white transparent;
  z-index: 1001;
}

/* Responsive adjustments */
@media (max-width: 992px) {
  .navbar-dropdown-menu {
    position: static;
    box-shadow: none;
    border: 1px solid #eee;
    margin-top: 0.5rem;
    margin-left: 1rem;
    display: none;
  }
  
  .navbar-dropdown:hover .navbar-dropdown-menu {
    display: block;
  }
  
  .navbar-dropdown-toggle::after {
    display: none;
  }
}

.navbar-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.navbar-end {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logout-btn {
  background-color: transparent;
  border: 1px solid white;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.login-btn {
  background-color: #3498db;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.3s;
}

.login-btn:hover {
  background-color: #2980b9;
}
</style>
