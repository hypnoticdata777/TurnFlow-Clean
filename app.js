// ===================================================
// TurnFlow™ v2.0 - Clean Edition
// ===================================================

// Global state
let taskCount = 0;
let editingProjectId = null;

// ===================================================
// Tab Management
// ===================================================
function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.add('hidden');
  });

  // Remove active state from all buttons
  document.querySelectorAll('[id^="tab-"]').forEach(btn => {
    btn.classList.remove('bg-white', 'text-blue-600');
    btn.classList.add('text-white');
  });

  // Show selected tab
  document.getElementById(`content-${tabName}`).classList.remove('hidden');

  // Highlight active button
  const activeBtn = document.getElementById(`tab-${tabName}`);
  activeBtn.classList.add('bg-white', 'text-blue-600');
  activeBtn.classList.remove('text-white');

  // Load content
  if (tabName === 'projects') loadProjects();
  if (tabName === 'stats') loadStats();
  if (tabName === 'contacts') loadContacts();
}

// ===================================================
// Project Management
// ===================================================
function addTask() {
  taskCount++;
  const taskHTML = `
    <div class="bg-gray-50 p-4 rounded-lg border border-gray-200" id="task-${taskCount}">
      <div class="flex justify-between items-start mb-3">
        <h4 class="font-semibold text-gray-900">Task #${taskCount}</h4>
        <button type="button" onclick="removeTask(${taskCount})" class="text-red-600 hover:text-red-700 font-medium">
          ✕ Remove
        </button>
      </div>
      <div class="grid md:grid-cols-2 gap-3">
        <input type="text" class="taskName col-span-2 px-3 py-2 border border-gray-300 rounded-lg" placeholder="Task name (e.g., Paint living room)" required>
        <input type="number" class="laborHours px-3 py-2 border border-gray-300 rounded-lg" placeholder="Labor hours" min="0" step="0.5">
        <input type="number" class="laborRate px-3 py-2 border border-gray-300 rounded-lg" placeholder="Rate ($/hr)" min="0">
        <input type="number" class="materialCost col-span-2 px-3 py-2 border border-gray-300 rounded-lg" placeholder="Material costs ($)" min="0">
      </div>
    </div>
  `;

  document.getElementById('tasksList').insertAdjacentHTML('beforeend', taskHTML);
  attachCalculationListeners();
}

function removeTask(id) {
  document.getElementById(`task-${id}`).remove();
  calculateTotal();
}

function attachCalculationListeners() {
  document.querySelectorAll('.laborHours, .laborRate, .materialCost').forEach(input => {
    input.addEventListener('input', calculateTotal);
  });
}

function calculateTotal() {
  let total = 0;
  document.querySelectorAll('#tasksList > div').forEach(taskDiv => {
    const hours = parseFloat(taskDiv.querySelector('.laborHours')?.value) || 0;
    const rate = parseFloat(taskDiv.querySelector('.laborRate')?.value) || 0;
    const materials = parseFloat(taskDiv.querySelector('.materialCost')?.value) || 0;
    total += (hours * rate) + materials;
  });

  document.getElementById('totalEstimate').textContent = `$${total.toFixed(2)}`;
}

function saveProject(event) {
  event.preventDefault();

  const project = {
    id: Date.now(),
    projectName: document.getElementById('projectName').value,
    address: document.getElementById('propertyAddress').value,
    unit: document.getElementById('unitNumber').value,
    owner: document.getElementById('ownerName').value,
    date: document.getElementById('completionDate').value,
    status: 'Active',
    tasks: []
  };

  // Collect tasks
  document.querySelectorAll('#tasksList > div').forEach(taskDiv => {
    const taskName = taskDiv.querySelector('.taskName').value;
    if (taskName) {
      project.tasks.push({
        name: taskName,
        hours: parseFloat(taskDiv.querySelector('.laborHours').value) || 0,
        rate: parseFloat(taskDiv.querySelector('.laborRate').value) || 0,
        material: parseFloat(taskDiv.querySelector('.materialCost').value) || 0,
        completed: false
      });
    }
  });

  // Save to localStorage
  const projects = JSON.parse(localStorage.getItem('turnflow_projects') || '[]');
  projects.push(project);
  localStorage.setItem('turnflow_projects', JSON.stringify(projects));

  // Reset and show success
  resetForm();
  showTab('projects');

  // Show success message
  alert('✅ Project saved successfully!');
}

function resetForm() {
  document.getElementById('projectForm').reset();
  document.getElementById('tasksList').innerHTML = '';
  document.getElementById('totalEstimate').textContent = '$0.00';
  taskCount = 0;
}

