<template>
  <div v-if="message" class="error-container" :class="{ 'is-inline': inline, 'is-banner': banner }">
    <div class="error-icon" v-if="showIcon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <path fill="none" d="M0 0h24v24H0z"/>
        <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" fill="currentColor"/>
      </svg>
    </div>
    <div class="error-content">
      <div v-if="title" class="error-title">{{ title }}</div>
      <div class="error-message">{{ message }}</div>
      <button v-if="retryable" @click="$emit('retry')" class="retry-button">
        Retry
      </button>
    </div>
    <button v-if="dismissable" @click="$emit('dismiss')" class="dismiss-button">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
        <path fill="none" d="M0 0h24v24H0z"/>
        <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" fill="currentColor"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  inline: {
    type: Boolean,
    default: false
  },
  banner: {
    type: Boolean,
    default: false
  },
  dismissable: {
    type: Boolean,
    default: false
  },
  retryable: {
    type: Boolean,
    default: false
  },
  showIcon: {
    type: Boolean,
    default: true
  }
});

defineEmits(['dismiss', 'retry']);
</script>

<style scoped>
.error-container {
  display: flex;
  align-items: flex-start;
  background-color: #fdecea;
  border-left: 4px solid #e74c3c;
  color: #c0392b;
  padding: 12px 16px;
  margin: 10px 0;
  border-radius: 4px;
}

.error-container.is-inline {
  display: inline-flex;
  padding: 6px 12px;
  margin: 0;
}

.error-container.is-banner {
  border-radius: 0;
  border-left: none;
  border-bottom: 1px solid #e74c3c;
  margin: 0;
  width: 100%;
}

.error-icon {
  flex-shrink: 0;
  margin-right: 12px;
  color: #e74c3c;
}

.error-content {
  flex-grow: 1;
}

.error-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.error-message {
  font-size: 0.95rem;
}

.dismiss-button {
  background: none;
  border: none;
  color: #c0392b;
  cursor: pointer;
  padding: 0;
  margin-left: 12px;
  opacity: 0.7;
  flex-shrink: 0;
}

.dismiss-button:hover {
  opacity: 1;
}

.retry-button {
  background-color: transparent;
  border: 1px solid #c0392b;
  color: #c0392b;
  border-radius: 4px;
  padding: 4px 12px;
  margin-top: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background-color: rgba(231, 76, 60, 0.1);
}
</style>
