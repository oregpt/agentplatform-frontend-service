import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth'

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

/**
 * Create a new Firebase user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<UserCredential>} Firebase user credential
 */
export async function createFirebaseUser(email, password) {
  const auth = getFirebaseAuth()
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    console.log('Firebase user created successfully:', userCredential.user.uid)
    return userCredential
  } catch (error) {
    console.error('Error creating Firebase user:', error)
    throw error
  }
}

/**
 * Delete a Firebase user by UID
 * Note: This requires admin privileges or the user to be currently signed in
 * @param {string} uid - The Firebase user ID to delete
 * @returns {Promise<void>}
 */
export async function deleteFirebaseUser(uid) {
  const auth = getFirebaseAuth()
  try {
    // For this to work, the user must be currently signed in
    // or this must be called from an admin context
    if (auth.currentUser && auth.currentUser.uid === uid) {
      await deleteUser(auth.currentUser)
      console.log('Firebase user deleted successfully:', uid)
    } else {
      // If the user is not the current user, we need to use the Firebase Admin SDK
      // This would typically be handled by the backend
      throw new Error('Cannot delete another user. This operation requires admin privileges.')
    }
  } catch (error) {
    console.error('Error deleting Firebase user:', error)
    throw error
  }
}
