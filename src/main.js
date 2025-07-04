import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initializeFirebase } from './services/firebase'
import notificationPlugin from './plugins/notifications'

// Import global CSS
import './assets/main.css'

// Initialize Firebase
initializeFirebase()

// Create the app
const app = createApp(App)

// Use Pinia for state management
app.use(createPinia())

// Use Vue Router
app.use(router)

// Use notification plugin
app.use(notificationPlugin)

// Mount the app
app.mount('#app')
