// Dashboard System for AI Interviewer
class DashboardSystem {
  constructor() {
    this.backend = new BackendSimulator();
    this.currentUser = null;
    this.userStats = null;
    this.progressChart = null;
    
    this.initializeEventListeners();
    this.checkAuthentication();
    this.loadDashboardData();
  }

  async checkAuthentication() {
    const userData = localStorage.getItem('ai_interviewer_user');
    if (!userData) {
      this.showNotification('Please log in to view your dashboard.', 'warning');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
      return;
    }
    
    this.currentUser = JSON.parse(userData);
  }

  initializeEventListeners() {
    // Topic cards click handlers
    const topicCards = document.querySelectorAll('.topic-card');
    topicCards.forEach(card => {
      card.addEventListener('click', () => {
        const topic = card.dataset.topic;
        this.navigateToPractice(topic);
      });
    });

    // Goal items click handlers
    const goalItems = document.querySelectorAll('.goal-item');
    goalItems.forEach(item => {
      item.addEventListener('click', () => {
        this.showGoalDetails(item);
      });
    });
  }

  async loadDashboardData() {
    if (!this.currentUser) return;

    try {
      this.showLoading();
      
      // Load user statistics
      this.userStats = await this.backend.getUserStats(this.currentUser.id);
      
      // Load user progress
      const userProgress = await this.backend.getUserProgress(this.currentUser.id);
      
      // Load user sessions
      const userSessions = await this.backend.getUserSessions(this.currentUser.id);
      
      // Update dashboard with data
      this.updateStatsCards();
      this.updateProgressChart(userSessions);
      this.updateTopicPerformance(userProgress);
      this.updateRecentActivity(userSessions);
      this.updateGoals();
      
    } catch (error) {
      this.showNotification('Error loading dashboard data: ' + error.message, 'error');
    } finally {
      this.hideLoading();
    }
  }

  updateStatsCards() {
    if (!this.userStats) return;

    // Update streak
    document.getElementById('streakCount').textContent = this.userStats.streak || 0;
    
    // Update total solved
    document.getElementById('totalSolved').textContent = this.userStats.totalSolved || 0;
    
    // Update total time
    const totalTime = this.userStats.totalTime || 0;
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);
    document.getElementById('totalTime').textContent = `${hours}h ${minutes}m`;
    
