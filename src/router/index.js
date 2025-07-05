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

// Global authentication state
let currentUser = null
const auth = getFirebaseAuth()

// Set up auth state listener once
onAuthStateChanged(auth, (user) => {
  currentUser = user
  console.log('Auth state changed:', user ? 'logged in' : 'logged out')
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  // For login page, redirect to dashboard if already logged in
  if (to.name === 'login' && currentUser) {
    console.log('Already logged in, redirecting to dashboard')
    next('/dashboard')
    return
  }
  
  if (requiresAuth && !currentUser) {
    console.log('Auth required but not logged in, redirecting to login')
    next('/login')
  } else {
    next()
  }
})

export default router
