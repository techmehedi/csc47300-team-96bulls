// Dashboard System for AI Interviewer
class DashboardSystem {
  constructor() {
    this.currentUser = null;
    this.userStats = null;
    this.progressChart = null;
    
    this.initializeEventListeners();
    this.checkAuthentication();
    
    // Reload data when page becomes visible (user returns from practice)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.currentUser) {
        console.log('Page visible again, reloading dashboard data');
        this.loadDashboardData();
      }
    });
    
    // Also reload on page focus
    window.addEventListener('focus', () => {
      if (this.currentUser) {
        console.log('Window focused, reloading dashboard data');
        this.loadDashboardData();
      }
    });
    
    // Reload when page is shown (includes back/forward navigation)
    window.addEventListener('pageshow', (event) => {
      if (event.persisted || (this.currentUser && document.visibilityState === 'visible')) {
        console.log('Page shown, reloading dashboard data');
        this.loadDashboardData();
      }
    });
    
    // Check if we're returning from practice page
    const returningFromPractice = sessionStorage.getItem('returningFromPractice');
    if (returningFromPractice) {
      sessionStorage.removeItem('returningFromPractice');
      console.log('Returning from practice, refreshing dashboard data');
      setTimeout(() => this.loadDashboardData(), 500);
    }
    
    this.loadDashboardData();
  }

  async checkAuthentication() {
    // Prefer Supabase session
    if (window.getSupabaseUser && window.supabaseClient) {
      const user = await window.getSupabaseUser();
      if (!user) {
        this.showNotification('Please log in to view your dashboard.', 'warning');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
        return;
      }
      this.currentUser = this.mapSupabaseUser(user);
      return;
    }

    // Fallback to legacy local session
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

  mapSupabaseUser(user) {
    const meta = user.user_metadata || {};
    return {
      id: user.id,
      email: user.email,
      username: meta.username || (user.email ? user.email.split('@')[0] : ''),
      firstName: meta.firstName || '',
      lastName: meta.lastName || ''
    };
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
    if (!this.currentUser) {
      console.log('No current user, cannot load dashboard data');
      return;
    }

    try {
      // Show immediate empty states first
      this.updateProgressChart([]);
      this.updateTopicPerformance([]);
      this.updateRecentActivity([]);
      
      this.showLoading();
      
      // Wait for Supabase client and DB to be ready (reduced wait time)
      let waitCount = 0;
      while ((!window.supabaseClient || !window.supabaseDB) && waitCount < 20) {
        await new Promise(resolve => setTimeout(resolve, 50));
        waitCount++;
      }

      let userStats, userProgress, userSessions;
      
      // Get user ID from Supabase session or currentUser
      let userId = this.currentUser.id;
      if (window.supabaseClient) {
        try {
          const { data: { user } } = await window.supabaseClient.auth.getUser();
          if (user?.id) {
            userId = user.id;
            // Update currentUser with Supabase user ID if different
            if (this.currentUser.id !== userId) {
              this.currentUser.id = userId;
            }
          }
        } catch (error) {
          console.warn('Could not get user from Supabase session, using currentUser:', error);
        }
      }

      // Try Express backend first, then Supabase, then empty data
      if (window.backendAPI) {
        try {
          console.log('Loading data from Express backend for user:', userId);
          
          // Load from Express backend in parallel for faster loading
          const [statsData, progressData, sessionsData] = await Promise.allSettled([
            window.backendAPI.getStats(userId),
            window.backendAPI.getProgress(userId),
            window.backendAPI.getSessions(userId)
          ]);
          
          userStats = statsData.status === 'fulfilled' ? statsData.value : null;
          userProgress = progressData.status === 'fulfilled' ? progressData.value : [];
          userSessions = sessionsData.status === 'fulfilled' ? sessionsData.value : [];
          
          // Update sections as data arrives
          if (sessionsData.status === 'fulfilled' && userSessions) {
            this.updateProgressChart(userSessions);
            this.updateRecentActivity(userSessions);
          }
          if (progressData.status === 'fulfilled' && userProgress) {
            this.updateTopicPerformance(userProgress);
          }
          
          console.log('Backend API data loaded:', { 
            stats: userStats, 
            progressCount: userProgress.length, 
            sessionsCount: userSessions.length 
          });
        } catch (backendError) {
          console.warn('Backend API error, trying Supabase:', backendError);
          
          // Fallback to Supabase
          if (window.supabaseClient && window.supabaseDB) {
            try {
              console.log('Loading data from Supabase for user:', userId);
              
              // Load from Supabase in parallel for faster loading
              const [statsData, progressData, sessionsData] = await Promise.allSettled([
                window.supabaseDB.getUserStats(userId),
                window.supabaseDB.getUserProgress(userId),
                window.supabaseDB.getUserSessions(userId)
              ]);
              
              userStats = statsData.status === 'fulfilled' ? statsData.value : null;
              userProgress = progressData.status === 'fulfilled' ? progressData.value : [];
              userSessions = sessionsData.status === 'fulfilled' ? sessionsData.value : [];
              
              // Update sections as data arrives
              if (sessionsData.status === 'fulfilled' && userSessions) {
                this.updateProgressChart(userSessions);
                this.updateRecentActivity(userSessions);
              }
              if (progressData.status === 'fulfilled' && userProgress) {
                this.updateTopicPerformance(userProgress);
              }
              
              console.log('Supabase data loaded:', { 
                stats: userStats, 
                progressCount: userProgress.length, 
                sessionsCount: userSessions.length 
              });
            } catch (supabaseError) {
              console.error('Supabase error loading data:', supabaseError);
              userStats = { totalSolved: 0, totalTime: 0, accuracy: 0, streak: 0, progress: [] };
              userProgress = [];
              userSessions = [];
              console.log('Using empty data (databases not available)');
            }
          } else {
            userStats = { totalSolved: 0, totalTime: 0, accuracy: 0, streak: 0, progress: [] };
            userProgress = [];
            userSessions = [];
            console.log('Using empty data (no backend available)');
          }
        }
      } else if (window.supabaseClient && window.supabaseDB) {
        try {
          console.log('Loading data from Supabase for user:', userId);
          
          // Load from Supabase in parallel for faster loading
          const [statsData, progressData, sessionsData] = await Promise.allSettled([
            window.supabaseDB.getUserStats(userId),
            window.supabaseDB.getUserProgress(userId),
            window.supabaseDB.getUserSessions(userId)
          ]);
          
          userStats = statsData.status === 'fulfilled' ? statsData.value : null;
          userProgress = progressData.status === 'fulfilled' ? progressData.value : [];
          userSessions = sessionsData.status === 'fulfilled' ? sessionsData.value : [];
          
          // Update sections as data arrives
          if (sessionsData.status === 'fulfilled' && userSessions) {
            this.updateProgressChart(userSessions);
            this.updateRecentActivity(userSessions);
          }
          if (progressData.status === 'fulfilled' && userProgress) {
            this.updateTopicPerformance(userProgress);
          }
          
          console.log('Supabase data loaded:', { 
            stats: userStats, 
            progressCount: userProgress.length, 
            sessionsCount: userSessions.length 
          });
        } catch (supabaseError) {
          console.error('Supabase error loading data:', supabaseError);
          userStats = { totalSolved: 0, totalTime: 0, accuracy: 0, streak: 0, progress: [] };
          userProgress = [];
          userSessions = [];
          console.log('Using empty data (Supabase tables may not be set up)');
        }
      } else {
        console.log('No backend available, using empty data');
        userStats = { totalSolved: 0, totalTime: 0, accuracy: 0, streak: 0, progress: [] };
        userProgress = [];
        userSessions = [];
      }
      
      // Ensure we have valid data
      userStats = userStats || { totalSolved: 0, totalTime: 0, accuracy: 0, streak: 0, progress: [] };
      userProgress = userProgress || [];
      userSessions = userSessions || [];
      
      this.userStats = userStats;
      
      // Update dashboard with data (only update if not already updated during loading)
      this.updateStatsCards();
      this.updateProgressChart(userSessions);
      this.updateTopicPerformance(userProgress);
      this.updateRecentActivity(userSessions);
      this.updateGoals();
      
      console.log('Dashboard updated with real data:', userStats);
      
    } catch (error) {
      console.error('Dashboard load error:', error);
      // On error, show empty state instead of mock data
      this.userStats = { totalSolved: 0, totalTime: 0, accuracy: 0, streak: 0, progress: [] };
      this.updateStatsCards();
      this.updateProgressChart([]);
      this.updateTopicPerformance([]);
      this.updateRecentActivity([]);
      this.updateGoals();
      this.showNotification('No practice data yet. Complete some sessions to see your stats!', 'info');
    } finally {
      this.hideLoading();
    }
  }

  updateStatsCards() {
    console.log('updateStatsCards called with stats:', this.userStats);
    
    // Get elements
    const streakEl = document.getElementById('streakCount');
    const solvedEl = document.getElementById('totalSolved');
    const timeEl = document.getElementById('totalTime');
    const accuracyEl = document.getElementById('accuracy');
    
    if (!streakEl || !solvedEl || !timeEl || !accuracyEl) {
      console.error('Stats card elements not found!');
      return;
    }
    
    if (!this.userStats) {
      // Show zeros if no stats
      streakEl.textContent = '0';
      solvedEl.textContent = '0';
      timeEl.textContent = '0h 0m';
      accuracyEl.textContent = '0%';
      console.log('No stats available, showing zeros');
      return;
    }

    // Update streak
    const streak = this.userStats.streak || 0;
    streakEl.textContent = streak;
    
    // Update total solved
    const totalSolved = this.userStats.totalSolved || 0;
    solvedEl.textContent = totalSolved;
    
    // Update total time
    const totalTime = this.userStats.totalTime || 0;
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);
    timeEl.textContent = `${hours}h ${minutes}m`;
    
    // Update accuracy
    const accuracy = this.userStats.accuracy || 0;
    accuracyEl.textContent = `${accuracy}%`;
    
    console.log('Stats cards updated:', { streak, totalSolved, totalTime, accuracy });
  }

  updateProgressChart(sessions) {
    const ctx = document.getElementById('progressChart');
    if (!ctx) {
      // Chart canvas not ready yet, skip
      return;
    }

    // Prepare data for the last 7 days
    const last7Days = this.getLast7Days();
    const dailyData = this.prepareDailyData(sessions || [], last7Days);

    // Destroy existing chart if it exists
    if (this.progressChart) {
      this.progressChart.destroy();
      this.progressChart = null;
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
    
    if (!sessions || sessions.length === 0) {
      return dailyData; // Return all zeros if no sessions
    }
    
    sessions.forEach(session => {
      if (session.status === 'completed' && session.endTime && session.results) {
        const sessionDate = new Date(session.endTime);
        const dayIndex = dates.findIndex(date => {
          const sessionDay = new Date(sessionDate);
          sessionDay.setHours(0, 0, 0, 0);
          const compareDay = new Date(date);
          compareDay.setHours(0, 0, 0, 0);
          return sessionDay.getTime() === compareDay.getTime();
        });
        
        if (dayIndex !== -1) {
          const correctAnswers = session.results.filter(r => r.isCorrect === true).length;
          dailyData[dayIndex] += correctAnswers;
        }
      }
    });
    
    return dailyData;
  }

  updateTopicPerformance(userProgress) {
    const topicsGrid = document.getElementById('topicsGrid') || document.querySelector('.topics-grid');
    if (!topicsGrid) {
      console.error('Topics grid not found');
      return;
    }

    // Clear existing content
    topicsGrid.innerHTML = '';

    // Define topic configuration
    const topicConfig = {
      'arrays': { icon: 'fa-list', name: 'Arrays' },
      'strings': { icon: 'fa-font', name: 'Strings' },
      'graphs': { icon: 'fa-project-diagram', name: 'Graphs' },
      'dynamic-programming': { icon: 'fa-brain', name: 'Dynamic Programming' },
      'trees': { icon: 'fa-sitemap', name: 'Trees' }
    };

    // Initialize topic stats with default values
    const topicStats = {};
    Object.keys(topicConfig).forEach(topic => {
      topicStats[topic] = {
        totalAttempted: 0,
        totalCorrect: 0,
        accuracy: 0
      };
    });

    // If we have progress data, aggregate it by topic
    if (userProgress && userProgress.length > 0) {
      userProgress.forEach(progress => {
        if (topicStats[progress.topic]) {
          topicStats[progress.topic].totalAttempted += (progress.totalAttempted || 0);
          topicStats[progress.topic].totalCorrect += (progress.totalCorrect || 0);
        }
      });
    }

    // Calculate accuracy for each topic
    Object.keys(topicStats).forEach(topic => {
      const stats = topicStats[topic];
      stats.accuracy = stats.totalAttempted > 0 ? 
        Math.round((stats.totalCorrect / stats.totalAttempted) * 100) : 0;
    });

    // Show all topics, even if no progress
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

    activityList.innerHTML = '';

    // Get recent sessions (last 5)
    const recentSessions = (sessions || [])
      .filter(session => session.status === 'completed' && session.endTime && session.results)
      .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))
      .slice(0, 5);

    if (recentSessions.length === 0) {
      activityList.innerHTML = '<div class="activity-item"><div class="activity-content"><p style="text-align: center; color: #e2e8f0;">No recent activity. Start practicing to see your progress here!</p></div></div>';
      return;
    }

    recentSessions.forEach(session => {
      const correctAnswers = session.results.filter(r => r.isCorrect === true).length;
      const totalQuestions = session.results.length || 0;
      const timeSpent = session.totalTime ? Math.floor(session.totalTime / 60) : 0;
      
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
        if (totalSolved === 0) {
          goalContent.textContent = 'Start practicing to track your progress!';
        } else if (progress >= 100) {
          goalContent.textContent = 'Goal achieved! Great work!';
        } else {
          goalContent.textContent = `You're ${Math.round(progress)}% of the way there!`;
        }
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
        } else if (currentStreak === 0) {
          goalContent.textContent = 'Start a practice session to begin your streak!';
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
        if (currentAccuracy === 0) {
          goalContent.textContent = 'Complete some practice sessions to track accuracy!';
        } else if (currentAccuracy >= targetAccuracy) {
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