/**
 * EduReach IndexedDB Module
 * Handles all offline data storage for the PWA
 * Optimized for 1GB RAM devices
 */

// Database configuration
const DB_NAME = 'EduReachDB';
const DB_VERSION = 1;

// Object stores (think of these as "tables" in a database)
const STORES = {
  CHAT_LOGS: 'chatLogs',
  QUIZZES: 'quizzes',
  COURSES: 'courses',
  USER_PROGRESS: 'userProgress',
  OFFLINE_QUEUE: 'offlineQueue'
};

// Global database instance
let db = null;

/**
 * Initialize the IndexedDB Database
 * This runs when the app first loads
 */
async function initDB() {
  return new Promise((resolve, reject) => {
    console.log('[DB] Initializing IndexedDB...');
    
    // Open (or create) the database
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    /**
     * onupgradeneeded - Runs when database is created or version changes
     * This is where we create our "tables" (object stores)
     */
    request.onupgradeneeded = (event) => {
      console.log('[DB] Database upgrade needed, creating object stores...');
      db = event.target.result;
      
      // Create Chat Logs store
      if (!db.objectStoreNames.contains(STORES.CHAT_LOGS)) {
        const chatStore = db.createObjectStore(STORES.CHAT_LOGS, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        chatStore.createIndex('timestamp', 'timestamp', { unique: false });
        chatStore.createIndex('userType', 'userType', { unique: false });
        console.log('[DB] Created chatLogs store');
      }
      
      // Create Quizzes store
      if (!db.objectStoreNames.contains(STORES.QUIZZES)) {
        const quizStore = db.createObjectStore(STORES.QUIZZES, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        quizStore.createIndex('courseId', 'courseId', { unique: false });
        quizStore.createIndex('completed', 'completed', { unique: false });
        console.log('[DB] Created quizzes store');
      }
      
      // Create Courses store
      if (!db.objectStoreNames.contains(STORES.COURSES)) {
        const courseStore = db.createObjectStore(STORES.COURSES, { 
          keyPath: 'id' 
        });
        courseStore.createIndex('title', 'title', { unique: false });
        courseStore.createIndex('downloaded', 'downloaded', { unique: false });
        console.log('[DB] Created courses store');
      }
      
      // Create User Progress store
      if (!db.objectStoreNames.contains(STORES.USER_PROGRESS)) {
        const progressStore = db.createObjectStore(STORES.USER_PROGRESS, { 
          keyPath: 'courseId' 
        });
        progressStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        console.log('[DB] Created userProgress store');
      }
      
      // Create Offline Queue store (for syncing when online)
      if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
        const queueStore = db.createObjectStore(STORES.OFFLINE_QUEUE, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('[DB] Created offlineQueue store');
      }
    };
    
    /**
     * onsuccess - Database opened successfully
     */
    request.onsuccess = (event) => {
      db = event.target.result;
      console.log('[DB] Database initialized successfully');
      console.log('[DB] Available stores:', Array.from(db.objectStoreNames));
      resolve(db);
    };
    
    /**
     * onerror - Database failed to open
     */
    request.onerror = (event) => {
      console.error('[DB] Database initialization failed:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Add a chat message to the database
 * @param {Object} message - Chat message object
 * @param {string} message.text - The message content
 * @param {string} message.userType - 'user' or 'bot'
 * @returns {Promise} Resolves with the message ID
 */
async function addChatMessage(message) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CHAT_LOGS], 'readwrite');
    const store = transaction.objectStore(STORES.CHAT_LOGS);
    
    // Add timestamp automatically
    const chatMessage = {
      text: message.text,
      userType: message.userType,
      timestamp: new Date().toISOString()
    };
    
    const request = store.add(chatMessage);
    
    request.onsuccess = () => {
      console.log('[DB] Chat message saved:', chatMessage);
      resolve(request.result); // Returns the auto-generated ID
    };
    
    request.onerror = () => {
      console.error('[DB] Failed to save chat message:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get all chat messages
 * @param {number} limit - Maximum number of messages to retrieve
 * @returns {Promise<Array>} Array of chat messages
 */
async function getAllChatMessages(limit = 100) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CHAT_LOGS], 'readonly');
    const store = transaction.objectStore(STORES.CHAT_LOGS);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const messages = request.result;
      // Return latest messages first, limited by the limit parameter
      const limitedMessages = messages.slice(-limit).reverse();
      console.log(`[DB] Retrieved ${limitedMessages.length} chat messages`);
      resolve(limitedMessages);
    };
    
    request.onerror = () => {
      console.error('[DB] Failed to retrieve chat messages:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Clear all chat messages (for testing or privacy)
 * @returns {Promise}
 */
async function clearChatMessages() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CHAT_LOGS], 'readwrite');
    const store = transaction.objectStore(STORES.CHAT_LOGS);
    const request = store.clear();
    
    request.onsuccess = () => {
      console.log('[DB] All chat messages cleared');
      resolve();
    };
    
    request.onerror = () => {
      console.error('[DB] Failed to clear chat messages:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Save a quiz to the database
 * @param {Object} quiz - Quiz object
 * @returns {Promise}
 */
async function saveQuiz(quiz) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.QUIZZES], 'readwrite');
    const store = transaction.objectStore(STORES.QUIZZES);
    
    const quizData = {
      ...quiz,
      completed: quiz.completed || false,
      timestamp: new Date().toISOString()
    };
    
    const request = store.add(quizData);
    
    request.onsuccess = () => {
      console.log('[DB] Quiz saved:', quizData);
      resolve(request.result);
    };
    
    request.onerror = () => {
      console.error('[DB] Failed to save quiz:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get all quizzes for a specific course
 * @param {string} courseId - The course ID
 * @returns {Promise<Array>}
 */
async function getQuizzesByCourse(courseId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.QUIZZES], 'readonly');
    const store = transaction.objectStore(STORES.QUIZZES);
    const index = store.index('courseId');
    const request = index.getAll(courseId);
    
    request.onsuccess = () => {
      console.log(`[DB] Retrieved ${request.result.length} quizzes for course ${courseId}`);
      resolve(request.result);
    };
    
    request.onerror = () => {
      console.error('[DB] Failed to retrieve quizzes:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Save user progress for a course
 * @param {string} courseId - The course ID
 * @param {Object} progress - Progress data
 * @returns {Promise}
 */
async function saveProgress(courseId, progress) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.USER_PROGRESS], 'readwrite');
    const store = transaction.objectStore(STORES.USER_PROGRESS);
    
    const progressData = {
      courseId,
      ...progress,
      lastAccessed: new Date().toISOString()
    };
    
    // Use put instead of add to allow updates
    const request = store.put(progressData);
    
    request.onsuccess = () => {
      console.log('[DB] Progress saved for course:', courseId);
      resolve(request.result);
    };
    
    request.onerror = () => {
      console.error('[DB] Failed to save progress:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get user progress for a course
 * @param {string} courseId - The course ID
 * @returns {Promise<Object>}
 */
async function getProgress(courseId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.USER_PROGRESS], 'readonly');
    const store = transaction.objectStore(STORES.USER_PROGRESS);
    const request = store.get(courseId);
    
    request.onsuccess = () => {
      console.log('[DB] Progress retrieved for course:', courseId);
      resolve(request.result || null);
    };
    
    request.onerror = () => {
      console.error('[DB] Failed to retrieve progress:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get database statistics (for debugging)
 * @returns {Promise<Object>}
 */
async function getDBStats() {
  return new Promise(async (resolve, reject) => {
    try {
      const stats = {};
      
      for (const storeName of Object.values(STORES)) {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const countRequest = store.count();
        
        await new Promise((res, rej) => {
          countRequest.onsuccess = () => {
            stats[storeName] = countRequest.result;
            res();
          };
          countRequest.onerror = () => rej(countRequest.error);
        });
      }
      
      console.log('[DB] Database statistics:', stats);
      resolve(stats);
    } catch (error) {
      console.error('[DB] Failed to get statistics:', error);
      reject(error);
    }
  });
}

/**
 * Export the database API
 * These functions will be available globally
 */
const EduReachDB = {
  init: initDB,
  chat: {
    add: addChatMessage,
    getAll: getAllChatMessages,
    clear: clearChatMessages
  },
  quiz: {
    save: saveQuiz,
    getByCourse: getQuizzesByCourse
  },
  progress: {
    save: saveProgress,
    get: getProgress
  },
  getStats: getDBStats
};

// Make it available globally
window.EduReachDB = EduReachDB;

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initDB().catch(err => console.error('[DB] Auto-init failed:', err));
  });
} else {
  initDB().catch(err => console.error('[DB] Auto-init failed:', err));
}

console.log('[DB] IndexedDB module loaded');