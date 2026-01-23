document.addEventListener("DOMContentLoaded", () => {
  // Container for project cards
  const projectsContainer = document.getElementById("projects-container");
  const loadingIndicator = document.getElementById("loading-indicator");

  // Start with a blank slate
  if (projectsContainer) {
    // Show initial loading set immediately
    fetchInitialProjects();

    // Then load the rest in the background
    setTimeout(() => {
      fetchRemainingProjects();
    }, 100);
  }

  // Function to fetch and display the first few projects quickly
  function fetchInitialProjects() {
    // First, load from localStorage if available
    const localProjects = loadProjectsFromLocalStorage();

    if (localProjects.length > 0) {
      // If we have local projects, show them immediately
      if (loadingIndicator) loadingIndicator.remove();
      renderProjects(localProjects.slice(0, 4), projectsContainer, true);
    } else {
      // Otherwise fetch just the first few from remote
      fetchPartialRemoteProjects(0, 4)
        .then((initialProjects) => {
          if (loadingIndicator) loadingIndicator.remove();
          renderProjects(initialProjects, projectsContainer, true);
        })
        .catch((error) => {
          console.error("Error fetching initial projects:", error);
          if (loadingIndicator) {
            loadingIndicator.textContent = "Could not load projects.";
            loadingIndicator.style.color = "var(--accent-color)";
          }
        });
    }
  }

  // Function to fetch and display remaining projects
  function fetchRemainingProjects() {
    // Fetch all remote projects
    fetchRemoteProjects()
      .then((allProjects) => {
        // Get the currently displayed projects
        const existingCards = document.querySelectorAll("project-card");
        const displayedIds = Array.from(existingCards).map((card) =>
          card.getAttribute("id"),
        );

        // Filter out projects that are already displayed
        const remainingProjects = allProjects.filter(
          (project) => !displayedIds.includes(`project-${project.id}`),
        );

        // Render remaining projects
        if (remainingProjects.length > 0) {
          renderProjects(remainingProjects, projectsContainer, false);
        }
      })
      .catch((error) => {
        console.error("Error fetching remaining projects:", error);
      });
  }
});

function loadProjectsFromLocalStorage() {
  try {
    const projects =
      JSON.parse(localStorage.getItem("portfolio-projects")) || [];
    return projects;
  } catch (e) {
    console.error("Error loading projects from localStorage:", e);
    return [];
  }
}

function fetchPartialRemoteProjects(start, count) {
  return fetch("projects.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((allProjects) => {
      // Return just the slice of projects we want
      return allProjects.slice(start, start + count);
    })
    .catch((error) => {
      console.error("Error fetching partial projects:", error);
      return [];
    });
}

function fetchRemoteProjects() {
  // Fetch all projects from the JSON file
  return fetch("projects.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .catch((error) => {
      console.error("Error fetching projects.json:", error);
      // Fallback to empty array if fetch fails
      return [];
    });
}

function renderProjects(projects, container, isInitialLoad = true) {
  // If container doesn't exist, exit early
  if (!container) return;

  // If this is the initial load, clear any existing placeholder cards
  if (isInitialLoad) {
    const existingCards = container.querySelectorAll("project-card");
    existingCards.forEach((card) => card.remove());
  }

  // Add project cards with a slight delay between each for a staggered animation effect
  projects.forEach((project, index) => {
    setTimeout(
      () => {
        const card = document.createElement("project-card");

        // Add ID to track which projects are already rendered
        card.setAttribute("id", `project-${project.id}`);

        // Set all project details explicitly.
        // NEW: New fields (commit_count, contributors, project_status, license_type) are now passed as attributes
        Object.keys(project).forEach((key) => {
          if (project[key] !== undefined && project[key] !== null) {
            card.setAttribute(key, project[key]);
          }
        });

        // Force browser to recalculate styles
        void card.offsetWidth;

        // Append to container
        container.appendChild(card);
      },
      index * (isInitialLoad ? 50 : 100),
    ); // Faster animation for initial load
  });

  // If no projects and this is initial load, show a message
  if (projects.length === 0 && isInitialLoad) {
    const noProjectsMsg = document.createElement("p");
    noProjectsMsg.textContent = "No projects found.";
    noProjectsMsg.style.textAlign = "center";
    noProjectsMsg.style.padding = "2rem";
    container.appendChild(noProjectsMsg);
  }
}

// Example function to save a project to localStorage (for adding new projects)
function saveProjectToLocalStorage(project) {
  try {
    const projects = loadProjectsFromLocalStorage();

    // Check if project with this ID already exists
    const existingIndex = projects.findIndex((p) => p.id === project.id);

    if (existingIndex >= 0) {
      // Update existing project
      projects[existingIndex] = project;
    } else {
      // Add new project
      projects.push(project);
    }

    localStorage.setItem("portfolio-projects", JSON.stringify(projects));
    return true;
  } catch (e) {
    console.error("Error saving project to localStorage:", e);
    return false;
  }
}

// Add a debug function to the window object for testing
window.portfolioTools = {
  addSampleProject: () => {
    const sampleProject = {
      id: "sample-" + Date.now(),
      title: "Sample Local Project",
      description:
        "This is a sample project stored in localStorage. You can add more projects like this programmatically.",
      image: "assets/proj4-800.webp",
      alt: "Sample Project Image",
      github: "https://github.com/katulevskiy/sample-project",
      tags: "Sample, LocalStorage, Demo",
      commit_count: 42,
      contributors: 3,
      project_status: "Experimental",
      license_type: "MIT",
    };

    saveProjectToLocalStorage(sampleProject);

    // Reload the page to show the new project
    window.location.reload();
  },
  clearLocalStorage: () => {
    localStorage.removeItem("portfolio-projects");
    window.location.reload();
  },
};
