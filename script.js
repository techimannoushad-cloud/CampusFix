/**
 * CampusFix — Issue Tracker Dashboard
 * Pure Vanilla JavaScript implementation
 */

// Storage identifier
const STORAGE_KEY = 'campusfix_issues_v1';

// Sample dataset populated ONLY when localStorage is completely empty
const INITIAL_SAMPLE_ISSUES = [
  {
    id: 'cf-sample-1',
    title: 'Ceiling projector blinking blue and green during lectures',
    category: 'Classrooms',
    priority: 'High',
    location: 'Science Hall 102',
    status: 'open',
    createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString() // 42 mins ago
  },
  {
    id: 'cf-sample-2',
    title: 'Water pressure in 2nd floor hand sinks is extremely low',
    category: 'Toilets',
    priority: 'Medium',
    location: 'West Wing Restrooms',
    status: 'open',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString() // 3 hours ago
  },
  {
    id: 'cf-sample-3',
    title: 'Condiment pump nozzle broken and leaking mustard',
    category: 'Canteen',
    priority: 'Low',
    location: 'Main Dining Hall Counter 3',
    status: 'resolved',
    createdAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString() // yesterday
  }
];

// App State
let issues = [];
let currentFilter = 'all'; // 'all' | 'open' | 'resolved'
let searchKeyword = '';

// DOM Elements
const issueForm = document.getElementById('issueForm');
const issueTitleInput = document.getElementById('issueTitle');
const issueCategoryInput = document.getElementById('issueCategory');
const issuePriorityInput = document.getElementById('issuePriority');
const issueLocationInput = document.getElementById('issueLocation');
const titleError = document.getElementById('titleError');
const categoryError = document.getElementById('categoryError');

const issuesListContainer = document.getElementById('issuesList');
const emptyStateContainer = document.getElementById('emptyState');
const emptyStateDesc = document.getElementById('emptyStateDesc');

// Metrics DOM
const statTotalCount = document.getElementById('statTotalCount');
const statOpenCount = document.getElementById('statOpenCount');
const statResolvedCount = document.getElementById('statResolvedCount');
const headerUnresolvedText = document.getElementById('headerUnresolvedText');

// Tabs & Filters DOM
const tabAll = document.getElementById('tabAll');
const tabOpen = document.getElementById('tabOpen');
const tabResolved = document.getElementById('tabResolved');
const tabCountAll = document.getElementById('tabCountAll');
const tabCountOpen = document.getElementById('tabCountOpen');
const tabCountResolved = document.getElementById('tabCountResolved');
const searchInput = document.getElementById('searchInput');

// Button scroll
const btnScrollToForm = document.getElementById('btnScrollToForm');
const reportFormSection = document.getElementById('reportFormSection');

// Toast
const toast = document.getElementById('toastNotification');
const toastIcon = document.getElementById('toastIcon');
const toastMessage = document.getElementById('toastMessage');
let toastTimer = null;

/**
 * Initialize application: Load storage, attach events, and render.
 */
function initApp() {
  loadIssuesFromStorage();
  setupEventListeners();
  render();
}

/**
 * Load issues safely from browser localStorage.
 */
function loadIssuesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        issues = parsed;
        return;
      }
    }
  } catch (err) {
    console.warn('CampusFix: Failed to parse stored issues. Resetting.', err);
  }

  // Populate sample data if missing or corrupted
  issues = [...INITIAL_SAMPLE_ISSUES];
  persistIssues();
}

/**
 * Persist issues array into localStorage.
 */
function persistIssues() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
  } catch (err) {
    console.error('CampusFix: LocalStorage save failed.', err);
    showToast('Failed to save to browser storage.', '⚠️');
  }
}

/**
 * Setup DOM event listeners.
 */
