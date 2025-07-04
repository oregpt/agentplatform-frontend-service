# OreGPT Agent Platform - Frontend Service

This is the frontend service for the OreGPT Agent Platform, built with Vue 3, Pinia for state management, and Vue Router for navigation. It provides a user interface for managing organizations, agents, files, and users.

## Features

- **Firebase Authentication**: Secure login/logout functionality
- **Organization Management**: Create, configure, and manage organizations
- **Agent Management**: Create and configure agents with metadata
- **File Management**: Upload, download, and delete markdown files with drag-and-drop functionality
- **User Management**: Assign users to specific agents and manage permissions
- **Organization-aware UI**: Components adapt based on the user's organization context

## Prerequisites

- Node.js 16+ and npm
- Firebase project with Authentication enabled
- Backend Service and Auth Service running locally or deployed

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Project Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## API Integration

The frontend service communicates with two backend services:

1. **Auth Service**: Handles authentication and user management
   - Default URL: http://localhost:8080
   - Endpoints: `/api/auth/*`

2. **Backend Service**: Handles organization, agent, and file management
   - Default URL: http://localhost:8081
   - Endpoints: `/api/v1/*`

## Project Structure

```
frontend-service/
├── public/                 # Static assets
├── src/
│   ├── assets/             # CSS and other assets
│   ├── components/         # Reusable Vue components
│   ├── router/             # Vue Router configuration
│   ├── services/           # API and Firebase services
│   ├── store/              # Pinia stores
│   ├── utils/              # Utility functions
│   ├── views/              # Page components
│   ├── App.vue             # Root component
│   └── main.js             # Application entry point
├── .env                    # Environment variables
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
└── vite.config.js          # Vite configuration
```

## Authentication Flow

1. User logs in with Firebase Authentication
2. Firebase returns an ID token
3. Token is sent to Auth Service for validation and role assignment
4. User is redirected to the dashboard with appropriate permissions

## Development Guidelines

- Follow Vue 3 Composition API patterns
- Use Pinia for state management
- Implement proper error handling for API calls
- Ensure responsive design for all components
- Maintain organization-level data isolation

## License

Copyright © 2025 OreGPT. All rights reserved.