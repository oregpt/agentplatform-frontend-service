<template>
  <div class="data-table-container">
    <!-- Table Header with Search and Actions -->
    <div class="table-header">
      <div class="search-container" v-if="searchable">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search..." 
          class="search-input"
          @input="handleSearch"
        />
        <button v-if="searchQuery" @click="clearSearch" class="clear-search-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
            <path fill="none" d="M0 0h24v24H0z"/>
            <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      
      <div class="table-actions">
        <slot name="actions"></slot>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner">
        <div class="bounce1"></div>
        <div class="bounce2"></div>
        <div class="bounce3"></div>
      </div>
      <p>Loading data...</p>
    </div>
    
    <!-- Empty State -->
    <div v-else-if="isEmpty" class="empty-state">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
          <path fill="none" d="M0 0h24v24H0z"/>
          <path d="M20 22H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1zm-1-2V4H5v16h14zM8 7h8v2H8V7zm0 4h8v2H8v-2zm0 4h5v2H8v-2z" fill="currentColor"/>
        </svg>
      </div>
      <h3>{{ emptyStateMessage }}</h3>
      <p v-if="emptyStateDescription">{{ emptyStateDescription }}</p>
      <slot name="empty-state-action"></slot>
    </div>
    
    <!-- Data Table -->
    <div v-else class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th 
              v-for="column in columns" 
              :key="column.key"
              :class="{ 
                'sortable': column.sortable, 
                'sorted': sortKey === column.key,
                'asc': sortDirection === 'asc' && sortKey === column.key,
                'desc': sortDirection === 'desc' && sortKey === column.key
              }"
              @click="column.sortable ? sort(column.key) : null"
            >
              {{ column.label }}
              <span v-if="column.sortable" class="sort-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="none" d="M0 0h24v24H0z"/>
                  <path d="M12 8l6 6H6z" fill="currentColor"/>
                </svg>
              </span>
            </th>
            <th v-if="hasRowActions" class="actions-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in displayedData" :key="getItemKey(item, index)">
            <td v-for="column in columns" :key="column.key">
              <slot :name="`cell-${column.key}`" :item="item" :value="getItemValue(item, column.key)">
                {{ getItemValue(item, column.key) }}
              </slot>
            </td>
            <td v-if="hasRowActions" class="row-actions">
              <slot name="row-actions" :item="item" :index="index"></slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Pagination -->
    <div v-if="paginated && !isEmpty" class="pagination">
      <div class="pagination-info">
        Showing {{ paginationStart }} to {{ paginationEnd }} of {{ totalItems }}
      </div>
      <div class="pagination-controls">
        <button 
          class="pagination-btn" 
          :disabled="currentPage === 1" 
          @click="changePage(currentPage - 1)"
        >
          Previous
        </button>
        
        <div class="page-numbers">
          <button 
            v-for="page in displayedPages" 
            :key="page" 
            class="page-number" 
            :class="{ active: currentPage === page }"
            @click="changePage(page)"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          class="pagination-btn" 
          :disabled="currentPage === totalPages" 
          @click="changePage(currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  columns: {
    type: Array,
    required: true
  },
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  itemKey: {
    type: String,
    default: 'id'
  },
  emptyStateMessage: {
    type: String,
    default: 'No data available'
  },
  emptyStateDescription: {
    type: String,
    default: ''
  },
  searchable: {
    type: Boolean,
    default: false
  },
  searchKeys: {
    type: Array,
    default: () => []
  },
  paginated: {
    type: Boolean,
    default: false
  },
  itemsPerPage: {
    type: Number,
    default: 10
  },
  initialSortKey: {
    type: String,
    default: ''
  },
  initialSortDirection: {
    type: String,
    default: 'asc',
    validator: (value) => ['asc', 'desc'].includes(value)
  }
});

const emit = defineEmits(['sort', 'page-change', 'search']);

// Reactive state
const searchQuery = ref('');
const sortKey = ref(props.initialSortKey);
const sortDirection = ref(props.initialSortDirection);
const currentPage = ref(1);

// Computed properties
const hasRowActions = computed(() => !!slots['row-actions']);
const filteredData = computed(() => {
  if (!searchQuery.value || !props.searchable) {
    return props.data;
  }
  
  const query = searchQuery.value.toLowerCase();
  const searchInKeys = props.searchKeys.length > 0 
    ? props.searchKeys 
    : props.columns.map(col => col.key);
  
  return props.data.filter(item => {
    return searchInKeys.some(key => {
      const value = getItemValue(item, key);
      return value && String(value).toLowerCase().includes(query);
    });
  });
});

const sortedData = computed(() => {
  if (!sortKey.value) {
    return filteredData.value;
  }
  
  return [...filteredData.value].sort((a, b) => {
    const valueA = getItemValue(a, sortKey.value);
    const valueB = getItemValue(b, sortKey.value);
    
    // Handle null or undefined values
    if (valueA === null || valueA === undefined) return sortDirection.value === 'asc' ? -1 : 1;
    if (valueB === null || valueB === undefined) return sortDirection.value === 'asc' ? 1 : -1;
    
    // Compare based on types
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortDirection.value === 'asc' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    } else {
      return sortDirection.value === 'asc' 
        ? valueA - valueB 
        : valueB - valueA;
    }
  });
});

