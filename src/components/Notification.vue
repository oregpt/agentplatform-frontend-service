<template>
  <transition name="notification">
    <div 
      v-if="visible" 
      class="notification" 
      :class="[`notification-${type}`, { 'with-icon': showIcon }]"
    >
      <div v-if="showIcon" class="notification-icon">
        <svg v-if="type === 'success'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path fill="none" d="M0 0h24v24H0z"/>
          <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071-1.414-1.414-5.656 5.657-2.829-2.829-1.414 1.414L11.003 16z" fill="currentColor"/>
        </svg>
        <svg v-else-if="type === 'error'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path fill="none" d="M0 0h24v24H0z"/>
          <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" fill="currentColor"/>
        </svg>
        <svg v-else-if="type === 'info'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path fill="none" d="M0 0h24v24H0z"/>
          <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" fill="currentColor"/>
        </svg>
        <svg v-else-if="type === 'warning'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path fill="none" d="M0 0h24v24H0z"/>
          <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" fill="currentColor"/>
        </svg>
      </div>
      <div class="notification-content">
        <div v-if="title" class="notification-title">{{ title }}</div>
        <div class="notification-message">{{ message }}</div>
      </div>
      <button v-if="dismissable" @click="dismiss" class="notification-close">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path fill="none" d="M0 0h24v24H0z"/>
          <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'info', 'warning'].includes(value)
  },
  duration: {
    type: Number,
    default: 5000 // 5 seconds
  },
  dismissable: {
    type: Boolean,
    default: true
  },
  showIcon: {
    type: Boolean,
    default: true
  },
  position: {
    type: String,
    default: 'top-right',
    validator: (value) => [
      'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top', 'bottom'
    ].includes(value)
  }
});

const emit = defineEmits(['close']);
const visible = ref(true);
let timeout = null;

function dismiss() {
  visible.value = false;
  emit('close');
  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  }
}

watch(() => props.message, () => {
  // Reset timer when message changes
  visible.value = true;
  if (timeout) {
    clearTimeout(timeout);
  }
  if (props.duration > 0) {
    timeout = setTimeout(dismiss, props.duration);
  }
});

onMounted(() => {
  if (props.duration > 0) {
    timeout = setTimeout(dismiss, props.duration);
  }
});

onBeforeUnmount(() => {
  if (timeout) {
    clearTimeout(timeout);
  }
});
</script>

<style scoped>
.notification {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  margin-bottom: 16px;
  max-width: 400px;
  width: 100%;
  position: relative;
  background-color: white;
}

.notification.with-icon {
  padding-left: 12px;
}

.notification-icon {
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-content {
  flex-grow: 1;
}

.notification-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 0.95rem;
  line-height: 1.4;
}

.notification-close {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
  margin-left: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.notification-close:hover {
  opacity: 1;
}

/* Notification types */
.notification-success {
  background-color: #ebfaf0;
  border-left: 4px solid #2ecc71;
}

.notification-success .notification-icon,
.notification-success .notification-title {
  color: #27ae60;
}

.notification-error {
  background-color: #fdecea;
  border-left: 4px solid #e74c3c;
}

.notification-error .notification-icon,
.notification-error .notification-title {
  color: #c0392b;
}

.notification-info {
  background-color: #e7f5fe;
  border-left: 4px solid #3498db;
}

.notification-info .notification-icon,
.notification-info .notification-title {
  color: #2980b9;
}

.notification-warning {
  background-color: #fef9e7;
  border-left: 4px solid #f39c12;
}

.notification-warning .notification-icon,
.notification-warning .notification-title {
  color: #d35400;
}

/* Animation */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