    // Update accuracy
    document.getElementById('accuracy').textContent = `${this.userStats.accuracy || 0}%`;
  }

  updateProgressChart(sessions) {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;

    // Prepare data for the last 7 days
    const last7Days = this.getLast7Days();
    const dailyData = this.prepareDailyData(sessions, last7Days);

    // Destroy existing chart if it exists
    if (this.progressChart) {
      this.progressChart.destroy();
    }

    this.progressChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: last7Days.map(date => date.toLocaleDateString('en-US', { weekday: 'short' })),
        datasets: [{
          label: 'Problems Solved',
          data: dailyData,
          borderColor: '#1a73e8',
          backgroundColor: 'rgba(26, 115, 232, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        },
        elements: {
          point: {
            radius: 4,
            hoverRadius: 6
          }
        }
      }
    });
  }

  getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  }

  prepareDailyData(sessions, dates) {
    const dailyData = new Array(7).fill(0);
    
    sessions.forEach(session => {
      if (session.status === 'completed' && session.endTime) {
        const sessionDate = new Date(session.endTime);
        const dayIndex = dates.findIndex(date => 
          date.toDateString() === sessionDate.toDateString()
        );
        
        if (dayIndex !== -1) {
          const correctAnswers = session.results.filter(r => r.isCorrect).length;
          dailyData[dayIndex] += correctAnswers;
        }
      }
    });
    
    return dailyData;
  }

  updateTopicPerformance(userProgress) {
    const topicsGrid = document.querySelector('.topics-grid');
    if (!topicsGrid) return;

    // Clear existing content
    topicsGrid.innerHTML = '';

    // Group progress by topic
    const topicStats = {};
    userProgress.forEach(progress => {
      if (!topicStats[progress.topic]) {
        topicStats[progress.topic] = {
          totalAttempted: 0,
          totalCorrect: 0,
          accuracy: 0
        };
      }
      
      topicStats[progress.topic].totalAttempted += progress.totalAttempted;
      topicStats[progress.topic].totalCorrect += progress.totalCorrect;
    });

    // Calculate accuracy for each topic
    Object.keys(topicStats).forEach(topic => {
      const stats = topicStats[topic];
      stats.accuracy = stats.totalAttempted > 0 ? 
        Math.round((stats.totalCorrect / stats.totalAttempted) * 100) : 0;
    });

    // Create topic cards
    const topicConfig = {
      'arrays': { icon: 'fa-list', name: 'Arrays' },
      'strings': { icon: 'fa-font', name: 'Strings' },
      'graphs': { icon: 'fa-project-diagram', name: 'Graphs' },
      'dynamic-programming': { icon: 'fa-brain', name: 'Dynamic Programming' },
      'trees': { icon: 'fa-sitemap', name: 'Trees' }
    };

    Object.keys(topicConfig).forEach(topic => {
      const config = topicConfig[topic];
      const stats = topicStats[topic] || { totalAttempted: 0, totalCorrect: 0, accuracy: 0 };
      const failed = stats.totalAttempted - stats.totalCorrect;

      const topicCard = document.createElement('div');
      topicCard.className = 'topic-card';
      topicCard.dataset.topic = topic;
      
      topicCard.innerHTML = `
        <div class="topic-header">
          <h3><i class="fa-solid ${config.icon}"></i> ${config.name}</h3>
          <span class="topic-score">${stats.accuracy}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${stats.accuracy}%"></div>
        </div>
        <div class="topic-stats">
          <span>${stats.totalCorrect} solved</span>
          <span>${failed} failed</span>
        </div>
      `;

      topicsGrid.appendChild(topicCard);
    });
  }

  updateRecentActivity(sessions) {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    // Get recent sessions (last 5)
    const recentSessions = sessions
      .filter(session => session.status === 'completed')
      .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))
      .slice(0, 5);

    activityList.innerHTML = '';

    recentSessions.forEach(session => {
      const correctAnswers = session.results.filter(r => r.isCorrect).length;
      const totalQuestions = session.results.length;
      const timeSpent = Math.floor(session.totalTime / 60);
      
      const activityItem = document.createElement('div');
      activityItem.className = 'activity-item';
      
      activityItem.innerHTML = `
        <div class="activity-icon">
          <i class="fa-solid fa-code"></i>
        </div>
        <div class="activity-content">
          <h4>${session.topic.charAt(0).toUpperCase() + session.topic.slice(1)} Practice</h4>
          <p>Solved ${correctAnswers}/${totalQuestions} problems in ${timeSpent} minutes</p>
        </div>
        <div class="activity-time">
          ${this.formatTimeAgo(new Date(session.endTime))}
        </div>
      `;

      activityList.appendChild(activityItem);
    });
  }

  updateGoals() {
    const goalsList = document.querySelector('.goals-list');
    if (!goalsList || !this.userStats) return;

    // Update existing goals with real data
    const goalItems = goalsList.querySelectorAll('.goal-item');
    
    // Goal 1: Solve 50 Problems
    if (goalItems[0]) {
      const totalSolved = this.userStats.totalSolved || 0;
      const progress = Math.min((totalSolved / 50) * 100, 100);
      const progressBar = goalItems[0].querySelector('.progress-fill');
      const progressText = goalItems[0].querySelector('.goal-progress span');
      
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (progressText) progressText.textContent = `${totalSolved}/50`;
      
      const goalContent = goalItems[0].querySelector('.goal-content p');
      if (goalContent) {
        goalContent.textContent = `You're ${Math.round(progress)}% of the way there!`;
      }
    }

    // Goal 2: Maintain Streak
    if (goalItems[1]) {
      const currentStreak = this.userStats.streak || 0;
      const targetStreak = 7;
      const progress = Math.min((currentStreak / targetStreak) * 100, 100);
      const progressBar = goalItems[1].querySelector('.progress-fill');
      const progressText = goalItems[1].querySelector('.goal-progress span');
      
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (progressText) progressText.textContent = `${currentStreak}/${targetStreak}`;
      
      const goalContent = goalItems[1].querySelector('.goal-content p');
      if (goalContent) {
        if (currentStreak >= targetStreak) {
          goalContent.textContent = 'Goal achieved! Keep it up!';
        } else {
          goalContent.textContent = `Keep it up! You're on day ${currentStreak}.`;
        }
      }
    }

    // Goal 3: Improve Accuracy
    if (goalItems[2]) {
      const currentAccuracy = this.userStats.accuracy || 0;
      const targetAccuracy = 80;
      const progress = Math.min((currentAccuracy / targetAccuracy) * 100, 100);
      const progressBar = goalItems[2].querySelector('.progress-fill');
      const progressText = goalItems[2].querySelector('.goal-progress span');
      
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (progressText) progressText.textContent = `${currentAccuracy}%`;
      
      const goalContent = goalItems[2].querySelector('.goal-content p');
      if (goalContent) {
        if (currentAccuracy >= targetAccuracy) {
          goalContent.textContent = 'Excellent accuracy! Keep it up!';
        } else {
          goalContent.textContent = `Focus on accuracy to reach ${targetAccuracy}%.`;
        }
      }
    }
  }

  navigateToPractice(topic) {
    // Store selected topic in localStorage for practice session
    localStorage.setItem('ai_interviewer_selected_topic', topic);
    window.location.href = 'practice.html';
  }

  showGoalDetails(goalItem) {
    const goalTitle = goalItem.querySelector('h4').textContent;
    this.showNotification(`Goal: ${goalTitle}`, 'info');
  }

  formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }

  showLoading() {
    // Add loading overlay if needed
    const dashboard = document.querySelector('.dashboard-grid');
    if (dashboard) {
      dashboard.style.opacity = '0.6';
    }
  }

  hideLoading() {
    const dashboard = document.querySelector('.dashboard-grid');
    if (dashboard) {
      dashboard.style.opacity = '1';
    }
  }

  showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fa-solid fa-${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Show notification with animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  getNotificationIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DashboardSystem();
});