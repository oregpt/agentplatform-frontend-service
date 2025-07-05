<template>
  <div class="organization-selector">
    <label for="organization-select" class="selector-label">Organization</label>
    <div class="select-container">
      <select 
        id="organization-select" 
        v-model="selectedOrganizationId"
        class="organization-select"
        :disabled="disabled || loading"
        @change="handleChange"
      >
        <option v-if="loading" value="" disabled>Loading organizations...</option>
        <option v-else-if="includeAllOption" value="all">All Organizations</option>
        <option 
          v-for="org in organizations" 
          :key="org.id" 
          :value="org.id"
        >
          {{ org.name }}
        </option>
      </select>
      <div class="select-arrow">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path fill="none" d="M0 0h24v24H0z"/>
          <path d="M12 15l-4.243-4.243 1.415-1.414L12 12.172l2.828-2.829 1.415 1.414z" fill="currentColor"/>
        </svg>
      </div>
      <div v-if="loading" class="loading-indicator">
        <div class="spinner"></div>
      </div>
    </div>
    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { organizationsApi } from '../services/api';
import { inject } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  includeAllOption: {
    type: Boolean,
    default: false
  },
  autoLoad: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

// Inject notification system if available
const notify = inject('notify', null);

const organizations = ref([]);
const loading = ref(false);
const error = ref('');
const selectedOrganizationId = ref(props.modelValue);

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  selectedOrganizationId.value = newValue;
});

// Watch for internal changes to selectedOrganizationId
watch(selectedOrganizationId, (newValue) => {
  emit('update:modelValue', newValue);
});

// Load organizations on component mount if autoLoad is true
onMounted(() => {
  if (props.autoLoad) {
    loadOrganizations();
  }
});

// Load organizations from the API
async function loadOrganizations() {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await organizationsApi.getAll();
    // Handle both formats: direct array or nested under 'organizations' key
    organizations.value = response.data.organizations || response.data || [];
    console.log('Organizations loaded:', organizations.value.length);
    
    // If no organization is selected and we have organizations, select the first one
    if (!selectedOrganizationId.value && organizations.value.length > 0 && !props.includeAllOption) {
      selectedOrganizationId.value = organizations.value[0].id;
      emit('update:modelValue', selectedOrganizationId.value);
    } else if (props.includeAllOption && !selectedOrganizationId.value) {
      selectedOrganizationId.value = 'all';
      emit('update:modelValue', selectedOrganizationId.value);
    }
  } catch (err) {
    error.value = 'Failed to load organizations';
    console.error('Error loading organizations:', err);
    
    // Show notification if available
    if (notify) {
      notify.error('Failed to load organizations');
    }
  } finally {
    loading.value = false;
  }
}

// Handle change event
function handleChange() {
  emit('change', selectedOrganizationId.value);
}

// Expose methods to parent component
defineExpose({
  loadOrganizations
});
</script>

<style scoped>
.organization-selector {
  margin-bottom: 20px;
}

.selector-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #2c3e50;
}

.select-container {
  position: relative;
}

.organization-select {
  width: 100%;
  padding: 10px 12px;
  padding-right: 30px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 1rem;
  color: #2c3e50;
  appearance: none;
  cursor: pointer;
}

.organization-select:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #7f8c8d;
}

.loading-indicator {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.error-message {
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 6px;
  margin-bottom: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
