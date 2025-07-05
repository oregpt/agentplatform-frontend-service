import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
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
    // Auth store initialization
    console.log('%cInitializing auth store', 'color: purple; font-weight: bold')
    
    // Log environment variables to help debug production issues
    console.log('Auth store environment:', {
      authApiUrl: import.meta.env.VITE_AUTH_API_URL,
      backendApiUrl: import.meta.env.VITE_BACKEND_API_URL,
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
      mode: import.meta.env.MODE
    })
    
    const auth = getFirebaseAuth()
    loading.value = true
    
    // Set up token refresh interval
    let tokenRefreshInterval = null
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Firebase auth state changed
      console.log('%cFirebase auth state changed:', 'color: blue; font-weight: bold', 
        firebaseUser ? `logged in as ${firebaseUser.email}` : 'logged out')
      
      try {
        if (firebaseUser) {
          // User signed in
          console.log('%cUser signed in, updating store', 'color: green')
          
          // Update user info
          user.value = { 
            uid: firebaseUser.uid, 
            email: firebaseUser.email, 
            displayName: firebaseUser.displayName, 
            photoURL: firebaseUser.photoURL 
          }
          
          // Get fresh token
          // Getting ID token
          console.log('Fetching fresh ID token')
          try {
            const idToken = await firebaseUser.getIdToken(true)
            token.value = idToken
            
            // Decode token to check expiration
            const tokenData = JSON.parse(atob(idToken.split('.')[1]))
            const expirationTime = tokenData.exp * 1000 // Convert to milliseconds
            const currentTime = Date.now()
            const timeRemaining = expirationTime - currentTime
            
            console.log(`Token obtained successfully. Expires in ${Math.floor(timeRemaining / 60000)} minutes`)
            
            // Set up token refresh - refresh 5 minutes before expiration
            if (tokenRefreshInterval) {
              clearInterval(tokenRefreshInterval)
            }
            
            const refreshTime = Math.max(timeRemaining - (5 * 60 * 1000), 60000) // 5 minutes before expiry or 1 minute minimum
            console.log(`Setting token refresh in ${Math.floor(refreshTime / 60000)} minutes`)
            
            tokenRefreshInterval = setInterval(async () => {
              console.log('Refreshing Firebase ID token')
              try {
                const freshToken = await firebaseUser.getIdToken(true)
                token.value = freshToken
                axios.defaults.headers.common['Authorization'] = `Bearer ${freshToken}`
                console.log('Token refreshed successfully')
              } catch (refreshError) {
                console.error('Error refreshing token:', refreshError)
              }
            }, refreshTime)
            
            // Set authorization header
            axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`
            
            // Store token in localStorage for API interceptor
            localStorage.setItem('authToken', idToken)
            
          } catch (tokenError) {
            console.error('Error getting ID token:', tokenError)
            // Force logout if token retrieval fails
            auth.signOut()
          }
        } else {
          console.log('%cUser signed out, clearing auth state', 'color: orange')
          // Clear all auth data
          user.value = null
          token.value = null
          organizationId.value = null
          delete axios.defaults.headers.common['Authorization']
          localStorage.removeItem('authToken')
          
          // Clear token refresh interval
          if (tokenRefreshInterval) {
            clearInterval(tokenRefreshInterval)
            tokenRefreshInterval = null
          }
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error)
        user.value = null
        token.value = null
        organizationId.value = null
        delete axios.defaults.headers.common['Authorization']
        localStorage.removeItem('authToken')
      } finally {
        loading.value = false
      }
    }, (err) => {
      // Error handler for onAuthStateChanged
      console.error('Auth state observer error:', err)
      error.value = err.message
      loading.value = false
    })
    
    // Return unsubscribe function (not used currently but good practice)
    return unsubscribe
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
  
  // Login with Google
  async function loginWithGoogle() {
    debugger; // BREAKPOINT: Starting Google login
    const auth = getFirebaseAuth()
    loading.value = true
    error.value = null
    
    try {
      console.log('Starting Google login process...')
      const provider = new GoogleAuthProvider()
      // Add scopes if needed
      provider.addScope('email')
      provider.addScope('profile')
      
      // Set custom parameters
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      
      const result = await signInWithPopup(auth, provider)
      console.log('Google login successful:', result.user.email)
      
      // The user credential is available in result.credential
      // This gives you a Google Access Token which can be used to access the Google API
      // const credential = GoogleAuthProvider.credentialFromResult(result);
      // const token = credential.accessToken;
      
      return true
    } catch (err) {
      console.error('Google login error:', err)
      error.value = err.message
      return false
    }
    // Note: We don't set loading=false here because the onAuthStateChanged listener will do that
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
    loginWithGoogle,
    logout
  }
})