const totalItems = computed(() => filteredData.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / props.itemsPerPage)));
const isEmpty = computed(() => totalItems.value === 0);

const displayedData = computed(() => {
  if (!props.paginated) {
    return sortedData.value;
  }
  
  const start = (currentPage.value - 1) * props.itemsPerPage;
  const end = start + props.itemsPerPage;
  return sortedData.value.slice(start, end);
});

const paginationStart = computed(() => {
  if (isEmpty.value) return 0;
  return (currentPage.value - 1) * props.itemsPerPage + 1;
});

const paginationEnd = computed(() => {
  if (isEmpty.value) return 0;
  return Math.min(currentPage.value * props.itemsPerPage, totalItems.value);
});

const displayedPages = computed(() => {
  const maxPagesToShow = 5;
  const pages = [];
  
  if (totalPages.value <= maxPagesToShow) {
    // Show all pages if there are fewer than maxPagesToShow
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);
    
    // Calculate start and end of page range
    let startPage = Math.max(2, currentPage.value - 1);
    let endPage = Math.min(totalPages.value - 1, currentPage.value + 1);
    
    // Adjust if we're near the beginning
    if (currentPage.value <= 3) {
      endPage = 4;
    }
    
    // Adjust if we're near the end
    if (currentPage.value >= totalPages.value - 2) {
      startPage = totalPages.value - 3;
    }
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pages.push('...');
    }
    
    // Add pages in range
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages.value - 1) {
      pages.push('...');
    }
    
    // Always show last page
    if (totalPages.value > 1) {
      pages.push(totalPages.value);
    }
  }
  
  return pages;
});

// Methods
function getItemValue(item, key) {
  // Handle nested keys with dot notation (e.g., 'user.name')
  if (key.includes('.')) {
    return key.split('.').reduce((obj, k) => obj && obj[k], item);
  }
  return item[key];
}

function getItemKey(item, index) {
  return props.itemKey ? item[props.itemKey] : index;
}

function sort(key) {
  if (sortKey.value === key) {
    // Toggle sort direction if clicking the same column
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    // Set new sort key and default to ascending
    sortKey.value = key;
    sortDirection.value = 'asc';
  }
  
  emit('sort', { key: sortKey.value, direction: sortDirection.value });
}

function changePage(page) {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    currentPage.value = page;
    emit('page-change', currentPage.value);
  }
}

function handleSearch() {
  emit('search', searchQuery.value);
  // Reset to first page when searching
  if (props.paginated) {
    currentPage.value = 1;
  }
}

function clearSearch() {
  searchQuery.value = '';
  handleSearch();
}

// Reset pagination when data changes
watch(() => props.data.length, () => {
  if (currentPage.value > 1 && currentPage.value > totalPages.value) {
    currentPage.value = Math.max(1, totalPages.value);
  }
});

// Get slots for conditional rendering
const slots = defineSlots();
</script>

<style scoped>
.data-table-container {
  width: 100%;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.search-container {
  position: relative;
  width: 300px;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  padding-right: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th, .data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background-color: #f8f9fa;
  font-weight: 500;
  color: #2c3e50;
  white-space: nowrap;
}

.data-table tbody tr:hover {
  background-color: #f8f9fa;
}

.sortable {
  cursor: pointer;
  position: relative;
}

.sort-icon {
  display: inline-block;
  vertical-align: middle;
  margin-left: 4px;
  opacity: 0.3;
}

.sorted .sort-icon {
  opacity: 1;
}

.asc .sort-icon svg {
  transform: rotate(0deg);
}

.desc .sort-icon svg {
  transform: rotate(180deg);
}

.actions-column {
  width: 120px;
  text-align: right;
}

.row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #7f8c8d;
}

.empty-icon {
  margin-bottom: 16px;
  color: #bdc3c7;
}

.empty-state h3 {
  margin: 0 0 8px;
  color: #2c3e50;
}

.empty-state p {
  margin: 0 0 16px;
}

.spinner {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.spinner > div {
  width: 12px;
  height: 12px;
  margin: 0 5px;
  background-color: #3498db;
  border-radius: 100%;
  display: inline-block;
  animation: bounce 1.4s infinite ease-in-out both;
}

.spinner .bounce1 {
  animation-delay: -0.32s;
}

.spinner .bounce2 {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% { 
    transform: scale(0);
  } 40% { 
    transform: scale(1.0);
  }
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-top: 1px solid #eee;
}

.pagination-info {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #2c3e50;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-btn:not(:disabled):hover {
  background-color: #f8f9fa;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #2c3e50;
}

.page-number.active {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}

.page-number:not(.active):hover {
  background-color: #f8f9fa;
}
</style>
