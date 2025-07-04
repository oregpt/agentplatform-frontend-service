<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <router-link to="/" class="logo">OreGPT Agent Platform</router-link>
    </div>
    <div class="navbar-menu">
      <router-link to="/dashboard" class="navbar-item">Dashboard</router-link>
      <router-link to="/organizations" class="navbar-item">Organizations</router-link>
      <router-link to="/agents" class="navbar-item">Agents</router-link>
      <router-link to="/users" class="navbar-item">Users</router-link>
    </div>
    <div class="navbar-end">
      <div class="user-info" v-if="user">
        <span>{{ user.email }}</span>
        <button @click="logout" class="logout-btn">Logout</button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../store/auth'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const user = computed(() => authStore.user)

const logout = async () => {
  await authStore.logout()
  router.push('/login')
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
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
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
</style>
