<template>
  <div 
    class="file-uploader"
    :class="{ 
      'is-dragging': isDragging, 
      'has-error': error, 
      'is-disabled': disabled 
    }"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <input
      type="file"
      ref="fileInput"
      :accept="acceptedFileTypes"
      @change="onFileChange"
      :multiple="multiple"
      class="file-input"
      :disabled="disabled || isUploading"
    />
    
    <div v-if="isUploading" class="upload-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
      </div>
      <div class="progress-text">Uploading... {{ uploadProgress }}%</div>
      <button v-if="cancelable" @click="cancelUpload" class="cancel-button">Cancel</button>
    </div>
    
    <div v-else class="upload-content">
      <div class="upload-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
          <path fill="none" d="M0 0h24v24H0z"/>
          <path d="M12 12.586l4.243 4.242-1.415 1.415L13 16.415V22h-2v-5.587l-1.828 1.83-1.415-1.415L12 12.586zM12 2a7.001 7.001 0 0 1 6.954 6.194 5.5 5.5 0 0 1-.953 10.784v-2.014a3.5 3.5 0 1 0-1.112-6.91 5 5 0 1 0-9.777 0 3.5 3.5 0 0 0-1.292 6.88l.19.031v2.014a5.5 5.5 0 0 1-.954-10.784A7 7 0 0 1 12 2z" fill="currentColor"/>
        </svg>
      </div>
      <div class="upload-text">
        <h3>{{ title }}</h3>
        <p>{{ description }}</p>
        <p class="file-types">Accepted file types: {{ formattedAcceptedTypes }}</p>
      </div>
      <div class="upload-actions">
        <button 
          type="button"
          @click="triggerFileInput" 
          class="browse-button"
          :disabled="disabled"
        >
          Browse Files
        </button>
      </div>
    </div>
    
    <div v-if="error" class="upload-error">
      {{ error }}
    </div>
    
    <div v-if="showPreview && files.length > 0" class="file-preview">
      <h4>Selected Files</h4>
      <ul class="file-list">
        <li v-for="(file, index) in files" :key="index" class="file-item">
          <div class="file-info">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">({{ formatFileSize(file.size) }})</span>
          </div>
          <button @click="removeFile(index)" class="remove-file" :disabled="isUploading">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" fill="currentColor"/>
            </svg>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  acceptedFileTypes: {
    type: String,
    default: '*'
  },
  multiple: {
    type: Boolean,
    default: false
  },
  maxFileSize: {
    type: Number,
    default: 10 * 1024 * 1024 // 10MB
  },
  title: {
    type: String,
    default: 'Drag & Drop Files'
  },
  description: {
    type: String,
    default: 'or click to browse'
  },
  showPreview: {
    type: Boolean,
    default: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  cancelable: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['files-selected', 'upload-progress', 'upload-complete', 'upload-error', 'upload-canceled']);

const fileInput = ref(null);
const files = ref([]);
const isDragging = ref(false);
const error = ref('');
const isUploading = ref(false);
const uploadProgress = ref(0);

// Computed property to format accepted file types for display
const formattedAcceptedTypes = computed(() => {
  if (props.acceptedFileTypes === '*') return 'All files';
  
  return props.acceptedFileTypes
    .split(',')
    .map(type => type.trim())
    .map(type => {
      if (type.startsWith('.')) {
        return type.substring(1).toUpperCase();
      }
      return type;
    })
    .join(', ');
});

// Trigger file input click
function triggerFileInput() {
  if (!props.disabled && !isUploading.value) {
    fileInput.value.click();
  }
}

// Handle drag over event
function onDragOver(event) {
  if (props.disabled || isUploading.value) return;
  
  isDragging.value = true;
  
  // Check if the dragged items are files
  if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
    // Only allow if all items are files
    for (let i = 0; i < event.dataTransfer.items.length; i++) {
      if (event.dataTransfer.items[i].kind !== 'file') {
        isDragging.value = false;
        return;
      }
    }
  }
}

// Handle drag leave event
function onDragLeave() {
  isDragging.value = false;
}

// Handle drop event
function onDrop(event) {
  if (props.disabled || isUploading.value) return;
  
  isDragging.value = false;
  error.value = '';
  
  const droppedFiles = Array.from(event.dataTransfer.files);
  handleFiles(droppedFiles);
}

// Handle file input change event
function onFileChange(event) {
  if (props.disabled || isUploading.value) return;
  
  error.value = '';
  const selectedFiles = Array.from(event.target.files);
  handleFiles(selectedFiles);
  
  // Reset file input so the same file can be selected again
  event.target.value = '';
}

