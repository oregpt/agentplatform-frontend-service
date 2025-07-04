import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth'
import { getFirebaseAuth } from '../services/firebase'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)
  const loading = ref(true)
  const error = ref(null)
  const organizationId = ref(null)
  
  const isAuthenticated = computed(() => !!user.value)
  
  // Initialize auth state
  function init() {
    const auth = getFirebaseAuth()
    
    onAuthStateChanged(auth, async (firebaseUser) => {
      loading.value = true
      
      if (firebaseUser) {
        // User is signed in
        user.value = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        }
        
        // Get Firebase ID token
        const idToken = await firebaseUser.getIdToken()
        token.value = idToken
        
        // Set token for API requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`
        
        // Get user details from auth service
        try {
          const response = await axios.get('/api/auth/user')
          organizationId.value = response.data.organizationId
          user.value = {
            ...user.value,
            role: response.data.role,
            organizationId: response.data.organizationId
          }
        } catch (err) {
          console.error('Error fetching user details:', err)
        }
      } else {
        // User is signed out
        user.value = null
        token.value = null
        organizationId.value = null
        delete axios.defaults.headers.common['Authorization']
      }
      
      loading.value = false
    })
  }
  
  // Login with email and password
  async function login(email, password) {
    const auth = getFirebaseAuth()
    loading.value = true
    error.value = null
    
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return true
    } catch (err) {
      console.error('Login error:', err)
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }
  
  // Logout
  async function logout() {
    const auth = getFirebaseAuth()
    loading.value = true
    error.value = null
    
    try {
      await signOut(auth)
      return true
    } catch (err) {
      console.error('Logout error:', err)
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }
  
  return {
    user,
    token,
    loading,
    error,
    organizationId,
    isAuthenticated,
    init,
    login,
    logout
  }
})
