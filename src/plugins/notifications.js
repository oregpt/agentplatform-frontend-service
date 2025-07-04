/**
 * Notification plugin for Vue
 * Provides a global notification system that can be accessed from any component
 */

import { markRaw, ref } from 'vue';
import NotificationContainer from '../components/NotificationContainer.vue';

export default {
  install: (app) => {
    // Create a container for the notification component
    const notificationContainerRef = ref(null);
    
    // Create a global $notify object
    const notify = {
      // Reference to the notification container component
      containerRef: notificationContainerRef,
      
      // Success notification
      success(message, options = {}) {
        return this.show({
          message,
          type: 'success',
          ...options
        });
      },
      
      // Error notification
      error(message, options = {}) {
        return this.show({
          message,
          type: 'error',
          ...options
        });
      },
      
      // Info notification
      info(message, options = {}) {
        return this.show({
          message,
          type: 'info',
          ...options
        });
      },
      
      // Warning notification
      warning(message, options = {}) {
        return this.show({
          message,
          type: 'warning',
          ...options
        });
      },
      
      // Show a notification with custom options
      show(options) {
        if (!notificationContainerRef.value) {
          console.error('NotificationContainer is not mounted yet');
          return -1;
        }
        
        return notificationContainerRef.value.addNotification(options);
      },
      
      // Remove a notification by ID
      remove(id) {
        if (!notificationContainerRef.value) return;
        notificationContainerRef.value.removeNotification(id);
      },
      
      // Clear all notifications
      clear() {
        if (!notificationContainerRef.value) return;
        notificationContainerRef.value.clearNotifications();
      }
    };
    
    // Add the notification container to the app
    app.component('NotificationContainer', markRaw(NotificationContainer));
    
    // Add the $notify object to the app's global properties
    app.config.globalProperties.$notify = notify;
    
    // Provide the notify object for Composition API
    app.provide('notify', notify);
  }
};
