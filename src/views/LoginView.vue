<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">Agents Everywhere</h1>
      <div v-if="error" class="error-message">{{ error }}</div>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required 
            placeholder="Enter your email"
          />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required 
            placeholder="Enter your password"
          />
        </div>
        <button 
          type="submit" 
          class="login-button" 
          :disabled="loading"
        >
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
        
        <div class="separator">OR</div>
        
        <button 
          type="button"
          class="google-button"
          @click="handleGoogleLogin"
          :disabled="loading"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" class="google-icon">
          Sign in with Google
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../store/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const success = await authStore.login(email.value, password.value)
    if (success) {
      router.push('/dashboard')
    } else {
      error.value = 'Login failed. Please check your credentials.'
    }
  } catch (err) {
    console.error('Login error:', err)
    error.value = err.message || 'An error occurred during login'
  } finally {
    loading.value = false
  }
}

const handleGoogleLogin = async () => {
  // Google login button clicked
  loading.value = true
  error.value = ''
  
  try {
    console.log('Calling authStore.loginWithGoogle()')
    const success = await authStore.loginWithGoogle()
    // After Google login attempt
    console.log('Google login result:', success)
    
    if (success) {
      console.log('Google login successful, redirecting to dashboard')
      // Before redirect to dashboard
      router.push('/dashboard')
    } else {
      console.log('Google login failed')
      error.value = 'Google login failed.'
    }
  } catch (err) {
    // Google login error
    console.error('Google login error:', err)
    error.value = err.message || 'An error occurred during Google login'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.login-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #2c3e50;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-weight: 500;
  color: #2c3e50;
}

input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.login-button {
  background-color: #2c3e50;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-button:hover {
  background-color: #1a2530;
}

.login-button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
  text-align: center;
}

.separator {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 15px 0;
  color: #95a5a6;
}

.separator::before,
.separator::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #ddd;
}

.separator::before {
  margin-right: 10px;
}

.separator::after {
  margin-left: 10px;
}

.google-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  color: #757575;
  border: 1px solid #ddd;
  padding: 12px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.google-button:hover {
  background-color: #f5f5f5;
}

.google-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.google-icon {
  height: 18px;
  margin-right: 10px;
}
</style>
