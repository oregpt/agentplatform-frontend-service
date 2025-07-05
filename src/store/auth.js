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
    const auth = getFirebaseAuth()
    
    // Set loading to true initially
    loading.value = true
    
    // Use a persistent listener for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Firebase auth state changed:', firebaseUser ? `logged in as ${firebaseUser.email}` : 'logged out')
      
      try {
        if (firebaseUser) {
          // User is signed in
          user.value = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL
          }
          
          // Get Firebase ID token
          const idToken = await firebaseUser.getIdToken(true) // Force refresh token
          token.value = idToken
          
          // Set token for API requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`
          
          console.log('Authentication successful')
          console.log('User authenticated state:', isAuthenticated.value)
        } else {
          // User is signed out
          user.value = null
          token.value = null
          organizationId.value = null
          delete axios.defaults.headers.common['Authorization']
          console.log('User signed out')
        }
      } catch (err) {
        console.error('Error in auth state change handler:', err)
        error.value = err.message
      } finally {
        // Always set loading to false when done
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