function loadProjects() {
  const projects = JSON.parse(localStorage.getItem('turnflow_projects') || '[]');
  const container = document.getElementById('projectsList');

  if (projects.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-xl shadow-lg p-12 text-center">
        <div class="text-6xl mb-4">📋</div>
        <h3 class="text-2xl font-semibold text-gray-900 mb-2">No Projects Yet</h3>
        <p class="text-gray-600 mb-6">Create your first project to get started!</p>
        <button onclick="showTab('new')" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
          + Create Project
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = projects.map(project => {
    const total = project.tasks.reduce((sum, task) =>
      sum + (task.hours * task.rate) + task.material, 0
    );

    return `
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-2xl font-bold text-gray-900">${project.projectName}</h3>
            <p class="text-gray-600">${project.address}${project.unit ? ', Unit ' + project.unit : ''}</p>
            <p class="text-sm text-gray-500">Owner: ${project.owner}</p>
          </div>
          <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            ${project.status}
          </span>
        </div>

        <div class="mb-4">
          <div class="text-sm text-gray-600 mb-2">${project.tasks.length} task(s)</div>
          <div class="text-3xl font-bold text-green-600">$${total.toFixed(2)}</div>
        </div>

        <div class="flex gap-2">
          <button onclick="viewEstimate(${project.id})" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            📄 View Estimate
          </button>
          <button onclick="deleteProject(${project.id})" class="px-4 py-2 border-2 border-red-600 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function deleteProject(id) {
  if (confirm('Are you sure you want to delete this project?')) {
    let projects = JSON.parse(localStorage.getItem('turnflow_projects') || '[]');
    projects = projects.filter(p => p.id !== id);
    localStorage.setItem('turnflow_projects', JSON.stringify(projects));
    loadProjects();
  }
}

function viewEstimate(id) {
  const projects = JSON.parse(localStorage.getItem('turnflow_projects') || '[]');
  const project = projects.find(p => p.id === id);

  if (!project) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text('TurnFlow™ Estimate', 20, 20);

  // Project details
  doc.setFontSize(12);
  doc.text(`Project: ${project.projectName}`, 20, 35);
  doc.text(`Address: ${project.address}${project.unit ? ', Unit ' + project.unit : ''}`, 20, 42);
  doc.text(`Owner: ${project.owner}`, 20, 49);
  doc.text(`Date: ${project.date}`, 20, 56);

  // Tasks
  let y = 70;
  doc.setFontSize(14);
  doc.text('Tasks:', 20, y);
  y += 10;

  doc.setFontSize(10);
  let grandTotal = 0;

  project.tasks.forEach((task, index) => {
    const taskTotal = (task.hours * task.rate) + task.material;
    grandTotal += taskTotal;

    doc.text(`${index + 1}. ${task.name}`, 20, y);
    y += 6;
    doc.text(`   Labor: ${task.hours} hrs @ $${task.rate}/hr = $${(task.hours * task.rate).toFixed(2)}`, 20, y);
    y += 6;
    doc.text(`   Materials: $${task.material.toFixed(2)}`, 20, y);
    y += 6;
    doc.text(`   Subtotal: $${taskTotal.toFixed(2)}`, 20, y);
    y += 10;
  });

  // Total
  doc.setFontSize(14);
  doc.text(`TOTAL ESTIMATE: $${grandTotal.toFixed(2)}`, 20, y + 10);

  // Download
  doc.save(`${project.projectName.replace(/\s+/g, '_')}_Estimate.pdf`);
}

// ===================================================
// Statistics
// ===================================================
function loadStats() {
  const projects = JSON.parse(localStorage.getItem('turnflow_projects') || '[]');

  let completed = 0;
  let pending = 0;
  let costData = {};

  projects.forEach(project => {
    let projectCost = 0;
    project.tasks.forEach(task => {
      if (task.completed) completed++;
      else pending++;
      projectCost += (task.hours * task.rate) + task.material;
    });
    costData[project.projectName] = projectCost;
  });

  // Task completion chart
  const taskCtx = document.getElementById('taskChart');
  if (taskCtx) {
    new Chart(taskCtx, {
      type: 'pie',
      data: {
        labels: ['Completed', 'Pending'],
        datasets: [{
          data: [completed, pending],
          backgroundColor: ['#10b981', '#ef4444']
        }]
      }
    });
  }

  // Cost chart
  const costCtx = document.getElementById('costChart');
  if (costCtx) {
    new Chart(costCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(costData),
        datasets: [{
          label: 'Total Cost',
          data: Object.values(costData),
          backgroundColor: '#3b82f6'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
}

// ===================================================
// Contacts
// ===================================================
function saveContact(event) {
  event.preventDefault();

  const contact = {
    name: document.getElementById('contactName').value,
    email: document.getElementById('contactEmail').value,
    phone: document.getElementById('contactPhone').value,
    property: document.getElementById('contactProperty').value
  };

  const contacts = JSON.parse(localStorage.getItem('turnflow_contacts') || '[]');
  contacts.push(contact);
  localStorage.setItem('turnflow_contacts', JSON.stringify(contacts));

  document.getElementById('contactForm').reset();
  loadContacts();
}

function loadContacts() {
  const contacts = JSON.parse(localStorage.getItem('turnflow_contacts') || '[]');
  const container = document.getElementById('contactsList');

  if (contacts.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center py-8">No contacts saved yet.</p>';
    return;
  }

  container.innerHTML = contacts.map((contact, index) => `
    <div class="p-4 border border-gray-200 rounded-lg hover:border-blue-400 transition-colors">
      <div class="flex justify-between items-start">
        <div>
          <h4 class="font-semibold text-gray-900">${contact.name}</h4>
          <p class="text-sm text-gray-600">📧 ${contact.email}</p>
          <p class="text-sm text-gray-600">📞 ${contact.phone}</p>
          <p class="text-sm text-gray-600">🏠 ${contact.property}</p>
        </div>
        <button onclick="deleteContact(${index})" class="text-red-600 hover:text-red-700 font-medium text-sm">
          Delete
        </button>
      </div>
    </div>
  `).join('');
}

function deleteContact(index) {
  let contacts = JSON.parse(localStorage.getItem('turnflow_contacts') || '[]');
  contacts.splice(index, 1);
  localStorage.setItem('turnflow_contacts', JSON.stringify(contacts));
  loadContacts();
}

// ===================================================
// Event Listeners
// ===================================================
document.addEventListener('DOMContentLoaded', () => {
  // Show projects tab by default
  showTab('projects');

  // Form submissions
  document.getElementById('projectForm').addEventListener('submit', saveProject);
  document.getElementById('contactForm').addEventListener('submit', saveContact);

  // Add first task automatically when on new project tab
  if (document.getElementById('tasksList').children.length === 0) {
    addTask();
  }
});
