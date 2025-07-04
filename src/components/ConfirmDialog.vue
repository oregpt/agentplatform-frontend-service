<template>
  <div v-if="modelValue" class="confirm-dialog-backdrop" @click.self="cancel">
    <div class="confirm-dialog">
      <div class="confirm-dialog-header">
        <h3>{{ title }}</h3>
        <button class="close-button" @click="cancel">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="none" d="M0 0h24v24H0z"/>
            <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      
      <div class="confirm-dialog-body">
        <div v-if="icon" class="dialog-icon" :class="iconClass">
          <svg v-if="icon === 'warning'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
            <path fill="none" d="M0 0h24v24H0z"/>
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" fill="currentColor"/>
          </svg>
          <svg v-else-if="icon === 'delete'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
            <path fill="none" d="M0 0h24v24H0z"/>
            <path d="M17 6h5v2h-2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8H2V6h5V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3zm1 2H6v12h12V8zm-9 3h2v6H9v-6zm4 0h2v6h-2v-6zM9 4v2h6V4H9z" fill="currentColor"/>
          </svg>
          <svg v-else-if="icon === 'info'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
            <path fill="none" d="M0 0h24v24H0z"/>
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM11 7h2v2h-2V7zm0 4h2v6h-2v-6z" fill="currentColor"/>
          </svg>
        </div>
        
        <div class="dialog-content">
          <p>{{ message }}</p>
          <p v-if="details" class="dialog-details">{{ details }}</p>
        </div>
      </div>
      
      <div class="confirm-dialog-footer">
        <button class="cancel-button" @click="cancel">
          {{ cancelText }}
        </button>
        <button 
          class="confirm-button" 
          :class="{ 'is-danger': confirmType === 'danger' }"
          @click="confirm"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: 'Confirm'
  },
  message: {
    type: String,
    required: true
  },
  details: {
    type: String,
    default: ''
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  confirmType: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'danger'].includes(value)
  },
  icon: {
    type: String,
    default: '',
    validator: (value) => ['', 'warning', 'delete', 'info'].includes(value)
  }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const iconClass = computed(() => {
  if (props.icon === 'warning' || props.icon === 'delete') {
    return 'icon-warning';
  } else if (props.icon === 'info') {
    return 'icon-info';
  }
  return '';
});

function confirm() {
  emit('confirm');
  emit('update:modelValue', false);
}

function cancel() {
  emit('cancel');
  emit('update:modelValue', false);
}
</script>

<style scoped>
.confirm-dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.confirm-dialog {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.confirm-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #eee;
}

.confirm-dialog-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #2c3e50;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #95a5a6;
  padding: 0;
}

.close-button:hover {
  color: #7f8c8d;
}

.confirm-dialog-body {
  padding: 24px;
  display: flex;
  align-items: flex-start;
}

.dialog-icon {
  margin-right: 20px;
  flex-shrink: 0;
}

.icon-warning {
  color: #e74c3c;
}

.icon-info {
  color: #3498db;
}

.dialog-content {
  flex-grow: 1;
}

.dialog-content p {
  margin: 0 0 12px;
  color: #2c3e50;
  line-height: 1.5;
}

.dialog-content p:last-child {
  margin-bottom: 0;
}

.dialog-details {
  font-size: 0.9rem;
  color: #7f8c8d;
  white-space: pre-line;
}

.confirm-dialog-footer {
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #eee;
}

.cancel-button, .confirm-button {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-button {
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  color: #2c3e50;
}

.cancel-button:hover {
  background-color: #e9ecef;
}

.confirm-button {
  background-color: #3498db;
  border: 1px solid #3498db;
  color: white;
}

.confirm-button:hover {
  background-color: #2980b9;
  border-color: #2980b9;
}

.confirm-button.is-danger {
  background-color: #e74c3c;
  border-color: #e74c3c;
}

.confirm-button.is-danger:hover {
  background-color: #c0392b;
  border-color: #c0392b;
}
</style>