function setupEventListeners() {
  // Form submission
  issueForm.addEventListener('submit', handleFormSubmit);

  // Clear validation indicators on input
  issueTitleInput.addEventListener('input', () => {
    if (issueTitleInput.value.trim().length >= 4) {
      issueTitleInput.classList.remove('is-invalid');
      titleError.classList.remove('visible');
    }
  });

  issueCategoryInput.addEventListener('change', () => {
    if (issueCategoryInput.value) {
      issueCategoryInput.classList.remove('is-invalid');
      categoryError.classList.remove('visible');
    }
  });

  // Filter tabs
  [tabAll, tabOpen, tabResolved].forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      const selectedFilter = tabBtn.getAttribute('data-filter');
      setFilter(selectedFilter);
    });
  });

  // Search input with dynamic filtering
  searchInput.addEventListener('input', (e) => {
    searchKeyword = e.target.value.trim().toLowerCase();
    renderCards();
  });

  // Smooth scroll to form button
  if (btnScrollToForm) {
    btnScrollToForm.addEventListener('click', () => {
      reportFormSection.scrollIntoView({ behavior: 'smooth' });
      issueTitleInput.focus();
    });
  }
}

/**
 * Form Submit & Validation
 */
function handleFormSubmit(e) {
  e.preventDefault();

  const title = issueTitleInput.value.trim();
  const category = issueCategoryInput.value;
  const priority = issuePriorityInput.value;
  const location = issueLocationInput.value.trim();

  let hasError = false;

  // Title validation
  if (title.length < 4) {
    issueTitleInput.classList.add('is-invalid');
    titleError.classList.add('visible');
    hasError = true;
  } else {
    issueTitleInput.classList.remove('is-invalid');
    titleError.classList.remove('visible');
  }

  // Category validation
  if (!category) {
    issueCategoryInput.classList.add('is-invalid');
    categoryError.classList.add('visible');
    hasError = true;
  } else {
    issueCategoryInput.classList.remove('is-invalid');
    categoryError.classList.remove('visible');
  }

  if (hasError) return;

  // Construct new issue object
  const newIssue = {
    id: 'cf-' + Date.now(),
    title: title,
    category: category,
    priority: priority,
    location: location || 'Campus General',
    status: 'open',
    createdAt: new Date().toISOString()
  };

  issues.unshift(newIssue);
  persistIssues();

  // Reset form
  issueForm.reset();
  issuePriorityInput.value = 'Medium';

  render();
  showToast('Issue reported successfully!', '🚀');
}

/**
 * Toggle Status between 'open' and 'resolved'
 */
function toggleIssueStatus(id) {
  const target = issues.find(item => item.id === id);
  if (!target) return;

  if (target.status === 'open') {
    target.status = 'resolved';
    showToast('Marked as Resolved! Great work.', '✅');
  } else {
    target.status = 'open';
    showToast('Issue reopened.', '🔄');
  }

  persistIssues();
  render();
}

/**
 * Delete Issue
 */
function deleteIssue(id) {
  const confirmed = window.confirm('Are you sure you want to remove this issue report?');
  if (!confirmed) return;

  issues = issues.filter(item => item.id !== id);
  persistIssues();
  render();
  showToast('Issue removed.', '🗑️');
}

/**
 * Switch filter view
 */
function setFilter(filter) {
  currentFilter = filter;

  [tabAll, tabOpen, tabResolved].forEach(tab => {
    const isTarget = tab.getAttribute('data-filter') === filter;
    tab.classList.toggle('active', isTarget);
    tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });

  renderCards();
}

/**
 * Render complete view (stats + cards)
 */
function render() {
  updateMetrics();
  renderCards();
}

/**
 * Update summary cards and count badges
 */
function updateMetrics() {
  const total = issues.length;
  const openCount = issues.filter(i => i.status === 'open').length;
  const resolvedCount = issues.filter(i => i.status === 'resolved').length;

  statTotalCount.textContent = total;
  statOpenCount.textContent = openCount;
  statResolvedCount.textContent = resolvedCount;

  // Header and tab badges
  headerUnresolvedText.textContent = `${openCount} Unresolved`;
  tabCountAll.textContent = total;
  tabCountOpen.textContent = openCount;
  tabCountResolved.textContent = resolvedCount;
}

/**
 * Render Issue Cards with filtering and search
 */
