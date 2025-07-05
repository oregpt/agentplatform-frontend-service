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
  const organizationId = ref('default-org') // Default organization ID
  
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
          
          // Get Firebase ID token first
          console.log('Fetching fresh Firebase ID token')
          try {
            const firebaseIdToken = await firebaseUser.getIdToken(true)
            
            // Now exchange the Firebase token for a custom JWT with organization ID
            console.log('Exchanging Firebase token for custom JWT with organization ID')
            const authApiUrl = import.meta.env.VITE_AUTH_API_URL
            
            try {
              const response = await axios.post(`${authApiUrl}/api/v1/auth/generate-jwt`, {
                firebase_token: firebaseIdToken,
                organization_id: organizationId.value
              })
              
              // Get the custom JWT with organization ID
              const customJwt = response.data.token
              const expiresIn = response.data.expires_in
              
              token.value = customJwt
              
              console.log(`Custom JWT obtained successfully. Expires in ${Math.floor(expiresIn / 60)} minutes`)
              
              // Set up token refresh - refresh 5 minutes before expiration
              if (tokenRefreshInterval) {
                clearInterval(tokenRefreshInterval)
              }
              
              const refreshTime = Math.max((expiresIn * 1000) - (5 * 60 * 1000), 60000) // 5 minutes before expiry or 1 minute minimum
              console.log(`Setting token refresh in ${Math.floor(refreshTime / 60000)} minutes`)
              
              tokenRefreshInterval = setInterval(async () => {
                console.log('Refreshing custom JWT token')
                try {
                  // Get a fresh Firebase token
                  const freshFirebaseToken = await firebaseUser.getIdToken(true)
                  
                  // Exchange it for a fresh custom JWT
                  const refreshResponse = await axios.post(`${authApiUrl}/api/v1/auth/generate-jwt`, {
                    firebase_token: freshFirebaseToken,
                    organization_id: organizationId.value
                  })
                  
                  const freshCustomJwt = refreshResponse.data.token
                  token.value = freshCustomJwt
                  axios.defaults.headers.common['Authorization'] = `Bearer ${freshCustomJwt}`
                  localStorage.setItem('authToken', freshCustomJwt)
                  console.log('Custom JWT refreshed successfully')
                } catch (refreshError) {
                  console.error('Error refreshing custom JWT:', refreshError)
                }
              }, refreshTime)
              
              // Set authorization header with the custom JWT
              axios.defaults.headers.common['Authorization'] = `Bearer ${customJwt}`
              
              // Store token in localStorage for API interceptor
              localStorage.setItem('authToken', customJwt)
              
            } catch (jwtError) {
              console.error('Error getting custom JWT:', jwtError)
              // Fall back to using Firebase token directly (this will cause 401 errors but prevents total failure)
              token.value = firebaseIdToken
              axios.defaults.headers.common['Authorization'] = `Bearer ${firebaseIdToken}`
              localStorage.setItem('authToken', firebaseIdToken)
            }
            
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
    // Starting Google login
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
