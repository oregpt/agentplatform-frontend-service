<template>
  <div class="assignments-container">
    <h1>Assignment Management</h1>
    <p class="subtitle">Manage relationships between users, agents, and organizations</p>
    
    <div class="assignment-cards">
      <router-link to="/assign/users-to-agents" class="assignment-card">
        <div class="card-icon">
          <i class="mdi mdi-account-switch"></i>
        </div>
        <h3>Users to Agents</h3>
        <p>Assign users to agents and manage their permissions</p>
      </router-link>
      
      <router-link to="/assign/agents-to-orgs" class="assignment-card">
        <div class="card-icon">
          <i class="mdi mdi-robot"></i>
        </div>
        <h3>Agents to Organizations</h3>
        <p>Manage which organizations agents belong to</p>
      </router-link>
      
      <router-link to="/assign/users-to-orgs" class="assignment-card">
        <div class="card-icon">
          <i class="mdi mdi-account-group"></i>
        </div>
        <h3>Users to Organizations</h3>
        <p>Assign users to organizations and manage their roles</p>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Component logic here
</script>

<style scoped>
.assignments-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #7f8c8d;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.assignment-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.assignment-card {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.assignment-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.card-icon {
  font-size: 2.5rem;
  color: #3498db;
  margin-bottom: 1rem;
}

.assignment-card h3 {
  margin: 0.5rem 0;
  color: #2c3e50;
}

.assignment-card p {
  color: #7f8c8d;
  margin: 0.5rem 0 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .assignment-cards {
    grid-template-columns: 1fr;
  }
  
  .assignments-container {
    padding: 1rem;
  }
}
</style>
