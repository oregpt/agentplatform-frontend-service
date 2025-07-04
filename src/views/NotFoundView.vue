<template>
  <div class="not-found">
    <h1>404</h1>
    <h2>Page Not Found</h2>
    <p>The page you are looking for does not exist or has been moved.</p>
    <router-link to="/" class="home-link">Go to Dashboard</router-link>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  text-align: center;
  padding: 20px;
}

h1 {
  font-size: 6rem;
  margin-bottom: 0;
  color: #2c3e50;
}

h2 {
  font-size: 2rem;
  margin-top: 0;
  color: #2c3e50;
}

p {
  font-size: 1.2rem;
  color: #7f8c8d;
  margin-bottom: 30px;
}

.home-link {
  background-color: #3498db;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.3s;
}

.home-link:hover {
  background-color: #2980b9;
  text-decoration: none;
}
</style>
