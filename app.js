// To Do List Manager - JavaScript Application
class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.currentCategory = 'all';
        this.currentSort = 'dateAdded';
        this.editingTaskId = null;
        this.searchQuery = '';
        
        this.init();
    }

    init() {
        this.loadTasks();
        this.bindEvents();
        this.updateDisplay();
        this.initTheme();
        
        // Set minimum date for due date inputs to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('taskDueDate').min = today;
        document.getElementById('editTaskDueDate').min = today;
    }

    // Local Storage Methods
    saveTasks() {
        try {
            localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
            this.showNotification('Error saving tasks', 'error');
        }
    }

    loadTasks() {
        try {
            const saved = localStorage.getItem('todoTasks');
            if (saved) {
                this.tasks = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.tasks = [];
        }
    }

    // Theme Methods
    initTheme() {
        const savedTheme = localStorage.getItem('todoTheme') || 'light';
        this.setTheme(savedTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-color-scheme', theme);
        localStorage.setItem('todoTheme', theme);
        
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        this.showNotification(`Switched to ${newTheme} theme`, 'success');
    }

    // Task Methods
    generateId() {
        return 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    addTask(taskData) {
        if (!taskData.title || taskData.title.trim() === '') {
            this.showNotification('Task title is required!', 'error');
            return;
        }

        const task = {
            id: this.generateId(),
            title: taskData.title.trim(),
            description: taskData.description ? taskData.description.trim() : '',
            dueDate: taskData.dueDate || null,
            priority: taskData.priority || 'medium',
            category: taskData.category || 'other',
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.updateDisplay();
        this.showNotification('Task added successfully!', 'success');
    }

    editTask(id, taskData) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = {
                ...this.tasks[taskIndex],
                title: taskData.title.trim(),
                description: taskData.description ? taskData.description.trim() : '',
                dueDate: taskData.dueDate || null,
                priority: taskData.priority || 'medium',
                category: taskData.category || 'other',
                updatedAt: new Date().toISOString()
            };
            this.saveTasks();
            this.updateDisplay();
            this.showNotification('Task updated successfully!', 'success');
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.updateDisplay();
        this.showNotification('Task deleted successfully!', 'success');
    }

    toggleTaskComplete(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.updateDisplay();
            
            const status = task.completed ? 'completed' : 'active';
            this.showNotification(`Task marked as ${status}!`, 'success');
        }
    }

    clearCompletedTasks() {
        const completedCount = this.tasks.filter(task => task.completed).length;
        if (completedCount === 0) {
            this.showNotification('No completed tasks to clear.', 'info');
            return;
        }

        if (confirm(`Are you sure you want to delete ${completedCount} completed task${completedCount > 1 ? 's' : ''}?`)) {
            this.tasks = this.tasks.filter(task => !task.completed);
            this.saveTasks();
            this.updateDisplay();
            this.showNotification(`${completedCount} completed task${completedCount > 1 ? 's' : ''} cleared!`, 'success');
        }
    }

    // Filter and Sort Methods
    getFilteredTasks() {
        let filtered = [...this.tasks];

        // Apply status filter
        if (this.currentFilter === 'active') {
            filtered = filtered.filter(task => !task.completed);
        } else if (this.currentFilter === 'completed') {
            filtered = filtered.filter(task => task.completed);
        }

        // Apply category filter
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(task => task.category === this.currentCategory);
        }

        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(task =>
                task.title.toLowerCase().includes(query) ||
                task.description.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.currentSort) {
                case 'dueDate':
                    if (!a.dueDate && !b.dueDate) return new Date(b.createdAt) - new Date(a.createdAt);
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                case 'alphabetical':
                    return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
                default: // dateAdded
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

        return filtered;
    }

    // Display Methods
    updateDisplay() {
        this.updateStats();
        this.updateTaskList();
        this.updateTaskCount();
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        const overdueTasks = this.tasks.filter(task => this.isOverdue(task)).length;

        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('pendingTasks').textContent = pendingTasks;
        document.getElementById('overdueTasks').textContent = overdueTasks;

        // Update progress bar
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('progressText').textContent = `${progress}%`;
    }

    updateTaskList() {
        const container = document.getElementById('tasksContainer');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            emptyState.style.display = 'block';
            // Clear container but keep empty state
            const otherElements = container.querySelectorAll(':not(#emptyState)');
            otherElements.forEach(el => el.remove());
            return;
        }

        emptyState.style.display = 'none';
        
        // Create tasks HTML
        const tasksHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
        
        // Replace content but preserve empty state element
        const newContainer = document.createElement('div');
        newContainer.innerHTML = tasksHTML;
        
        // Clear container and add new tasks
        const otherElements = container.querySelectorAll(':not(#emptyState)');
        otherElements.forEach(el => el.remove());
        
        while (newContainer.firstChild) {
            container.insertBefore(newContainer.firstChild, emptyState);
        }
    }

    updateTaskCount() {
        const filteredTasks = this.getFilteredTasks();
        const count = filteredTasks.length;
        document.getElementById('taskCount').textContent = `${count} task${count !== 1 ? 's' : ''}`;
    }

    createTaskHTML(task) {
        const dueDateStatus = this.getDueDateStatus(task);
        const dueDateText = task.dueDate ? this.formatDate(task.dueDate) : '';

        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-header">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <div class="task-content">
                        <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                        ${task.description ? `<p class="task-description">${this.escapeHtml(task.description)}</p>` : ''}
                        <div class="task-meta">
                            ${dueDateText ? `<span class="task-due-date ${dueDateStatus}">📅 ${dueDateText}</span>` : ''}
                            <span class="task-priority ${task.priority}">⚡ ${task.priority}</span>
                            <span class="task-category">📁 ${task.category}</span>
                        </div>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn edit-btn" data-action="edit">Edit</button>
                    <button class="btn delete-btn" data-action="delete">Delete</button>
                </div>
            </div>
        `;
    }

    getDueDateStatus(task) {
        if (!task.dueDate || task.completed) return 'normal';
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(task.dueDate);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'overdue';
        if (diffDays <= 2) return 'due-soon';
        return 'normal';
    }

    isOverdue(task) {
        if (!task.dueDate || task.completed) return false;
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return new Date(task.dueDate) < today;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // Modal Methods
    showEditModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskDescription').value = task.description;
        document.getElementById('editTaskDueDate').value = task.dueDate || '';
        document.getElementById('editTaskPriority').value = task.priority;
        document.getElementById('editTaskCategory').value = task.category;

        this.editingTaskId = taskId;
        this.showModal('editModal');
    }

    showDeleteModal(taskId) {
        this.editingTaskId = taskId;
        this.showModal('deleteModal');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Focus on first input in modal
        const firstInput = modal.querySelector('input, textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
        document.body.style.overflow = '';
        this.editingTaskId = null;
    }

    // Export Methods
    exportTasks() {
        if (this.tasks.length === 0) {
            this.showNotification('No tasks to export.', 'info');
            return;
        }

        try {
            const csvContent = this.generateCSV();
            this.downloadFile(csvContent, 'todo-tasks.csv', 'text/csv');
            this.showNotification('Tasks exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Error exporting tasks.', 'error');
        }
    }

    generateCSV() {
        const headers = ['Title', 'Description', 'Due Date', 'Priority', 'Category', 'Status', 'Created', 'Updated'];
        const rows = this.tasks.map(task => [
            task.title,
            task.description,
            task.dueDate || '',
            task.priority,
            task.category,
            task.completed ? 'Completed' : 'Pending',
            new Date(task.createdAt).toLocaleString(),
            new Date(task.updatedAt).toLocaleString()
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(','))
            .join('\n');

        return csvContent;
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Notification Method
    showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-base);
            padding: var(--space-16);
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            max-width: 300px;
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            animation: slideInRight 0.3s ease-out;
        `;

        if (type === 'success') {
            notification.style.borderColor = 'var(--color-success)';
            notification.style.color = 'var(--color-success)';
        } else if (type === 'error') {
            notification.style.borderColor = 'var(--color-error)';
            notification.style.color = 'var(--color-error)';
        } else if (type === 'info') {
            notification.style.borderColor = 'var(--color-info)';
            notification.style.color = 'var(--color-info)';
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);

        // Add CSS for animations if not already added
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Event Binding
    bindEvents() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
        }

        // Task form submission
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTaskSubmit();
            });
        }

        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.trim();
                this.updateDisplay();
            });
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.updateDisplay();
            });
        });

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                this.updateDisplay();
            });
        }

        // Sort select
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.updateDisplay();
            });
        }

        // Clear completed tasks
        const clearCompletedBtn = document.getElementById('clearCompletedBtn');
        if (clearCompletedBtn) {
            clearCompletedBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearCompletedTasks();
            });
        }

        // Export tasks
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportTasks();
            });
        }

        // Task list interactions (event delegation)
        const tasksContainer = document.getElementById('tasksContainer');
        if (tasksContainer) {
            tasksContainer.addEventListener('click', (e) => {
                const taskItem = e.target.closest('.task-item');
                if (!taskItem) return;

                const taskId = taskItem.dataset.taskId;

                if (e.target.classList.contains('task-checkbox')) {
                    this.toggleTaskComplete(taskId);
                } else if (e.target.dataset.action === 'edit') {
                    e.preventDefault();
                    this.showEditModal(taskId);
                } else if (e.target.dataset.action === 'delete') {
                    e.preventDefault();
                    this.showDeleteModal(taskId);
                }
            });
        }

        // Edit modal events
        const saveEditTask = document.getElementById('saveEditTask');
        if (saveEditTask) {
            saveEditTask.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleEditSubmit();
            });
        }

        const cancelEditModal = document.getElementById('cancelEditModal');
        if (cancelEditModal) {
            cancelEditModal.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('editModal');
            });
        }

        const closeEditModal = document.getElementById('closeEditModal');
        if (closeEditModal) {
            closeEditModal.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('editModal');
            });
        }

        // Delete modal events
        const confirmDelete = document.getElementById('confirmDelete');
        if (confirmDelete) {
            confirmDelete.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.editingTaskId) {
                    this.deleteTask(this.editingTaskId);
                    this.hideModal('deleteModal');
                }
            });
        }

        const cancelDelete = document.getElementById('cancelDelete');
        if (cancelDelete) {
            cancelDelete.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('deleteModal');
            });
        }

        const closeDeleteModal = document.getElementById('closeDeleteModal');
        if (closeDeleteModal) {
            closeDeleteModal.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('deleteModal');
            });
        }

        // Modal backdrop clicks
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    const modal = backdrop.closest('.modal');
                    if (modal) {
                        this.hideModal(modal.id);
                    }
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close any open modal
                document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                    this.hideModal(modal.id);
                });
            }
        });

        // Form validation on input
        const taskTitle = document.getElementById('taskTitle');
        if (taskTitle) {
            taskTitle.addEventListener('input', (e) => {
                const value = e.target.value.trim();
                if (value.length === 0) {
                    e.target.setCustomValidity('Task title is required');
                } else {
                    e.target.setCustomValidity('');
                }
            });
        }
    }

    handleTaskSubmit() {
        const titleInput = document.getElementById('taskTitle');
        const title = titleInput.value.trim();
        
        if (!title) {
            this.showNotification('Please enter a task title.', 'error');
            titleInput.focus();
            return;
        }

        const taskData = {
            title,
            description: document.getElementById('taskDescription').value.trim(),
            dueDate: document.getElementById('taskDueDate').value,
            priority: document.getElementById('taskPriority').value,
            category: document.getElementById('taskCategory').value
        };

        this.addTask(taskData);
        
        // Reset form
        document.getElementById('taskForm').reset();
        titleInput.focus();
    }

    handleEditSubmit() {
        const titleInput = document.getElementById('editTaskTitle');
        const title = titleInput.value.trim();
        
        if (!title) {
            this.showNotification('Please enter a task title.', 'error');
            titleInput.focus();
            return;
        }

        const taskData = {
            title,
            description: document.getElementById('editTaskDescription').value.trim(),
            dueDate: document.getElementById('editTaskDueDate').value,
            priority: document.getElementById('editTaskPriority').value,
            category: document.getElementById('editTaskCategory').value
        };

        this.editTask(this.editingTaskId, taskData);
        this.hideModal('editModal');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.todoApp = new TodoApp();
        console.log('To Do List Manager initialized successfully');
    } catch (error) {
        console.error('Error initializing To Do List Manager:', error);
    }
});