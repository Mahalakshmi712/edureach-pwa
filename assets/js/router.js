/**
 * EduReach Router Module
 * Handles single-page navigation without page reloads
 * Optimized for offline-first PWA experience
 */

// Available routes/pages in the app
const ROUTES = {
  DASHBOARD: 'dashboard',
  COURSES: 'courses',
  CHAT: 'chat',
  PROFILE: 'profile'
};

// Current active route
let currentRoute = ROUTES.DASHBOARD;

/**
 * Initialize the router
 * Sets up event listeners and handles initial route
 */
function initRouter() {
  console.log('[Router] Initializing router...');
  
  // Set up navigation button listeners
  setupNavigation();
  
  // Handle browser back/forward buttons
  window.addEventListener('popstate', handlePopState);
  
  // Handle initial route on page load
  const initialRoute = getRouteFromHash() || ROUTES.DASHBOARD;
  navigateTo(initialRoute, false); // false = don't push to history
  
  console.log('[Router] Router initialized, current route:', initialRoute);
}

/**
 * Set up click listeners for navigation buttons
 */
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const section = e.currentTarget.getAttribute('data-section');
      
      if (section && ROUTES[section.toUpperCase()]) {
        navigateTo(section);
      }
    });
  });
  
  console.log('[Router] Navigation listeners attached to', navItems.length, 'items');
}

/**
 * Navigate to a specific route
 * @param {string} route - The route to navigate to (e.g., 'dashboard', 'courses')
 * @param {boolean} pushState - Whether to add to browser history (default: true)
 */
function navigateTo(route, pushState = true) {
  // Validate route
  if (!Object.values(ROUTES).includes(route)) {
    console.warn('[Router] Invalid route:', route, '- defaulting to dashboard');
    route = ROUTES.DASHBOARD;
  }
  
  console.log('[Router] Navigating to:', route);
  
  // Update current route
  const previousRoute = currentRoute;
  currentRoute = route;
  
  // Update browser history and URL
  if (pushState) {
    const url = `#${route}`;
    window.history.pushState({ route }, '', url);
  }
  
  // Update UI
  hideAllSections();
  showSection(route);
  updateActiveNav(route);
  
  // Trigger route change event (for other modules to listen to)
  const event = new CustomEvent('routechange', { 
    detail: { 
      from: previousRoute, 
      to: route 
    } 
  });
  window.dispatchEvent(event);
  
  // Load section-specific data
  loadSectionData(route);
}

/**
 * Hide all page sections
 */
function hideAllSections() {
  const sections = document.querySelectorAll('.page-section');
  sections.forEach(section => {
    section.classList.remove('active');
    section.style.display = 'none';
  });
}

/**
 * Show a specific section
 * @param {string} route - The route/section to show
 */
function showSection(route) {
  const section = document.getElementById(`${route}-section`);
  
  if (section) {
    section.style.display = 'block';
    // Small delay for smooth animation
    setTimeout(() => {
      section.classList.add('active');
    }, 10);
    console.log('[Router] Showing section:', route);
  } else {
    console.error('[Router] Section not found:', `${route}-section`);
  }
}

/**
 * Update active state on navigation buttons
 * @param {string} route - The active route
 */
