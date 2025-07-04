<template>
  <div class="search-bar" :class="{ 'expanded': expanded }">
    <div class="search-input-container">
      <input
        type="text"
        class="search-input"
        :placeholder="placeholder"
        v-model="searchQuery"
        @input="handleInput"
        @focus="expanded = true"
        @blur="handleBlur"
        :disabled="disabled"
        ref="searchInput"
      />
      
      <button 
        v-if="searchQuery" 
        class="clear-button"
        @click="clearSearch"
        :disabled="disabled"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path fill="none" d="M0 0h24v24H0z"/>
          <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" fill="currentColor"/>
        </svg>
      </button>
      
      <button 
        class="search-button"
        @click="handleSearch"
        :disabled="disabled"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
          <path fill="none" d="M0 0h24v24H0z"/>
          <path d="M18.031 16.617l4.283 4.282-1.415 1.415-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9 9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617zm-2.006-.742A6.977 6.977 0 0 0 18 11c0-3.868-3.133-7-7-7-3.868 0-7 3.132-7 7 0 3.867 3.132 7 7 7a6.977 6.977 0 0 0 4.875-1.975l.15-.15z" fill="currentColor"/>
        </svg>
      </button>
    </div>
    
    <div v-if="showAdvanced && expanded" class="advanced-search">
      <div class="filter-section">
        <h4>Filters</h4>
        <div class="filter-options">
          <slot name="filters"></slot>
        </div>
      </div>
      
      <div v-if="$slots.dateRange" class="date-range-section">
        <h4>Date Range</h4>
        <slot name="dateRange"></slot>
      </div>
      
      <div class="search-actions">
        <button 
          class="reset-button"
          @click="resetSearch"
          type="button"
        >
          Reset
        </button>
        <button 
          class="apply-button"
          @click="applyAdvancedSearch"
          type="button"
        >
          Apply Filters
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Search...'
  },
  debounceTime: {
    type: Number,
    default: 300
  },
  disabled: {
    type: Boolean,
    default: false
  },
  showAdvanced: {
    type: Boolean,
    default: false
  },
  autofocus: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'search', 'clear', 'reset', 'apply-filters']);

const searchQuery = ref(props.modelValue);
const expanded = ref(false);
const searchInput = ref(null);
let debounceTimeout = null;

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  searchQuery.value = newValue;
});

// Watch for internal changes to searchQuery
watch(searchQuery, (newValue) => {
  emit('update:modelValue', newValue);
});

// Set autofocus if needed
onMounted(() => {
  if (props.autofocus) {
    nextTick(() => {
      searchInput.value?.focus();
    });
  }
});

// Handle input with debounce
function handleInput() {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }
  
  debounceTimeout = setTimeout(() => {
    emit('search', searchQuery.value);
  }, props.debounceTime);
}

// Handle search button click
function handleSearch() {
  emit('search', searchQuery.value);
}

// Clear search
function clearSearch() {
  searchQuery.value = '';
  emit('clear');
  emit('search', '');
  
  // Focus the input after clearing
  nextTick(() => {
    searchInput.value?.focus();
  });
}

// Reset all search filters
function resetSearch() {
  searchQuery.value = '';
  emit('reset');
  
  // Focus the input after resetting
  nextTick(() => {
    searchInput.value?.focus();
  });
}

// Apply advanced search filters
function applyAdvancedSearch() {
  emit('apply-filters');
  expanded.value = false;
}

// Handle blur event
function handleBlur(event) {
  // Check if the related target is a child of the search bar
  // If not, collapse the advanced search
  if (props.showAdvanced) {
    // Use setTimeout to allow click events to be processed first
    setTimeout(() => {
      const searchBarEl = event.target.closest('.search-bar');
      if (searchBarEl && !searchBarEl.contains(document.activeElement)) {
        expanded.value = false;
      }
    }, 100);
  }
}

// Expose methods to parent component
defineExpose({
  clearSearch,
  resetSearch,
  focus: () => searchInput.value?.focus()
});
</script>

<style scoped>
.search-bar {
  position: relative;
  width: 100%;
  max-width: 500px;
  margin-bottom: 16px;
  z-index: 10;
}

.search-input-container {
  display: flex;
  position: relative;
  width: 100%;
}

.search-input {
  flex: 1;
  padding: 10px 40px 10px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  color: #2c3e50;
  background-color: white;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.search-input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.clear-button {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #7f8c8d;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-button:hover:not(:disabled) {
  color: #e74c3c;
}

.clear-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-button:hover:not(:disabled) {
  color: #2980b9;
}

.search-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.advanced-search {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: white;
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-top: -1px;
  z-index: 5;
}

.filter-section,
.date-range-section {
  margin-bottom: 16px;
}

.filter-section h4,
.date-range-section h4 {
  margin: 0 0 8px;
  font-size: 0.9rem;
  color: #7f8c8d;
  font-weight: 500;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.search-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.reset-button {
  padding: 8px 16px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  color: #7f8c8d;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.reset-button:hover {
  background-color: #ecf0f1;
}

.apply-button {
  padding: 8px 16px;
  background-color: #3498db;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.apply-button:hover {
  background-color: #2980b9;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .search-bar {
    max-width: 100%;
  }
  
  .advanced-search {
    position: fixed;
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-height: 70vh;
    overflow-y: auto;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    z-index: 100;
  }
}
</style>
