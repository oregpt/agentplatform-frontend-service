import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initializeFirebase } from './services/firebase'
import Toast from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';

// Import global CSS
import './assets/main.css'

// Import directives
import clickOutside from './directives/clickOutside'

// Initialize Firebase
console.log('About to initialize Firebase in main.js')
// Before Firebase initialization
try {
  initializeFirebase()
  console.log('Firebase initialization completed in main.js')
} catch (error) {
  console.error('Failed to initialize Firebase in main.js:', error)
}

// Create the app
const app = createApp(App)

// Use Pinia for state management
app.use(createPinia())

// Use Toast Notification
app.use(Toast, {
  position: 'top-right',
  duration: 3000
})

// Register directives
app.directive('click-outside', clickOutside)

// Initialize auth state after Pinia is set up
import { useAuthStore } from './store/auth'
// Before auth store initialization
const authStore = useAuthStore()
authStore.init()
console.log('Auth state initialization started')

// Use Vue Router
app.use(router)

// Mount the app
app.mount('#app')