function updateActiveNav(route) {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    const section = item.getAttribute('data-section');
    
    if (section === route) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

/**
 * Get current route from URL hash
 * @returns {string|null} The route from hash, or null
 */
function getRouteFromHash() {
  const hash = window.location.hash.slice(1); // Remove the '#'
  return hash || null;
}

/**
 * Handle browser back/forward button clicks
 * @param {PopStateEvent} event - The popstate event
 */
function handlePopState(event) {
  const route = event.state?.route || getRouteFromHash() || ROUTES.DASHBOARD;
  console.log('[Router] Popstate event, navigating to:', route);
  navigateTo(route, false); // Don't push to history again
}

/**
 * Load data specific to a section
 * This is where you'd fetch data from IndexedDB for each page
 * @param {string} route - The route being loaded
 */
async function loadSectionData(route) {
  console.log('[Router] Loading data for:', route);
  
  switch (route) {
    case ROUTES.DASHBOARD:
      await loadDashboardData();
      break;
    case ROUTES.COURSES:
      await loadCoursesData();
      break;
    case ROUTES.CHAT:
      await loadChatData();
      break;
    case ROUTES.PROFILE:
      await loadProfileData();
      break;
  }
}

/**
 * Load Dashboard data
 */
async function loadDashboardData() {
  console.log('[Router] Loading dashboard data...');
  
  const dashboardContent = document.getElementById('dashboard-content');
  if (!dashboardContent) return;
  
  try {
    // Get database stats
    const stats = await EduReachDB.getStats();
    
    // Update dashboard with stats
    dashboardContent.innerHTML = `
      <div class="dashboard-stats">
        <div class="stat-card">
          <h3>📚 My Courses</h3>
          <p class="stat-number">${stats.courses || 0}</p>
          <p class="stat-label">Enrolled</p>
        </div>
        
        <div class="stat-card">
          <h3>✅ Quizzes</h3>
          <p class="stat-number">${stats.quizzes || 0}</p>
          <p class="stat-label">Completed</p>
        </div>
        
        <div class="stat-card">
          <h3>💬 Chat Messages</h3>
          <p class="stat-number">${stats.chatLogs || 0}</p>
          <p class="stat-label">Saved</p>
        </div>
        
        <div class="stat-card">
          <h3>📊 Progress</h3>
          <p class="stat-number">${stats.userProgress || 0}</p>
          <p class="stat-label">Courses Tracked</p>
        </div>
      </div>
      
      <div class="recent-activity">
        <h3>Recent Activity</h3>
        <p class="placeholder-text">Continue where you left off...</p>
      </div>
    `;
    
   // Initialize charts after stats are loaded
if (typeof EduReachCharts !== 'undefined') {
  setTimeout(async () => {
    await EduReachCharts.init();
  }, 500);
}
  } catch (error) {
    console.error('[Router] Failed to load dashboard data:', error);
    dashboardContent.innerHTML = `
      <p class="error-text">Failed to load dashboard. Please refresh.</p>
    `;
  }
}

/**
 * Load Courses data
 */
async function loadCoursesData() {
  console.log('[Router] Loading courses data...');
  
  const coursesContent = document.getElementById('courses-content');
  if (!coursesContent) return;
  
  // Placeholder content (you'll replace this with real data later)
  coursesContent.innerHTML = `
    <div class="courses-list">
      <h3>Available Courses</h3>
      <p class="placeholder-text">No courses downloaded yet. Connect to internet to browse courses.</p>
      
      <button class="primary-button" onclick="alert('Course browsing coming soon!')">
        Browse Courses
      </button>
    </div>
  `;
}

/**
 * Load Chat data
 */
async function loadChatData() {
  console.log('[Router] Loading chat data...');
  
  const chatContent = document.getElementById('chat-content');
  if (!chatContent) return;
  
  try {
    // Get chat messages from IndexedDB
    const messages = await EduReachDB.chat.getAll(20); // Get last 20 messages
    
    let chatHTML = '<div class="chat-messages">';
    
    if (messages.length === 0) {
      chatHTML += '<p class="placeholder-text">No messages yet. Start a conversation!</p>';
    } else {
      messages.forEach(msg => {
        const messageClass = msg.userType === 'user' ? 'user-message' : 'bot-message';
        chatHTML += `
          <div class="chat-message ${messageClass}">
            <p>${msg.text}</p>
            <span class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</span>
          </div>
        `;
      });
    }
    
    chatHTML += '</div>';
    
    // Add input area
    chatHTML += `
      <div class="chat-input-area">
        <input type="text" id="chat-input" placeholder="Type your message..." />
        <button onclick="sendChatMessage()">Send</button>
      </div>
    `;
    
    chatContent.innerHTML = chatHTML;
    
    // Scroll to bottom of messages
    const messagesContainer = chatContent.querySelector('.chat-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
  } catch (error) {
    console.error('[Router] Failed to load chat data:', error);
    chatContent.innerHTML = '<p class="error-text">Failed to load chat. Please refresh.</p>';
  }
}

/**
 * Load Profile data
 */
async function loadProfileData() {
  console.log('[Router] Loading profile data...');
  
  const profileContent = document.getElementById('profile-content');
  if (!profileContent) return;
  
  profileContent.innerHTML = `
    <div class="profile-info">
      <div class="profile-avatar">
        <div class="avatar-placeholder">👤</div>
      </div>
      
      <h3>Student Profile</h3>
      
      <div class="profile-details">
        <p><strong>Name:</strong> Demo Student</p>
        <p><strong>Level:</strong> Beginner</p>
        <p><strong>Storage Used:</strong> Calculating...</p>
      </div>
      
      <div class="profile-actions">
        <button class="primary-button" onclick="alert('Settings coming soon!')">
          Settings
        </button>
        <button class="secondary-button" onclick="clearAllData()">
          Clear All Data
        </button>
      </div>
    </div>
  `;
  
  // Calculate storage usage
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const usedMB = (estimate.usage / 1024 / 1024).toFixed(2);
      const quotaMB = (estimate.quota / 1024 / 1024).toFixed(2);
      
      const storageText = profileContent.querySelector('.profile-details p:last-child');
      if (storageText) {
        storageText.innerHTML = `<strong>Storage Used:</strong> ${usedMB} MB / ${quotaMB} MB`;
      }
    } catch (error) {
      console.error('[Router] Failed to get storage estimate:', error);
    }
  }
}

/**
 * Send a chat message (helper function)
 */
async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  if (!input || !input.value.trim()) return;
  
  const messageText = input.value.trim();
  input.value = '';
  
  try {
    // Save user message
    await EduReachDB.chat.add({
      text: messageText,
      userType: 'user'
    });
    
    // Reload chat to show new message
    await loadChatData();
    
    // Simulate bot response (you'll replace this with real AI later)
    setTimeout(async () => {
      await EduReachDB.chat.add({
        text: "I received your message! This is a placeholder response. The AI chatbot will be implemented by Member 2.",
        userType: 'bot'
      });
      await loadChatData();
    }, 1000);
    
  } catch (error) {
    console.error('[Router] Failed to send message:', error);
    alert('Failed to send message. Please try again.');
  }
}

/**
 * Clear all data (helper function for profile)
 */
async function clearAllData() {
  if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    return;
  }
  
  try {
    await EduReachDB.chat.clear();
    alert('All data cleared successfully!');
    // Reload current section
    loadSectionData(currentRoute);
  } catch (error) {
    console.error('[Router] Failed to clear data:', error);
    alert('Failed to clear data. Please try again.');
  }
}

/**
 * Get current route (exposed for external use)
 */
function getCurrentRoute() {
  return currentRoute;
}

// Export router functions to global scope
window.EduReachRouter = {
  init: initRouter,
  navigateTo: navigateTo,
  getCurrentRoute: getCurrentRoute
};

// Make helper functions globally available
window.sendChatMessage = sendChatMessage;
window.clearAllData = clearAllData;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRouter);
} else {
  initRouter();
}

console.log('[Router] Router module loaded');