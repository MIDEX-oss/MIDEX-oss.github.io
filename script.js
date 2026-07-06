const appContent = document.getElementById('appContent');
const navLinks = document.querySelectorAll('.nav-link');

// ==========================================
// 1. THE MULTI-PAGE ENGINE
// ==========================================
function loadPage(pageName) {
    fetch(`${pageName}.html`)
        .then(response => response.text())
        .then(htmlContent => {
            // Inject the HTML file into our main screen frame
            appContent.innerHTML = htmlContent;

            // 1. Check if Dashboard page loaded
            if (pageName === 'dashboard') {
                initializeDashboard();
            }

            // 2. Check if Contact page loaded
            if (pageName === 'contact') {
                const contactForm = document.getElementById('contactForm');
                const feedback = document.getElementById('formFeedback');

                contactForm.addEventListener('submit', (event) => {
                    event.preventDefault(); // Stop page from refreshing

                    // Gather form values
                    const formData = {
                        name: document.getElementById('contactName').value,
                        email: document.getElementById('contactEmail').value,
                        message: document.getElementById('contactMessage').value
                    };

                    feedback.textContent = "Sending...";
                    feedback.style.color = "#38bdf8";

                    // Shoot data to your PHP backend file
                    fetch('submit_contact.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    })
                    .then(res => res.json())
                    .then(result => {
                        if (result.status === 'success') {
                            feedback.textContent = "✓ Message safely logged in the database!";
                            feedback.style.color = "#4ade80";
                            contactForm.reset(); // Clear input boxes
                        } else {
                            feedback.textContent = "❌ " + result.message;
                            feedback.style.color = "#ef4444";
                        }
                    })
                    .catch(() => {
                        feedback.textContent = "❌ Server error. Make sure Apache/PHP is running.";
                        feedback.style.color = "#ef4444";
                    });
                });
            }
        })
        .catch(error => {
            appContent.innerHTML = "<h2>Error loading page.</h2>";
        });
}

// Listen for clicks on the navigation menu
navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault(); // Stop page from refreshing
        const targetPage = link.getAttribute('data-page');
        loadPage(targetPage);
    });
});

// Load 'home' by default when the user first visits the site
loadPage('home');


// ==========================================
// 2. THE PROJECT TRACKER ENGINE (Connected to DB)
// ==========================================
function initializeDashboard() {
    const projectInput = document.getElementById('projectInput');
    const addButton = document.getElementById('addProjectButton');
    const projectList = document.getElementById('projectList');

    // 1. Function to fetch and render projects with action buttons
    function loadProjects() {
        projectList.innerHTML = ""; 
        
        fetch('manage_projects.php')
            .then(res => res.json())
            .then(projects => {
                projects.forEach(project => {
                    const li = document.createElement('li');
                    li.style.padding = "10px";
                    li.style.borderBottom = "1px solid #334155";
                    li.style.display = "flex";
                    li.style.justifyContent = "between";
                    li.style.alignItems = "center";

                    // Text wrapper
                    const textSpan = document.createElement('span');
                    textSpan.textContent = `${project.title} — [${project.status}]`;
                    if (project.status === 'Completed') {
                        textSpan.style.textDecoration = "line-through";
                        textSpan.style.color = "#94a3b8";
                    }
                    li.appendChild(textSpan);

                    // Button container
                    const btnContainer = document.createElement('div');
                    btnContainer.style.marginLeft = "auto";

                    // Complete Button (Only show if still In Progress)
                    if (project.status !== 'Completed') {
                        const completeBtn = document.createElement('button');
                        completeBtn.textContent = "✔️";
                        completeBtn.style.marginRight = "8px";
                        completeBtn.addEventListener('click', () => {
                            fetch('manage_projects.php', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: project.id })
                            })
                            .then(res => res.json())
                            .then(() => loadProjects()); // Refresh
                        });
                        btnContainer.appendChild(completeBtn);
                    }

                    // Delete Button
                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = "❌";
                    deleteBtn.addEventListener('click', () => {
                        if (confirm("Delete this project permanently?")) {
                            fetch('manage_projects.php', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: project.id })
                            })
                            .then(res => res.json())
                            .then(() => loadProjects()); // Refresh
                        }
                    });
                    btnContainer.appendChild(deleteBtn);

                    li.appendChild(btnContainer);
                    projectList.appendChild(li);
                });
            })
            .catch(err => console.error("Error loading projects:", err));
    }

    loadProjects();

    // 2. Add Project click listener
    addButton.addEventListener('click', () => {
        const titleText = projectInput.value.trim();
        if (titleText === "") {
            alert("Please enter a project name!");
            return;
        }

        fetch('manage_projects.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: titleText })
        })
        .then(res => res.json())
        .then(result => {
            if (result.status === 'success') {
                projectInput.value = ""; 
                loadProjects(); 
            }
        })
        .catch(err => console.error("Error saving project:", err));
    });
}
