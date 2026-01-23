document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const JSONBIN_ID = '67d635c18561e97a50ecce8c';
    const JSONBIN_API_KEY = '$2a$10$3AYprUqONu/ELiJNPv0/0eXOMrKduHtSyU6kXCxTAN10pZKjzOw7y';
    const LOCALSTORAGE_KEY = 'portfolio-projects';

    // DOM Elements
    const useLocalBtn = document.getElementById('use-local');
    const useRemoteBtn = document.getElementById('use-remote');
    const createTab = document.getElementById('tab-create');
    const readTab = document.getElementById('tab-read');
    const updateTab = document.getElementById('tab-update');
    const deleteTab = document.getElementById('tab-delete');
    const createForm = document.getElementById('create-form');
    const readPanel = document.getElementById('read-panel');
    const updatePanel = document.getElementById('update-panel');
    const deletePanel = document.getElementById('delete-panel');
    const projectForm = document.getElementById('project-form');
    const updateForm = document.getElementById('update-form');
    const updateProjectSelect = document.getElementById('update-project-select');
    const deleteProjectSelect = document.getElementById('delete-project-select');
    const deletePreview = document.getElementById('delete-preview');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const searchProjects = document.getElementById('search-projects');
    const projectsList = document.getElementById('projects-list');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const closeNotification = document.getElementById('close-notification');

    // State
    let isUsingLocal = true;
    let currentProjects = [];
    let selectedProjectId = null;

    // Initialize
    init();

    function init() {
        // Set up event listeners
        useLocalBtn.addEventListener('click', () => switchDataSource(true));
        useRemoteBtn.addEventListener('click', () => switchDataSource(false));
        createTab.addEventListener('click', () => switchTab('create'));
        readTab.addEventListener('click', () => switchTab('read'));
        updateTab.addEventListener('click', () => switchTab('update'));
        deleteTab.addEventListener('click', () => switchTab('delete'));
        projectForm.addEventListener('submit', handleCreateProject);
        updateForm.addEventListener('submit', handleUpdateProject);
        updateProjectSelect.addEventListener('change', handleUpdateProjectChange);
        deleteProjectSelect.addEventListener('change', handleDeleteProjectChange);
        confirmDeleteBtn.addEventListener('click', handleDeleteProject);
        searchProjects.addEventListener('input', handleSearchProjects);
        closeNotification.addEventListener('click', hideNotification);
        document.getElementById('cancel-update').addEventListener('click', () => resetUpdateForm());
        document.getElementById('cancel-delete').addEventListener('click', () => resetDeleteForm());

        // Mark "Use Local" as active by default
        switchDataSource(true);

        // Show "Create" tab by default
        switchTab('create');

        // Load projects
        loadProjects();
    }

    // Data Source Switching
    function switchDataSource(local) {
        isUsingLocal = local;

        if (local) {
            useLocalBtn.classList.add('active');
            useRemoteBtn.classList.remove('active');
        } else {
            useLocalBtn.classList.remove('active');
            useRemoteBtn.classList.add('active');
        }

        // Reload projects with new data source
        loadProjects();
    }

    // Tab Switching
    function switchTab(tab) {
        // Hide all panels
        createForm.classList.remove('active');
        readPanel.classList.remove('active');
        updatePanel.classList.remove('active');
        deletePanel.classList.remove('active');

        // Remove active from all tabs
        createTab.classList.remove('active');
        readTab.classList.remove('active');
        updateTab.classList.remove('active');
        deleteTab.classList.remove('active');

        // Show selected panel and mark tab as active
        switch (tab) {
            case 'create':
                createForm.classList.add('active');
                createTab.classList.add('active');
                break;
            case 'read':
                readPanel.classList.add('active');
                readTab.classList.add('active');
                renderProjectsList(currentProjects);
                break;
            case 'update':
                updatePanel.classList.add('active');
                updateTab.classList.add('active');
                populateUpdateForm();
                break;
            case 'delete':
                deletePanel.classList.add('active');
                deleteTab.classList.add('active');
                populateDeleteForm();
                break;
        }
    }

    // CRUD Operations

    // Create
    function handleCreateProject(e) {
        e.preventDefault();

        const newProject = {
            id: document.getElementById('project-id').value,
            title: document.getElementById('project-title').value,
            description: document.getElementById('project-description').value,
            image: document.getElementById('project-image').value,
            alt: document.getElementById('project-alt').value,
            github: document.getElementById('project-github').value,
            tags: document.getElementById('project-tags').value,
            commit_count: document.getElementById('project-commit-count').value || 0,
            contributors: document.getElementById('project-contributors').value || 0,
            project_status: document.getElementById('project-status').value || '',
            license_type: document.getElementById('project-license').value || ''
        };

        // Validate ID format
        if (!/^[a-zA-Z0-9-_]+$/.test(newProject.id)) {
            showNotification('Project ID can only contain letters, numbers, hyphens, and underscores.', 'error');
            return;
        }

        // Check if project ID already exists
        const existingProject = currentProjects.find(p => p.id === newProject.id);
        if (existingProject) {
            showNotification('A project with this ID already exists. Please choose a different ID.', 'error');
            return;
        }

        // Add the new project
        const updatedProjects = [...currentProjects, newProject];

        // Save projects
        saveProjects(updatedProjects).then(() => {
            // Reset form
            projectForm.reset();
            showNotification('Project created successfully!', 'success');
        }).catch(error => {
            showNotification(`Error creating project: ${error.message}`, 'error');
        });
    }

    // Read
    function renderProjectsList(projects) {
        // Clear existing projects
        projectsList.innerHTML = '';

        if (projects.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'loading-placeholder';
            emptyMessage.textContent = 'No projects found.';
            projectsList.appendChild(emptyMessage);
            return;
        }

        // Render each project as a card
        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.dataset.id = project.id;

            card.innerHTML = `
        <div class="project-card-header">
          <h3 class="project-card-title">${project.title}</h3>
          <div class="project-card-actions">
            <button class="action-btn edit" title="Edit" data-id="${project.id}">✏️</button>
            <button class="action-btn delete" title="Delete" data-id="${project.id}">🗑️</button>
          </div>
        </div>
        <div class="project-card-body">
          <p class="project-card-desc">${project.description}</p>
          <div class="project-card-meta">
            <span class="meta-tag">ID: ${project.id}</span>
            ${project.project_status ? `<span class="meta-tag">Status: ${project.project_status}</span>` : ''}
            ${project.license_type ? `<span class="meta-tag">License: ${project.license_type}</span>` : ''}
          </div>
        </div>
      `;

            // Add event listeners to action buttons
            projectsList.appendChild(card);

            // Add event listeners to the newly added buttons
            card.querySelector('.edit').addEventListener('click', function() {
                const projectId = this.dataset.id;
                switchTab('update');
                updateProjectSelect.value = projectId;
                handleUpdateProjectChange();
            });

            card.querySelector('.delete').addEventListener('click', function() {
                const projectId = this.dataset.id;
                switchTab('delete');
                deleteProjectSelect.value = projectId;
                handleDeleteProjectChange();
            });
        });
    }

    function handleSearchProjects() {
        const searchTerm = searchProjects.value.toLowerCase();

        if (!searchTerm) {
            renderProjectsList(currentProjects);
            return;
        }

        const filteredProjects = currentProjects.filter(project => {
            return project.title.toLowerCase().includes(searchTerm) ||
                project.description.toLowerCase().includes(searchTerm) ||
                project.tags.toLowerCase().includes(searchTerm) ||
                project.id.toLowerCase().includes(searchTerm);
        });

        renderProjectsList(filteredProjects);
    }

    // Update
    function populateUpdateForm() {
        // Clear the select element
        updateProjectSelect.innerHTML = '<option value="">-- Select a Project --</option>';

        // Add options for each project
        currentProjects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = `${project.title} (ID: ${project.id})`;
            updateProjectSelect.appendChild(option);
        });

        // Disable the form initially
        const formFields = updateForm.querySelectorAll('input, textarea, select');
        formFields.forEach(field => field.disabled = true);

        // Reset selected project
        selectedProjectId = null;
    }

    function handleUpdateProjectChange() {
        selectedProjectId = updateProjectSelect.value;

        const formFields = updateForm.querySelectorAll('input, textarea, select');

        if (!selectedProjectId) {
            // If no project selected, disable and clear form
            formFields.forEach(field => {
                field.disabled = true;
                field.value = '';
            });
            return;
        }

        // Enable form fields
        formFields.forEach(field => field.disabled = false);

        // Find the selected project
        const project = currentProjects.find(p => p.id === selectedProjectId);

        if (project) {
            // Populate form with project data
            document.getElementById('update-title').value = project.title || '';
            document.getElementById('update-description').value = project.description || '';
            document.getElementById('update-image').value = project.image || '';
            document.getElementById('update-alt').value = project.alt || '';
            document.getElementById('update-github').value = project.github || '';
            document.getElementById('update-tags').value = project.tags || '';
            document.getElementById('update-commit-count').value = project.commit_count || '';
            document.getElementById('update-contributors').value = project.contributors || '';
            document.getElementById('update-status').value = project.project_status || '';
            document.getElementById('update-license').value = project.license_type || '';
        }
    }

    function handleUpdateProject(e) {
        e.preventDefault();

        if (!selectedProjectId) {
            showNotification('Please select a project to update.', 'error');
            return;
        }

        // Create updated project object
        const updatedProject = {
            id: selectedProjectId, // ID cannot be changed
            title: document.getElementById('update-title').value,
            description: document.getElementById('update-description').value,
            image: document.getElementById('update-image').value,
            alt: document.getElementById('update-alt').value,
            github: document.getElementById('update-github').value,
            tags: document.getElementById('update-tags').value,
            commit_count: document.getElementById('update-commit-count').value || 0,
            contributors: document.getElementById('update-contributors').value || 0,
            project_status: document.getElementById('update-status').value || '',
            license_type: document.getElementById('update-license').value || ''
        };

        // Update the project in the array
        const updatedProjects = currentProjects.map(project => {
            if (project.id === selectedProjectId) {
                return updatedProject;
            }
            return project;
        });

        // Save projects
        saveProjects(updatedProjects).then(() => {
            showNotification('Project updated successfully!', 'success');
            resetUpdateForm();
        }).catch(error => {
            showNotification(`Error updating project: ${error.message}`, 'error');
        });
    }

    function resetUpdateForm() {
        updateProjectSelect.value = '';
        const formFields = updateForm.querySelectorAll('input, textarea, select');
        formFields.forEach(field => {
            field.disabled = true;
            field.value = '';
        });
        selectedProjectId = null;
    }

    // Delete
    function populateDeleteForm() {
        // Clear the select element
        deleteProjectSelect.innerHTML = '<option value="">-- Select a Project --</option>';

        // Add options for each project
        currentProjects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = `${project.title} (ID: ${project.id})`;
            deleteProjectSelect.appendChild(option);
        });

        // Reset the preview and disable delete button
        deletePreview.innerHTML = '';
        deletePreview.classList.add('empty');
        confirmDeleteBtn.disabled = true;

        // Reset selected project
        selectedProjectId = null;
    }

    function handleDeleteProjectChange() {
        selectedProjectId = deleteProjectSelect.value;

        if (!selectedProjectId) {
            // If no project selected, clear preview and disable delete button
            deletePreview.innerHTML = '';
            deletePreview.classList.add('empty');
            confirmDeleteBtn.disabled = true;
            return;
        }

        // Find the selected project
        const project = currentProjects.find(p => p.id === selectedProjectId);

        if (project) {
            // Show preview
            deletePreview.innerHTML = `
        <h3 class="preview-title">${project.title}</h3>
        <p class="preview-description">${project.description.substring(0, 150)}${project.description.length > 150 ? '...' : ''}</p>
        <div class="preview-meta">
          <p>ID: ${project.id}</p>
          <p>Tags: ${project.tags}</p>
          ${project.project_status ? `<p>Status: ${project.project_status}</p>` : ''}
          ${project.license_type ? `<p>License: ${project.license_type}</p>` : ''}
        </div>
      `;
            deletePreview.classList.remove('empty');
            confirmDeleteBtn.disabled = false;
        }
    }

    function handleDeleteProject() {
        if (!selectedProjectId) {
            showNotification('Please select a project to delete.', 'error');
            return;
        }

        // Filter out the selected project
        const updatedProjects = currentProjects.filter(project => project.id !== selectedProjectId);

        // Save projects
        saveProjects(updatedProjects).then(() => {
            showNotification('Project deleted successfully!', 'success');
            resetDeleteForm();
        }).catch(error => {
            showNotification(`Error deleting project: ${error.message}`, 'error');
        });
    }

    function resetDeleteForm() {
        deleteProjectSelect.value = '';
        deletePreview.innerHTML = '';
        deletePreview.classList.add('empty');
        confirmDeleteBtn.disabled = true;
        selectedProjectId = null;
    }

    // Data Management

    function loadProjects() {
        if (isUsingLocal) {
            // Load from localStorage
            try {
                const storedProjects = localStorage.getItem(LOCALSTORAGE_KEY);
                if (storedProjects) {
                    currentProjects = JSON.parse(storedProjects);
                    updateProjectsUI();
                } else {
                    currentProjects = [];
                    updateProjectsUI();
                    showNotification('No projects found in local storage. You can create a new project or switch to remote storage.', 'info');
                }
            } catch (error) {
                currentProjects = [];
                updateProjectsUI();
                showNotification(`Error loading projects from local storage: ${error.message}`, 'error');
            }
        } else {
            // Load from JSONBin
            const loadingPlaceholder = document.createElement('div');
            loadingPlaceholder.className = 'loading-placeholder';
            loadingPlaceholder.textContent = 'Loading projects from remote server...';
            projectsList.innerHTML = '';
            projectsList.appendChild(loadingPlaceholder);

            fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
                headers: {
                    'X-Access-Key': JSONBIN_API_KEY
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch projects from remote server');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data && data.record) {
                        currentProjects = Array.isArray(data.record) ? data.record : [];
                        updateProjectsUI();
                        showNotification('Projects loaded from remote server successfully!', 'success');
                    } else {
                        currentProjects = [];
                        updateProjectsUI();
                        showNotification('No projects found on remote server or invalid data format received.', 'info');
                    }
                })
                .catch(error => {
                    currentProjects = [];
                    updateProjectsUI();
                    showNotification(`Error loading projects from remote server: ${error.message}`, 'error');
                });
        }
    }

    function saveProjects(projects) {
        return new Promise((resolve, reject) => {
            if (isUsingLocal) {
                // Save to localStorage
                try {
                    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(projects));
                    currentProjects = projects;
                    updateProjectsUI();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            } else {
                // Save to JSONBin
                fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Access-Key': JSONBIN_API_KEY,
                        'X-Bin-Versioning': 'false'
                    },
                    body: JSON.stringify(projects)
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to save projects to remote server');
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data && data.record) {
                            currentProjects = Array.isArray(data.record) ? data.record : [];
                            updateProjectsUI();
                            resolve();
                        } else {
                            reject(new Error('Invalid data format received from server'));
                        }
                    })
                    .catch(error => {
                        reject(error);
                    });
            }
        });
    }

    // UI Helpers

    function updateProjectsUI() {
        // Update all UI elements that display projects
        if (readPanel.classList.contains('active')) {
            renderProjectsList(currentProjects);
        }

        // Update select elements for update and delete
        if (updatePanel.classList.contains('active')) {
            populateUpdateForm();
        }

        if (deletePanel.classList.contains('active')) {
            populateDeleteForm();
        }
    }

    function showNotification(message, type) {
        notificationMessage.textContent = message;
        notification.className = 'notification';
        notification.classList.add(type || 'info');
        notification.classList.remove('hidden');

        // Auto-hide after 5 seconds
        setTimeout(hideNotification, 5000);
    }

    function hideNotification() {
        notification.classList.add('hidden');
    }
});