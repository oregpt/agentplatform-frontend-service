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

// Navigation guard - using simple global state
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  // Wait for auth to initialize if needed
  if (!authInitialized) {
    console.log('Waiting for auth state to initialize...')
    // Wait a bit for Firebase auth to initialize
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log(`Navigation guard: path=${to.path}, requiresAuth=${requiresAuth}, isAuthenticated=${!!currentUser}`)
  
  // For login page, redirect to dashboard if already logged in
  if (to.name === 'login' && currentUser) {
    console.log('Already logged in, redirecting to dashboard')
    next('/dashboard')
    return
  }
  
  // For protected routes, redirect to login if not authenticated
  if (requiresAuth && !currentUser) {
    console.log('Auth required but not logged in, redirecting to login')
    next('/login')
    return
  }
  
  // Otherwise proceed normally
  console.log(`Proceeding to ${to.path}, auth state: ${currentUser ? 'authenticated' : 'not authenticated'}`)
  next()
})

export default router
