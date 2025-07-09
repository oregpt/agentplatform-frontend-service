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
      <router-link to="/assign" class="navbar-item">Assignments</router-link>
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
// Removed dropdown-related code
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
