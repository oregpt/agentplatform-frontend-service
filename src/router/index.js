import { createRouter, createWebHistory } from 'vue-router'
import { getFirebaseAuth } from '../services/firebase'
import { onAuthStateChanged } from 'firebase/auth'

// Views
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import OrganizationsView from '../views/OrganizationsView.vue'
import AgentsView from '../views/AgentsView.vue'
import AgentDetailView from '../views/AgentDetailView.vue'
import FilesView from '../views/FilesView.vue'
import UsersView from '../views/UsersView.vue'
import NotFoundView from '../views/NotFoundView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        requiresAuth: false
      }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/organizations',
      name: 'organizations',
      component: OrganizationsView,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/agents',
      name: 'agents',
      component: AgentsView,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/agents/:id',
      name: 'agent-detail',
      component: AgentDetailView,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/agents/:agentId/files',
      name: 'files',
      component: FilesView,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/users',
      name: 'users',
      component: UsersView,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView
    }
  ]
})

// Global authentication state from Firebase

// Simple global state for auth
let currentUser = null
let authInitialized = false

// Set up auth state listener once
const auth = getFirebaseAuth()
onAuthStateChanged(auth, (user) => {
  currentUser = user
  authInitialized = true
  console.log('Auth state changed:', user ? `logged in as ${user.email}` : 'logged out')
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  // Router navigation guard start
  console.log(`%cRouter guard: Navigating from ${from.path} to ${to.path}`, 'color: blue; font-weight: bold')
  console.log('Route requires auth:', to.matched.some(record => record.meta.requiresAuth))
  
  // Get Firebase auth instance
  const auth = getFirebaseAuth()
  
  // Log environment variables to help debug production issues
  console.log('Environment:', {
    authApiUrl: import.meta.env.VITE_AUTH_API_URL,
    backendApiUrl: import.meta.env.VITE_BACKEND_API_URL,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    mode: import.meta.env.MODE
  })
  
  // Check if the route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    console.log('%cRoute requires authentication', 'color: orange; font-weight: bold')
    
    // Check if user is authenticated with Firebase
    const currentUser = auth.currentUser
    
    if (currentUser) {
      // Extra verification - check if token is valid
      try {
        // Verifying token
        console.log('%cUser is authenticated, verifying token...', 'color: green')
        const idToken = await currentUser.getIdToken(true)
        console.log('Token obtained successfully')
        
        // Check token expiration
        const tokenData = JSON.parse(atob(idToken.split('.')[1]))
        const expirationTime = tokenData.exp * 1000 // Convert to milliseconds
        const currentTime = Date.now()
        const timeRemaining = expirationTime - currentTime
        
        console.log(`Token expires in ${Math.floor(timeRemaining / 60000)} minutes`)
        
        if (timeRemaining > 0) {
          console.log('%cToken is valid, proceeding to route', 'color: green; font-weight: bold')
          // User is authenticated with valid token, proceeding
          next()
        } else {
          console.log('%cToken expired, redirecting to login', 'color: red; font-weight: bold')
          // Token expired
          next('/login')
        }
      } catch (error) {
        console.error('Error verifying token:', error)
        // Token verification error
        next('/login')
      }
    } else {
      console.log('%cUser is not authenticated, redirecting to login', 'color: red; font-weight: bold')
      // User is not authenticated, redirecting to login
      next('/login')
    }
  } else if (to.path === '/login' && auth.currentUser) {
    // If trying to access login page while already authenticated
    try {
      // Double-check token validity before redirecting
      const idToken = await auth.currentUser.getIdToken(true)
      console.log('%cAlready logged in with valid token, redirecting to dashboard', 'color: green; font-weight: bold')
      // Already logged in, redirecting to dashboard
      next('/dashboard')
    } catch (error) {
      console.error('Error refreshing token on login page:', error)
      // Stay on login page if token refresh fails
      next()
    }
  } else {
    // Route does not require authentication
    console.log('%cRoute does not require authentication, proceeding', 'color: blue')
    // Normal navigation
    next()
  }

})

export default router
