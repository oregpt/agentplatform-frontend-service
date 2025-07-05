import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

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

// Navigation guard - using Pinia store directly instead of Firebase SDK
router.beforeEach((to, from, next) => {
  // Get auth store - must be done inside the navigation guard to ensure it's available
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  console.log(`Navigation guard: path=${to.path}, requiresAuth=${requiresAuth}, isAuthenticated=${authStore.isAuthenticated}, loading=${authStore.loading}`)
  
  // If auth is still loading, wait for it
  if (authStore.loading) {
    console.log('Auth state is still loading, delaying navigation')
    // Return a promise that resolves when auth is no longer loading
    return new Promise((resolve) => {
      const unwatch = authStore.$subscribe((mutation, state) => {
        if (!state.loading) {
          console.log('Auth loading complete, continuing navigation')
          unwatch()
          resolve(handleNavigation(to, next, state.isAuthenticated, requiresAuth))
        }
      })
    })
  }
  
  return handleNavigation(to, next, authStore.isAuthenticated, requiresAuth)
})

// Helper function to handle navigation based on auth state
function handleNavigation(to, next, isAuthenticated, requiresAuth) {
  // For login page, redirect to dashboard if already logged in
  if (to.name === 'login' && isAuthenticated) {
    console.log('Already logged in, redirecting to dashboard')
    next('/dashboard')
    return
  }
  
  // For protected routes, redirect to login if not authenticated
  if (requiresAuth && !isAuthenticated) {
    console.log('Auth required but not logged in, redirecting to login')
    next('/login')
    return
  }
  
  // Otherwise proceed normally
  console.log(`Proceeding to ${to.path}, auth state: ${isAuthenticated ? 'authenticated' : 'not authenticated'}`)
  next()
}

export default router
