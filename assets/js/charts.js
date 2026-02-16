/**
 * EduReach Charts Module
 * Creates interactive charts for student progress visualization
 * Uses Chart.js library for offline-capable charts
 */

// Chart instances (stored globally to update/destroy later)
let courseProgressChart = null;
let weeklyActivityChart = null;
let quizScoresChart = null;

/**
 * Initialize all dashboard charts
 */
async function initCharts() {
  console.log('[Charts] Initializing charts...');
  
  // Wait for Chart.js to be available
  if (typeof Chart === 'undefined') {
    console.error('[Charts] Chart.js not loaded');
    return;
  }
  
  try {
    // Show charts container
    const chartsContainer = document.getElementById('dashboard-charts');
    if (chartsContainer) {
      chartsContainer.style.display = 'grid';
    }
    
    // Initialize each chart
    await initCourseProgressChart();
    await initWeeklyActivityChart();
    await initQuizScoresChart();
    
    console.log('[Charts] All charts initialized successfully');
  } catch (error) {
    console.error('[Charts] Failed to initialize charts:', error);
  }
}

/**
 * Course Progress Doughnut Chart
 * Shows completion percentage for enrolled courses
 */
async function initCourseProgressChart() {
  const ctx = document.getElementById('courseProgressChart');
  if (!ctx) return;
  
  // Destroy existing chart if it exists
  if (courseProgressChart) {
    courseProgressChart.destroy();
  }
  
  // Get real data from IndexedDB (or use mock data)
  const progressData = await getCourseProgressData();
  
  courseProgressChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: progressData.labels,
      datasets: [{
        label: 'Course Progress',
        data: progressData.values,
        backgroundColor: [
          '#4CAF50', // Completed - Green
          '#FFC107', // In Progress - Amber
          '#E0E0E0'  // Not Started - Gray
        ],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Weekly Activity Bar Chart
 * Shows learning activity over the past 7 days
 */
async function initWeeklyActivityChart() {
  const ctx = document.getElementById('weeklyActivityChart');
  if (!ctx) return;
  
  // Destroy existing chart if it exists
  if (weeklyActivityChart) {
    weeklyActivityChart.destroy();
  }
  
  // Get activity data (mock for now)
  const activityData = await getWeeklyActivityData();
  
  weeklyActivityChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: activityData.labels,
      datasets: [{
        label: 'Minutes Studied',
        data: activityData.values,
        backgroundColor: '#2E7D32',
        borderRadius: 6,
        maxBarThickness: 50
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 30,
            callback: function(value) {
              return value + ' min';
            }
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.parsed.y + ' minutes';
            }
          }
        }
      }
    }
  });
}

/**
 * Quiz Scores Line Chart
 * Shows quiz performance trend over time
 */
async function initQuizScoresChart() {
  const ctx = document.getElementById('quizScoresChart');
  if (!ctx) return;
  
  // Destroy existing chart if it exists
  if (quizScoresChart) {
    quizScoresChart.destroy();
  }
  
  // Get quiz data
  const quizData = await getQuizScoresData();
  
  quizScoresChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: quizData.labels,
      datasets: [{
        label: 'Score (%)',
        data: quizData.values,
        borderColor: '#2E7D32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#2E7D32',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 20,
            callback: function(value) {
              return value + '%';
            }
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return 'Score: ' + context.parsed.y + '%';
            }
          }
        }
      }
    }
  });
}

/**
 * Get course progress data from IndexedDB
 * Returns mock data if no real data exists
 */
async function getCourseProgressData() {
  try {
    // Try to get real stats from database
    const stats = await EduReachDB.getStats();
    
    // If we have real course data, use it
    if (stats.courses > 0) {
      // This would calculate actual completion
      // For now, return demo data
      return {
        labels: ['Completed', 'In Progress', 'Not Started'],
        values: [2, 3, 1]
      };
    }
  } catch (error) {
    console.error('[Charts] Failed to get course progress:', error);
  }
  
  // Mock data for demonstration
  return {
    labels: ['Completed', 'In Progress', 'Not Started'],
    values: [2, 3, 1]
  };
}

/**
 * Get weekly activity data
 * Returns last 7 days of study time
 */
async function getWeeklyActivityData() {
  // Get last 7 days labels
  const labels = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();
  
  for (let i = 6; i >= 0; i--) {
    const dayIndex = (today - i + 7) % 7;
    labels.push(days[dayIndex]);
  }
  
  // Mock study time data (in minutes)
  // In production, this would come from user activity tracking
  const values = [45, 60, 30, 90, 75, 120, 85];
  
  return { labels, values };
}

/**
 * Get quiz scores data
 * Returns recent quiz performance
 */
async function getQuizScoresData() {
  try {
    // Try to get real quiz data
    const stats = await EduReachDB.getStats();
    
    if (stats.quizzes > 0) {
      // Would fetch actual quiz scores here
      // For now, return demo data
    }
  } catch (error) {
    console.error('[Charts] Failed to get quiz scores:', error);
  }
  
  // Mock quiz data
  return {
    labels: ['Quiz 1', 'Quiz 2', 'Quiz 3', 'Quiz 4', 'Quiz 5'],
    values: [75, 82, 68, 90, 85]
  };
}

/**
 * Refresh all charts with new data
 * Call this when data changes
 */
async function refreshCharts() {
  console.log('[Charts] Refreshing all charts...');
  await initCharts();
}

/**
 * Destroy all charts (cleanup)
 */
function destroyCharts() {
  if (courseProgressChart) courseProgressChart.destroy();
  if (weeklyActivityChart) weeklyActivityChart.destroy();
  if (quizScoresChart) quizScoresChart.destroy();
  
  console.log('[Charts] All charts destroyed');
}

// Export chart functions
window.EduReachCharts = {
  init: initCharts,
  refresh: refreshCharts,
  destroy: destroyCharts
};

console.log('[Charts] Charts module loaded');