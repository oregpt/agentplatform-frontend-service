<template>
  <div class="notification-container" :class="position">
    <transition-group name="notification-list">
      <Notification
        v-for="notification in notifications"
        :key="notification.id"
        :message="notification.message"
        :title="notification.title"
        :type="notification.type"
        :duration="notification.duration"
        :dismissable="notification.dismissable"
        :show-icon="notification.showIcon"
        @close="removeNotification(notification.id)"
      />
    </transition-group>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Notification from './Notification.vue';

const props = defineProps({
  position: {
    type: String,
    default: 'top-right',
    validator: (value) => [
      'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top', 'bottom'
    ].includes(value)
  },
  maxNotifications: {
    type: Number,
    default: 5
  }
});

const notifications = ref([]);
let nextId = 1;

// Add a new notification
function addNotification(notification) {
  const id = nextId++;
  
  // Add the notification to the list
  notifications.value.push({
    id,
    message: notification.message || 'Notification',
    title: notification.title || '',
    type: notification.type || 'info',
    duration: notification.duration !== undefined ? notification.duration : 5000,
    dismissable: notification.dismissable !== undefined ? notification.dismissable : true,
    showIcon: notification.showIcon !== undefined ? notification.showIcon : true
  });
  
  // If we have more notifications than the max, remove the oldest one
  if (notifications.value.length > props.maxNotifications) {
    notifications.value.shift();
  }
  
  return id;
}

// Remove a notification by ID
function removeNotification(id) {
  const index = notifications.value.findIndex(n => n.id === id);
  if (index !== -1) {
    notifications.value.splice(index, 1);
  }
}

// Clear all notifications
function clearNotifications() {
  notifications.value = [];
}

// Expose methods to the parent component
defineExpose({
  addNotification,
  removeNotification,
  clearNotifications
});
</script>

<style scoped>
.notification-container {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  max-width: 400px;
  width: 100%;
  padding: 16px;
  pointer-events: none;
}

.notification-container > * {
  pointer-events: auto;
}

.top-right {
  top: 0;
  right: 0;
}

.top-left {
  top: 0;
  left: 0;
}

.bottom-right {
  bottom: 0;
  right: 0;
  flex-direction: column-reverse;
}

.bottom-left {
  bottom: 0;
  left: 0;
  flex-direction: column-reverse;
}

.top {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}

.bottom {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  flex-direction: column-reverse;
  align-items: center;
}

/* List transitions */
.notification-list-enter-active,
.notification-list-leave-active {
  transition: all 0.3s ease;
}

.notification-list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.notification-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
