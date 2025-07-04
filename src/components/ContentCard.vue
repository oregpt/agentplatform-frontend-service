<template>
  <div 
    class="content-card" 
    :class="{ 
      'hoverable': hoverable, 
      'selectable': selectable,
      'selected': selected,
      [`elevation-${elevation}`]: true
    }"
    @click="handleCardClick"
  >
    <!-- Card Header -->
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <div class="card-title-container">
          <h3 class="card-title">{{ title }}</h3>
          <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
        </div>
      </slot>
    </div>
    
    <!-- Card Media -->
    <div v-if="$slots.media || imageUrl" class="card-media">
      <slot name="media">
        <img v-if="imageUrl" :src="imageUrl" :alt="imageAlt || title" class="card-image" />
      </slot>
    </div>
    
    <!-- Card Content -->
    <div class="card-content">
      <slot></slot>
    </div>
    
    <!-- Card Actions -->
    <div v-if="$slots.actions" class="card-actions">
      <slot name="actions"></slot>
    </div>
    
    <!-- Card Footer -->
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: ''
  },
  imageAlt: {
    type: String,
    default: ''
  },
  hoverable: {
    type: Boolean,
    default: false
  },
  selectable: {
    type: Boolean,
    default: false
  },
  selected: {
    type: Boolean,
    default: false
  },
  elevation: {
    type: Number,
    default: 1,
    validator: (value) => value >= 0 && value <= 5
  }
});

const emit = defineEmits(['click']);

function handleCardClick(event) {
  if (props.hoverable || props.selectable) {
    emit('click', event);
  }
}
</script>

<style scoped>
.content-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Elevation levels */
.elevation-0 {
  box-shadow: none;
  border: 1px solid #eee;
}

.elevation-1 {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.elevation-2 {
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

.elevation-3 {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.elevation-4 {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.elevation-5 {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
}

.hoverable {
  cursor: pointer;
}

.hoverable:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.selectable {
  cursor: pointer;
  position: relative;
}

.selectable::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid transparent;
  border-radius: 8px;
  pointer-events: none;
  transition: border-color 0.2s ease;
}

.selected::before {
  border-color: #3498db;
}

.card-header {
  padding: 16px 16px 8px;
}

.card-title-container {
  display: flex;
  flex-direction: column;
}

.card-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
  color: #2c3e50;
}

.card-subtitle {
  margin: 4px 0 0;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.card-media {
  position: relative;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: auto;
  display: block;
}

.card-content {
  padding: 16px;
  flex: 1;
}

.card-actions {
  padding: 8px 16px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.card-footer {
  padding: 12px 16px;
  border-top: 1px solid #eee;
  background-color: #f8f9fa;
}

/* When card has no content, reduce padding */
.content-card:empty {
  padding: 0;
}
</style>