// Process selected files
function handleFiles(selectedFiles) {
  if (selectedFiles.length === 0) return;
  
  // Check if multiple files are allowed
  if (!props.multiple && selectedFiles.length > 1) {
    error.value = 'Only one file can be uploaded at a time';
    return;
  }
  
  // Check file types
  if (props.acceptedFileTypes !== '*') {
    const acceptedTypes = props.acceptedFileTypes.split(',').map(type => type.trim());
    
    for (const file of selectedFiles) {
      let isValidType = false;
      
      for (const type of acceptedTypes) {
        if (type.startsWith('.')) {
          // Check file extension
          if (file.name.toLowerCase().endsWith(type.toLowerCase())) {
            isValidType = true;
            break;
          }
        } else {
          // Check MIME type
          if (file.type === type || type === '*') {
            isValidType = true;
            break;
          }
        }
      }
      
      if (!isValidType) {
        error.value = `File type not allowed: ${file.name}`;
        return;
      }
    }
  }
  
  // Check file size
  for (const file of selectedFiles) {
    if (file.size > props.maxFileSize) {
      const maxSizeMB = props.maxFileSize / (1024 * 1024);
      error.value = `File too large: ${file.name}. Maximum size is ${maxSizeMB} MB`;
      return;
    }
  }
  
  // Update files array
  if (props.multiple) {
    files.value = [...files.value, ...selectedFiles];
  } else {
    files.value = [selectedFiles[0]];
  }
  
  // Emit files selected event
  emit('files-selected', props.multiple ? files.value : files.value[0]);
}

// Remove a file from the selection
function removeFile(index) {
  if (isUploading.value) return;
  
  files.value.splice(index, 1);
  emit('files-selected', props.multiple ? files.value : (files.value.length > 0 ? files.value[0] : null));
}

// Simulate file upload with progress
function uploadFiles() {
  if (files.value.length === 0 || isUploading.value) return;
  
  isUploading.value = true;
  uploadProgress.value = 0;
  error.value = '';
  
  // This is a placeholder for actual upload logic
  // In a real app, you would use Axios or Fetch to upload files
  
  // Return a promise that resolves when upload is complete
  return new Promise((resolve, reject) => {
    const totalFiles = files.value.length;
    let uploadedFiles = 0;
    
    // Process each file
    files.value.forEach(file => {
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          uploadedFiles++;
          
          // Calculate overall progress
          uploadProgress.value = Math.round((uploadedFiles / totalFiles) * 100);
          
          // Emit progress event
          emit('upload-progress', uploadProgress.value);
          
          // Check if all files are uploaded
          if (uploadedFiles === totalFiles) {
            setTimeout(() => {
              isUploading.value = false;
              emit('upload-complete', files.value);
              resolve(files.value);
            }, 500);
          }
        } else {
          // Calculate overall progress
          const fileProgress = progress / 100;
          const overallProgress = ((uploadedFiles + fileProgress) / totalFiles) * 100;
          uploadProgress.value = Math.round(overallProgress);
          
          // Emit progress event
          emit('upload-progress', uploadProgress.value);
        }
      }, 200);
    });
  });
}

// Cancel upload
function cancelUpload() {
  if (!isUploading.value) return;
  
  isUploading.value = false;
  uploadProgress.value = 0;
  emit('upload-canceled');
}

// Format file size for display
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Reset the uploader
function reset() {
  files.value = [];
  error.value = '';
  isUploading.value = false;
  uploadProgress.value = 0;
}

// Expose methods to parent component
defineExpose({
  uploadFiles,
  cancelUpload,
  reset,
  files
});
</script>

<style scoped>
.file-uploader {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  background-color: #f8f9fa;
  transition: all 0.3s ease;
}

.file-uploader.is-dragging {
  border-color: #3498db;
  background-color: rgba(52, 152, 219, 0.05);
}

.file-uploader.has-error {
  border-color: #e74c3c;
}

.file-uploader.is-disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.file-input {
  display: none;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-icon {
  margin-bottom: 16px;
  color: #7f8c8d;
}

.upload-text h3 {
  margin: 0 0 8px;
  color: #2c3e50;
  font-size: 1.2rem;
}

.upload-text p {
  margin: 0 0 8px;
  color: #7f8c8d;
}

.file-types {
  font-size: 0.85rem;
  color: #95a5a6;
}

.upload-actions {
  margin-top: 16px;
}

.browse-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.browse-button:hover:not(:disabled) {
  background-color: #2980b9;
}

.browse-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.upload-error {
  margin-top: 16px;
  color: #e74c3c;
  font-size: 0.9rem;
}

.file-preview {
  margin-top: 20px;
  text-align: left;
}

.file-preview h4 {
  margin: 0 0 12px;
  color: #2c3e50;
  font-size: 1rem;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: white;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  overflow: hidden;
}

.file-name {
  font-size: 0.9rem;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.file-size {
  font-size: 0.8rem;
  color: #7f8c8d;
  margin-left: 8px;
}

.remove-file {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  padding: 4px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.remove-file:hover:not(:disabled) {
  opacity: 1;
}

.remove-file:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.upload-progress {
  width: 100%;
  padding: 16px 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background-color: #3498db;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 12px;
}

.cancel-button {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.2s;
}

.cancel-button:hover {
  background-color: #c0392b;
}
</style>
