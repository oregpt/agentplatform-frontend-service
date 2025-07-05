<template>
  <div class="app">
    <header>
      <nav-bar :is-authenticated="isAuthenticated" />
    </header>
    <main>
      <router-view />
    </main>
    <notification-container ref="notificationsRef" position="top-right" />
  </div>
</template>

<script setup>
import { computed, onMounted, inject } from 'vue'
import { useAuthStore } from './store/auth'
import NavBar from './components/NavBar.vue'

const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Get notification system reference
const notify = inject('notify')
const notificationsRef = computed(() => notify.containerRef)

// Set the notification container reference when the component is mounted
onMounted(() => {
  notify.containerRef.value = notificationsRef.value
})
</script>

<style>
.app {
  font-family: 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  padding: 20px;
}
</style>