function renderCards() {
  // Filter by status tab
  let filtered = issues.filter(item => {
    if (currentFilter === 'open') return item.status === 'open';
    if (currentFilter === 'resolved') return item.status === 'resolved';
    return true;
  });

  // Filter by search query
  if (searchKeyword) {
    filtered = filtered.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(searchKeyword);
      const matchLoc = item.location && item.location.toLowerCase().includes(searchKeyword);
      const matchCat = item.category.toLowerCase().includes(searchKeyword);
      return matchTitle || matchLoc || matchCat;
    });
  }

  issuesListContainer.innerHTML = '';

  if (filtered.length === 0) {
    emptyStateContainer.classList.remove('hidden');
    if (searchKeyword) {
      emptyStateDesc.textContent = `No problems matching "${searchKeyword}".`;
    } else if (currentFilter === 'open') {
      emptyStateDesc.textContent = 'Awesome! Zero unresolved problems in this category.';
    } else if (currentFilter === 'resolved') {
      emptyStateDesc.textContent = 'No resolved problems to show yet.';
    } else {
      emptyStateDesc.textContent = 'No campus issues have been reported.';
    }
    return;
  }

  emptyStateContainer.classList.add('hidden');

  filtered.forEach(issue => {
    const card = document.createElement('article');
    const isOpen = issue.status === 'open';

    card.className = `issue-card ${isOpen ? '' : 'is-resolved'}`;
    card.setAttribute('data-category', issue.category);

    // Badges HTML
    const statusBadge = isOpen
      ? `<span class="badge badge-status-open"><span class="pulsing-dot" style="width:6px;height:6px;" aria-hidden="true"></span> Open</span>`
      : `<span class="badge badge-status-resolved">✓ Resolved</span>`;

    const priorityBadge = getPriorityBadgeHtml(issue.priority);
    const categoryBadge = getCategoryBadgeHtml(issue.category);

    card.innerHTML = `
      <div class="card-top">
        <div class="card-title-group">
          <div class="card-meta">
            ${statusBadge}
            ${categoryBadge}
            ${priorityBadge}
          </div>
          <h3 class="card-title">${escapeHtml(issue.title)}</h3>
        </div>
      </div>

      <div class="card-bottom">
        <div class="card-location-time">
          <span class="loc-pill">📍 ${escapeHtml(issue.location)}</span>
          <span title="${new Date(issue.createdAt).toLocaleString()}">🕒 ${formatRelativeTime(issue.createdAt)}</span>
        </div>

        <div class="card-actions">
          <button
            type="button"
            class="btn-action-status ${isOpen ? 'btn-resolve' : 'btn-reopen'}"
            onclick="toggleIssueStatus('${issue.id}')"
          >
            ${isOpen ? '✓ Mark Resolved' : '🔄 Reopen'}
          </button>
          <button
            type="button"
            class="btn-delete"
            title="Delete this issue"
            aria-label="Delete issue"
            onclick="deleteIssue('${issue.id}')"
          >
            🗑️
          </button>
        </div>
      </div>
    `;

    issuesListContainer.appendChild(card);
  });
}

/**
 * Category badge helper with emoji
 */
function getCategoryBadgeHtml(category) {
  let icon = '📦';
  if (category === 'Classrooms') icon = '🏫';
  if (category === 'Toilets') icon = '🚻';
  if (category === 'Canteen') icon = '🥪';

  return `<span class="badge badge-category">${icon} ${escapeHtml(category)}</span>`;
}

/**
 * Priority badge helper
 */
function getPriorityBadgeHtml(priority) {
  const prio = priority || 'Medium';
  const lower = prio.toLowerCase();
  let icon = '🟡';
  if (prio === 'High') icon = '🔴';
  if (prio === 'Low') icon = '🟢';

  return `<span class="badge badge-prio-${lower}">${icon} ${prio}</span>`;
}

/**
 * Toast Notification Utility
 */
function showToast(msg, icon = '✅') {
  if (toastTimer) clearTimeout(toastTimer);

  toastIcon.textContent = icon;
  toastMessage.textContent = msg;
  toast.classList.add('show');

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

/**
 * Relative time formatter without external libraries
 */
function formatRelativeTime(dateIso) {
  const timestamp = new Date(dateIso).getTime();
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return new Date(dateIso).toLocaleDateString();
}

/**
 * Sanitize text to prevent HTML injection
 */
function escapeHtml(str) {
  if (!str) return '';
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

// Bootstrap once the DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
