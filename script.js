document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const board = document.querySelector('.board');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskModal = document.getElementById('task-modal');
    const closeModal = document.querySelector('.close');
    const cancelBtn = document.querySelector('.cancel-btn');
    const taskForm = document.getElementById('task-form');
    const deleteBtn = document.getElementById('delete-btn');
    
    // Form fields
    const taskIdInput = document.getElementById('task-id');
    const taskTitleInput = document.getElementById('task-title');
    const taskDescriptionInput = document.getElementById('task-description');
    const taskDueDateInput = document.getElementById('task-due-date');
    const taskPriorityInput = document.getElementById('task-priority');
    const taskStatusInput = document.getElementById('task-status');
    const modalTitle = document.getElementById('modal-title');
    
    // State
    let tasks = [];
    let currentTaskId = null;
    let isEditMode = false;
    
    // Initialize the app
    init();
    
    function init() {
        loadTasks();
        renderTasks();
        setupEventListeners();
    }
    
    function loadTasks() {
        const savedTasks = localStorage.getItem('kanban-tasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        }
    }
    
    function saveTasks() {
        localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
    }
    
    function renderTasks() {
        // Clear all task columns
        document.querySelectorAll('.tasks').forEach(column => {
            column.innerHTML = '';
        });
        
        // Render tasks in their respective columns
        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            const column = document.querySelector(`.tasks[data-status="${task.status}"]`);
            column.appendChild(taskElement);
        });
    }
    
    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task';
        taskElement.draggable = true;
        taskElement.dataset.taskId = task.id;
        
        // Format due date
        let dueDateDisplay = 'No due date';
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            dueDateDisplay = dueDate.toLocaleDateString();
        }
        
        taskElement.innerHTML = `
            <div class="task-actions">
                <button class="edit-task"><i class="fas fa-edit"></i></button>
                <button class="delete-task"><i class="fas fa-trash"></i></button>
            </div>
            <h3>${task.title}</h3>
            <p>${task.description || 'No description'}</p>
            <div class="task-meta">
                <span class="priority ${task.priority}">${task.priority}</span>
                <span>${dueDateDisplay}</span>
            </div>
        `;
        
        // Add drag event listeners
        setupDragEvents(taskElement);
        
        // Add click event listeners for edit and delete buttons
        taskElement.querySelector('.edit-task').addEventListener('click', () => openEditModal(task.id));
        taskElement.querySelector('.delete-task').addEventListener('click', () => deleteTask(task.id));
        
        return taskElement;
    }
    
    function setupDragEvents(taskElement) {
        taskElement.addEventListener('dragstart', dragStart);
        taskElement.addEventListener('dragend', dragEnd);
    }
    
    function dragStart(e) {
        e.dataTransfer.setData('text/plain', this.dataset.taskId);
        this.classList.add('dragging');
        
        // Set a small delay to allow the drag to start before hiding the element
        setTimeout(() => {
            this.style.display = 'none';
        }, 0);
    }
    
    function dragEnd(e) {
        this.classList.remove('dragging');
        this.style.display = 'block';
    }
    
    function setupColumnEvents() {
        const columns = document.querySelectorAll('.tasks');
        
        columns.forEach(column => {
            column.addEventListener('dragover', dragOver);
            column.addEventListener('dragenter', dragEnter);
            column.addEventListener('dragleave', dragLeave);
            column.addEventListener('drop', drop);
        });
    }
    
    function dragOver(e) {
        e.preventDefault();
    }
    
    function dragEnter(e) {
        e.preventDefault();
        this.classList.add('highlight');
    }
    
    function dragLeave() {
        this.classList.remove('highlight');
    }
    
    function drop(e) {
        e.preventDefault();
        this.classList.remove('highlight');
        
        const taskId = e.dataTransfer.getData('text/plain');
        const newStatus = this.dataset.status;
        
        // Find the task and update its status
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].status = newStatus;
            saveTasks();
            renderTasks();
        }
    }
    
    function setupEventListeners() {
        // Modal buttons
        addTaskBtn.addEventListener('click', openAddModal);
        closeModal.addEventListener('click', closeTaskModal);
        cancelBtn.addEventListener('click', closeTaskModal);
        
        // Form submission
        taskForm.addEventListener('submit', handleFormSubmit);
        
        // Delete button
        deleteBtn.addEventListener('click', handleDelete);
        
        // Setup drag and drop for columns
        setupColumnEvents();
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === taskModal) {
                closeTaskModal();
            }
        });
    }
    
    function openAddModal() {
        isEditMode = false;
        currentTaskId = null;
        modalTitle.textContent = 'Add New Task';
        taskForm.reset();
        deleteBtn.style.display = 'none';
        taskModal.style.display = 'block';
    }
    
    function openEditModal(taskId) {
        isEditMode = true;
        currentTaskId = taskId;
        modalTitle.textContent = 'Edit Task';
        deleteBtn.style.display = 'block';
        
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            taskIdInput.value = task.id;
            taskTitleInput.value = task.title;
            taskDescriptionInput.value = task.description || '';
            taskDueDateInput.value = task.dueDate || '';
            taskPriorityInput.value = task.priority;
            taskStatusInput.value = task.status;
        }
        
        taskModal.style.display = 'block';
    }
    
    function closeTaskModal() {
        taskModal.style.display = 'none';
    }
    
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const taskData = {
            id: isEditMode ? currentTaskId : generateId(),
            title: taskTitleInput.value.trim(),
            description: taskDescriptionInput.value.trim(),
            dueDate: taskDueDateInput.value,
            priority: taskPriorityInput.value,
            status: taskStatusInput.value,
            createdAt: isEditMode ? tasks.find(t => t.id === currentTaskId).createdAt : new Date().toISOString()
        };
        
        if (isEditMode) {
            // Update existing task
            const taskIndex = tasks.findIndex(t => t.id === currentTaskId);
            if (taskIndex !== -1) {
                tasks[taskIndex] = taskData;
            }
        } else {
            // Add new task
            tasks.push(taskData);
        }
        
        saveTasks();
        renderTasks();
        closeTaskModal();
    }
    
    function handleDelete() {
        if (confirm('Are you sure you want to delete this task?')) {
            deleteTask(currentTaskId);
            closeTaskModal();
        }
    }
    
    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
    }
    
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
});