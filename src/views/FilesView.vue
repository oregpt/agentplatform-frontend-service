<template>
  <div class="files-container">
    <div class="header">
      <div class="title-section">
        <h1>Files</h1>
        <span v-if="agent" class="agent-name">for {{ agent.name }}</span>
      </div>
      <div class="actions">
        <button @click="showUploadModal = true" class="upload-btn">Upload Files</button>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading files...</div>
    
    <div v-else-if="files.length === 0" class="empty-state">
      <p>No files found for this agent. Upload markdown files to get started.</p>
      <div class="upload-zone" @click="showUploadModal = true">
        <div class="upload-icon">
          <i class="mdi mdi-upload"></i>
        </div>
        <p>Click to upload .md files</p>
      </div>
    </div>
    
    <div v-else class="files-table-container">
      <table class="files-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Size</th>
            <th>Type</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="file in files" :key="file.id" class="file-row">
            <td class="file-name">{{ file.name }}</td>
            <td>{{ formatFileSize(file.sizeBytes) }}</td>
            <td>{{ file.contentType || 'text/markdown' }}</td>
            <td>{{ formatDate(file.createdAt) }}</td>
            <td class="file-actions">
              <button @click="downloadFile(file)" class="action-btn download-btn" title="Download">
                <i class="mdi mdi-download"></i>
              </button>
              <button @click="confirmDelete(file)" class="action-btn delete-btn" title="Delete">
                <span class="delete-x">X</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="modal-backdrop">
      <div class="modal">
        <h2>Upload Files</h2>
        <p>Select markdown (.md) files to upload to this agent.</p>
        
        <div 
          class="dropzone"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onFileDrop"
          @click="triggerFileInput"
          :class="{ 'active': isDragging }"
        >
          <div v-if="!selectedFiles.length">
            <i class="mdi mdi-upload"></i>
            <p>Drag and drop files here or click to browse</p>
            <input 
              type="file" 
              ref="fileInput"
              @change="onFileSelect"
              accept=".md"
              multiple
              class="file-input"
              style="display: none;"
            />
          </div>
          <div v-else class="selected-files">
            <div v-for="(file, index) in selectedFiles" :key="index" class="selected-file">
              <span>{{ file.name }}</span>
              <span>{{ formatFileSize(file.size) }}</span>
              <button @click.prevent="removeFile(index)" class="remove-file">
                <i class="mdi mdi-close"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div class="upload-progress" v-if="uploading">
          <div class="progress-bar">
            <div class="progress" :style="{ width: `${uploadProgress}%` }"></div>
          </div>
          <span>{{ uploadProgress }}%</span>
        </div>
        
        <div class="modal-actions">
          <button type="button" @click="closeUploadModal" class="cancel-btn" :disabled="uploading">Cancel</button>
          <button 
            @click="uploadFiles" 
            class="upload-btn" 
            :disabled="selectedFiles.length === 0 || uploading"
          >
            {{ uploading ? 'Uploading...' : 'Upload' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-backdrop">
      <div class="modal">
        <h2>Delete File</h2>
        <p>Are you sure you want to delete <strong>{{ selectedFile.name }}</strong>?</p>
        <p class="warning">This action cannot be undone.</p>
        
        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="cancel-btn">Cancel</button>
          <button @click="deleteFile" class="delete-btn">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { filesApi, agentsApi } from '../services/api'

const route = useRoute()
const agentId = ref('')
const agent = ref(null)
const files = ref([])
const loading = ref(true)
const showUploadModal = ref(false)
const showDeleteModal = ref(false)
const selectedFile = ref({})
const selectedFiles = ref([])
const isDragging = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const fileInput = ref(null)

onMounted(async () => {
  agentId.value = route.params.agentId
  if (agentId.value) {
    await Promise.all([
      fetchAgent(),
      fetchFiles()
    ])
  }
})

async function fetchAgent() {
  try {
    const response = await agentsApi.getById(agentId.value)
    agent.value = response.data
  } catch (error) {
    console.error('Error fetching agent:', error)
  }
}

async function fetchFiles() {
  loading.value = true
  try {
    const response = await filesApi.getAll(agentId.value)
    console.log('Files response:', response.data)
    
    let fetchedFiles = [];
    
    // Handle different response formats
    if (Array.isArray(response.data)) {
      fetchedFiles = response.data
    } else if (response.data && Array.isArray(response.data.files)) {
      fetchedFiles = response.data.files
    } else if (response.data && response.data.id) {
      fetchedFiles = [response.data] // Single file
    } else {
      fetchedFiles = []
    }
    
    // Filter out invalid files (missing ID or name)
    fetchedFiles = fetchedFiles.filter(file => {
      // Check if file has a valid ID
      if (!file || !file.id) {
        console.warn('Filtering out file with missing ID:', file)
        return false
      }
      
      // Check if file has a valid name
      if (!file.name) {
        console.warn('Filtering out file with missing name:', file.id)
        return false
      }
      
      return true
    })
    
    // Process valid files with proper defaults
    files.value = fetchedFiles.map(file => ({
      ...file,
      sizeBytes: file.sizeBytes || 0,
      contentType: file.contentType || 'text/markdown',
      createdAt: file.createdAt || new Date().toISOString()
    }))
    
    console.log('Processed files after filtering:', files.value)
  } catch (error) {
    console.error('Error fetching files:', error)
    files.value = []
  } finally {
    loading.value = false
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

function onFileDrop(event) {
  isDragging.value = false
  const droppedFiles = Array.from(event.dataTransfer.files)
  
  // Filter for only .md files
  const markdownFiles = droppedFiles.filter(file => file.name.toLowerCase().endsWith('.md'))
  
  if (markdownFiles.length === 0) {
    alert('Only markdown (.md) files are allowed')
    return
  }
  
  selectedFiles.value = [...selectedFiles.value, ...markdownFiles]
}

function onFileSelect(event) {
  if (!event.target.files || event.target.files.length === 0) {
    console.log('No files selected')
    return
  }
  
  const files = Array.from(event.target.files)
  
  // Filter for only .md files
  const markdownFiles = files.filter(file => file.name.toLowerCase().endsWith('.md'))
  
  if (markdownFiles.length === 0) {
    alert('Only markdown (.md) files are allowed')
    return
  }
  
  selectedFiles.value = [...selectedFiles.value, ...markdownFiles]
  console.log('Files selected:', selectedFiles.value)
  
  // Reset the file input to allow selecting the same file again
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function removeFile(index) {
  selectedFiles.value.splice(index, 1)
}

function triggerFileInput() {
  // Only trigger if there are no files selected yet
  if (selectedFiles.value.length === 0 && fileInput.value) {
    fileInput.value.click()
  }
}

async function uploadFiles() {
  if (selectedFiles.value.length === 0) return
  
  uploading.value = true
  uploadProgress.value = 0
  
  try {
    // For each file, create a FormData and upload
    for (let i = 0; i < selectedFiles.value.length; i++) {
      const file = selectedFiles.value[i]
      const formData = new FormData()
      formData.append('file', file)
      
      await filesApi.upload(agentId.value, formData)
      
      // Update progress
      uploadProgress.value = Math.round(((i + 1) / selectedFiles.value.length) * 100)
    }
    
    // Refresh files list
    await fetchFiles()
    closeUploadModal()
  } catch (error) {
    console.error('Error uploading files:', error)
    alert('Error uploading files: ' + error.message)
  } finally {
    uploading.value = false
  }
}

function closeUploadModal() {
  showUploadModal.value = false
  selectedFiles.value = []
  isDragging.value = false
  uploading.value = false
  uploadProgress.value = 0
}

function confirmDelete(file) {
  selectedFile.value = file
  showDeleteModal.value = true
}

async function downloadFile(file) {
  // Validate file and file ID
  if (!file || !file.id) {
    console.error('Cannot download file: File or file ID is undefined', file)
    alert('Error: Cannot download file because the file ID is missing')
    return
  }
  
  try {
    console.log(`Downloading file with ID: ${file.id}, name: ${file.name}`)
    const response = await filesApi.download(file.id)
    
    // Create a blob URL from the file data
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    
    // Use file name from the file object or from response headers
    let filename = file.name || 'download'
    
    // If no filename from file object, try to get it from headers
    if (!file.name && response.headers['content-disposition']) {
      const filenameMatch = response.headers['content-disposition'].match(/filename="?([^"]+)"?/)
      if (filenameMatch && filenameMatch.length >= 2) {
        filename = filenameMatch[1]
      }
    }
    
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    
    // Clean up the blob URL
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading file:', error)
    alert(`Error downloading file: ${error.message || 'Unknown error'}`)
  }
}

async function deleteFile() {
  // Validate file ID
  if (!selectedFile.value || !selectedFile.value.id) {
    console.error('Cannot delete file: File ID is undefined', selectedFile.value)
    alert('Error: Cannot delete file because the file ID is missing')
    showDeleteModal.value = false
    return
  }
  
  try {
    console.log(`Deleting file with ID: ${selectedFile.value.id}`)
    
    // Store file info for UI update
    const fileId = selectedFile.value.id
    const fileName = selectedFile.value.name
    
    // Call API to delete the file
    await filesApi.delete(fileId)
    
    // Immediately remove the file from the local array for instant UI feedback
    files.value = files.value.filter(file => file.id !== fileId)
    console.log(`File ${fileName} (ID: ${fileId}) removed from UI`)
    
    // Then refresh the full list from the server
    await fetchFiles()
    
    // Close the modal
    showDeleteModal.value = false
  } catch (error) {
    console.error('Error deleting file:', error)
    alert(`Error deleting file: ${error.message || 'Unknown error'}`)
  }
}
</script>

<style scoped>
.files-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.title-section {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.agent-name {
  color: #7f8c8d;
  font-size: 1.2rem;
}

.upload-btn {
  background-color: #2c3e50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.upload-btn:hover {
  background-color: #1a2530;
}

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-state p {
  margin-bottom: 20px;
  color: #7f8c8d;
}

.upload-zone {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-zone:hover {
  border-color: #3498db;
  background-color: rgba(52, 152, 219, 0.05);
}

.upload-icon {
  font-size: 3rem;
  color: #7f8c8d;
  margin-bottom: 10px;
}

.files-table-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: auto;
}

.files-table {
  width: 100%;
  border-collapse: collapse;
}

.files-table th,
.files-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.files-table th {
  background-color: #f8f9fa;
  color: #2c3e50;
  font-weight: 600;
}

.files-table tr:hover {
  background-color: #f8f9fa;
}

.file-name {
  font-weight: 500;
  color: #2c3e50;
}

.file-info h3 {
  margin: 0 0 5px 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.file-meta {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 0;
}

.file-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.action-btn {
  background-color: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.download-btn {
  color: #3498db;
}

.download-btn:hover {
  background-color: rgba(52, 152, 219, 0.1);
}

.delete-btn {
  color: #e74c3c;
  font-weight: bold;
}

.delete-btn:hover {
  background-color: rgba(231, 76, 60, 0.1);
}

.delete-x {
  font-weight: bold;
  font-size: 1rem;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal {
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal h2 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #2c3e50;
}

.dropzone {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  margin: 20px 0;
  transition: all 0.3s;
  cursor: pointer;
}

.dropzone.active {
  border-color: #3498db;
  background-color: rgba(52, 152, 219, 0.05);
}

.dropzone i {
  font-size: 3rem;
  color: #7f8c8d;
  margin-bottom: 10px;
}

.file-input {
  display: none;
}

.selected-files {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.selected-file {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.remove-file {
  background-color: transparent;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  font-size: 1rem;
}

.upload-progress {
  margin: 20px 0;
}

.progress-bar {
  height: 10px;
  background-color: #ecf0f1;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 5px;
}

.progress {
  height: 100%;
  background-color: #3498db;
  transition: width 0.3s;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn {
  background-color: #95a5a6;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.warning {
  color: #e74c3c;
  font-weight: 500;
}
</style>
