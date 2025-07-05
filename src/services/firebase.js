import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Log environment variables for debugging
console.log('Firebase Environment Variables:')
console.log('VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY)
console.log('VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN)
console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID)

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Log the complete config object
console.log('Firebase Config:', firebaseConfig)

// Initialize Firebase
let app
let auth

export function initializeFirebase() {
  console.log('Initializing Firebase...')
  try {
    app = initializeApp(firebaseConfig)
    console.log('Firebase app initialized successfully')
    auth = getAuth(app)
    console.log('Firebase auth initialized successfully')
    return { app, auth }
  } catch (error) {
    console.error('Error initializing Firebase:', error)
    throw error
  }
}

export function getFirebaseAuth() {
  if (!auth) {
    const { auth: newAuth } = initializeFirebase()
    return newAuth
  }
  return auth
}
